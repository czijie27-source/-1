"""旁白生成与时间轴排布。

来源（按优先级，可用 --source 指定）：
  cues     public/audio/narration_cues/<cue-id>.wav|mp3 —— 自己录制的逐句配音（最高优先级）
  file     public/audio/narration_input.wav|mp3 —— 已按 210 秒时间轴录好的整条旁白
  kokoro   离线中文神经网络 TTS（sherpa-onnx + Kokoro v1.1-zh，无需联网）

输出：
  public/audio/narration.wav             旁白音轨（48kHz，与视频等长）
  src/data/narration.timing.json         每条字幕/旁白的起止时间（供画面与 SRT 使用）
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from audio_lib import (DATA_DIR, PUBLIC_AUDIO, ROOT, SR, butter, load_script, peaking,  # noqa: E402
                       read_audio, resample, rms_db, write_wav)

CACHE = ROOT / ".cache" / "tts"
DEFAULT_MODEL_DIR = ROOT / "models" / "kokoro-multi-lang-v1_1"


def model_dir() -> Path:
    return Path(os.environ.get("KOKORO_DIR", DEFAULT_MODEL_DIR))


class KokoroVoice:
    def __init__(self, speaker_id: int):
        import sherpa_onnx  # 仅在使用 TTS 时需要

        d = model_dir()
        if not (d / "model.onnx").exists():
            raise FileNotFoundError(f"未找到 Kokoro 模型：{d}（运行 python3 scripts/download_models.py）")
        p = lambda n: str(d / n)  # noqa: E731
        cfg = sherpa_onnx.OfflineTtsConfig(
            model=sherpa_onnx.OfflineTtsModelConfig(
                kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                    model=p("model.onnx"), voices=p("voices.bin"), tokens=p("tokens.txt"),
                    lexicon=p("lexicon-us-en.txt") + "," + p("lexicon-zh.txt"),
                    data_dir=p("espeak-ng-data"), dict_dir=p("dict"),
                ),
                num_threads=max(1, os.cpu_count() or 1),
            ),
            rule_fsts=",".join(p(n) for n in ("date-zh.fst", "phone-zh.fst", "number-zh.fst")),
        )
        self.tts = sherpa_onnx.OfflineTts(cfg)
        self.sid = speaker_id

    def say(self, text: str, speed: float) -> np.ndarray:
        key = hashlib.sha1(f"kokoro|{self.sid}|{speed:.3f}|{text}".encode()).hexdigest()[:16]
        f = CACHE / f"{key}.npy"
        if f.exists():
            return np.load(f)
        # 书名号、引号不在词表内，读音不受影响，提前去掉避免告警
        clean = re.sub(r"[《》“”‘’]", "", text)
        audio = self.tts.generate(clean, sid=self.sid, speed=speed)
        x = resample(np.asarray(audio.samples, dtype=np.float32), audio.sample_rate, SR)
        CACHE.mkdir(parents=True, exist_ok=True)
        np.save(f, x)
        return x


def trim_silence(x: np.ndarray, thresh_db: float = -45) -> np.ndarray:
    win = int(0.01 * SR)
    if len(x) < win * 4:
        return x
    frames = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, mode="same"))
    idx = np.where(frames > 10 ** (thresh_db / 20))[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(0.03 * SR))
    b = min(len(x), idx[-1] + int(0.08 * SR))
    return x[a:b]


def voice_polish(x: np.ndarray) -> np.ndarray:
    """纪录片解说式的轻度处理：低切、去浑、提一点胸腔与清晰度、柔和压缩、统一响度。"""
    x = butter(x, "high", 75, 2)
    x = peaking(x, 160, 1.8, 0.8)
    x = peaking(x, 420, -1.5, 1.2)
    x = peaking(x, 3200, 1.6, 0.9)
    x = butter(x, "low", 12500, 2)
    win = int(0.03 * SR)
    env = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, mode="same")) + 1e-6
    over = np.maximum(20 * np.log10(env) - (-22), 0)
    x = x * 10 ** (-(over * (1 - 1 / 2.5)) / 20)
    voiced = x[np.abs(x) > 0.003]
    x = x * 10 ** ((-19.0 - rms_db(voiced if len(voiced) else x)) / 20)
    fade = int(0.012 * SR)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    return x.astype(np.float32)


def default_pause(cue: dict) -> float:
    if "pause" in cue:
        return float(cue["pause"])
    return 0.6 if cue["tts"].rstrip().endswith(("。", "！", "？")) else 0.32


def layout_scene(scene: dict, clips: list[np.ndarray]) -> tuple[list[float], list[str]]:
    """在场景的旁白窗口内排布每句旁白，返回每句的起始时间（相对全片）。"""
    warn = []
    w0, w1 = scene["narrationWindow"]
    avail = w1 - w0
    durs = [len(c) / SR for c in clips]
    pauses = [default_pause(c) for c in scene["cues"]]
    pauses[-1] = 0.0
    speech = sum(durs)
    slack = avail - speech - sum(pauses)
    if slack < 0:
        squeeze = max(0.45, (avail - speech) / max(sum(pauses), 1e-6))
        pauses = [p * squeeze for p in pauses]
        if speech + sum(pauses) > avail + 0.05:
            warn.append(f"场景 {scene['id']} 旁白超出窗口 {speech + sum(pauses) - avail:.2f}s")
    elif len(clips) > 1:
        # 适度放宽句间停顿（每处最多 +0.45s），其余时间留在场景末尾给画面呼吸
        extra = min(0.45, slack / (len(clips) - 1) * 0.7)
        pauses = [p + extra if i < len(pauses) - 1 else 0.0 for i, p in enumerate(pauses)]
    starts, t = [], scene["start"] + w0
    for d, p in zip(durs, pauses):
        starts.append(t)
        t += d + p
    return starts, warn


def build(source: str) -> dict:
    script = load_script()
    total = float(script["durationSeconds"])
    track = np.zeros(int(total * SR), dtype=np.float32)
    timing = {"source": source, "voice": None, "cues": [], "warnings": []}
    vcfg = script["voice"]

    if source == "file":
        f = next((PUBLIC_AUDIO / n for n in ("narration_input.wav", "narration_input.mp3")
                  if (PUBLIC_AUDIO / n).exists()), None)
        if f is None:
            raise FileNotFoundError("未找到 public/audio/narration_input.wav|mp3")
        x = read_audio(f)[: len(track)]
        track[: len(x)] = x
        timing["voice"] = f"导入文件 {f.name}"
        timing["warnings"].append("整条导入的旁白无法自动对齐，字幕按旁白窗口与字数比例估算，请在 Studio 中核对。")
        for scene in script["scenes"]:
            w0, w1 = scene["narrationWindow"]
            n = [len(c["tts"]) for c in scene["cues"]]
            t = scene["start"] + w0
            for cue, k in zip(scene["cues"], n):
                d = (w1 - w0) * k / sum(n)
                timing["cues"].append({"id": cue["id"], "scene": scene["id"], "start": round(t, 3),
                                       "end": round(t + d - 0.25, 3), "lines": cue["lines"]})
                t += d
        return finish(track, timing)

    voice = None
    if source == "kokoro":
        voice = KokoroVoice(int(vcfg["speakerId"]))
        timing["voice"] = f"Kokoro v1.1-zh speaker {vcfg['speakerId']} (sherpa-onnx, offline)"
    else:
        timing["voice"] = "本地逐句录音 public/audio/narration_cues/"

    for scene in script["scenes"]:
        def render(speed: float) -> list[np.ndarray]:
            out = []
            for cue in scene["cues"]:
                if voice is not None:
                    raw = voice.say(cue["tts"], speed)
                else:
                    d = PUBLIC_AUDIO / "narration_cues"
                    f = next((d / f"{cue['id']}{e}" for e in (".wav", ".mp3", ".flac")
                              if (d / f"{cue['id']}{e}").exists()), None)
                    if f is None:
                        raise FileNotFoundError(f"缺少逐句录音：{d}/{cue['id']}.wav")
                    raw = read_audio(f)
                out.append(voice_polish(trim_silence(raw)))
            return out

        speed = float(vcfg["baseSpeed"])
        clips = render(speed)
        w0, w1 = scene["narrationWindow"]
        need = sum(len(c) / SR for c in clips) + sum(default_pause(c) for c in scene["cues"][:-1])
        if voice is not None and need > (w1 - w0):
            speed = min(float(vcfg["maxSpeed"]), speed * need / (w1 - w0) * 1.01)
            clips = render(speed)
        starts, warn = layout_scene(scene, clips)
        timing["warnings"] += warn
        for cue, clip, st in zip(scene["cues"], clips, starts):
            i = int(round(st * SR))
            n = min(len(clip), len(track) - i)
            track[i: i + n] += clip[:n]
            timing["cues"].append({
                "id": cue["id"], "scene": scene["id"], "start": round(st, 3),
                "end": round(st + len(clip) / SR, 3), "lines": cue["lines"], "speed": round(speed, 3),
            })
        last = timing["cues"][-1]["end"] - scene["start"]
        print(f"  {scene['id']:<12} 语速×{speed:.3f}  旁白 {starts[0] - scene['start']:5.1f}s → {last:5.1f}s / {scene['duration']}s")
    return finish(track, timing)


def finish(track: np.ndarray, timing: dict) -> dict:
    write_wav(PUBLIC_AUDIO / "narration.wav", track)
    with open(DATA_DIR / "narration.timing.json", "w", encoding="utf-8") as f:
        json.dump(timing, f, ensure_ascii=False, indent=1)
    for w in timing["warnings"]:
        print("  ⚠", w)
    return timing


def detect_source() -> str:
    cues = PUBLIC_AUDIO / "narration_cues"
    if cues.is_dir() and any(cues.iterdir()):
        return "cues"
    if any((PUBLIC_AUDIO / n).exists() for n in ("narration_input.wav", "narration_input.mp3")):
        return "file"
    if (model_dir() / "model.onnx").exists():
        return "kokoro"
    return "none"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", choices=["auto", "kokoro", "cues", "file"], default="auto")
    a = ap.parse_args(argv)
    src = detect_source() if a.source == "auto" else a.source
    if src == "none":
        print("✗ 旁白音轨缺失：没有可用的 TTS 模型，也没有本地录音。\n"
              "  · 运行 python3 scripts/download_models.py 下载离线 TTS 模型，或\n"
              "  · 把录音放到 public/audio/narration_cues/<cue-id>.wav 或 public/audio/narration_input.wav",
              file=sys.stderr)
        return 2
    print(f"▶ 生成旁白（来源：{src}）")
    build(src)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
