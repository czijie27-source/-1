"""《回响·1925》原创配乐（程序合成，无第三方采样）。

情绪线：沉静压抑 → 历史追问 → 意识觉醒 → 激昂抗争 → 坚守希望 → 胜利曙光 → 精神升华
调性：D 小调为主，第六章转入 F 大调（关系大调），尾声在 F 大调上收束。
所有乐器均由振荡器、加法合成与滤波器生成；随机量使用固定种子，保证每次生成结果一致。

输出：public/audio/music.wav
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from audio_lib import (DATA_DIR, PUBLIC_AUDIO, SR, adsr, butter, make_ir, normalize_peak,  # noqa: E402
                       pan, place, reverb, rng, total_seconds, write_wav)

NOTE_INDEX = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6,
              "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def hz(name: str) -> float:
    """'D3' → 146.83Hz"""
    pitch, octave = name[:-1], int(name[-1])
    midi = 12 * (octave + 1) + NOTE_INDEX[pitch]
    return 440.0 * 2 ** ((midi - 69) / 12)


def notes(s: str) -> list[float]:
    return [hz(n) for n in s.split()]


# ───────────────────────── 振荡器与乐器 ─────────────────────────

def _polyblep(t: np.ndarray, dt: np.ndarray) -> np.ndarray:
    y = np.zeros_like(t)
    m = t < dt
    x = t[m] / dt[m]
    y[m] = x + x - x * x - 1
    m = t > 1 - dt
    x = (t[m] - 1) / dt[m]
    y[m] = x * x + x + x + 1
    return y


def saw(freq: float, n: int, cents: float = 0.0, vib_rate: float = 5.0, vib_depth: float = 0.0,
        vib_delay: float = 0.6, seed: int = 0) -> np.ndarray:
    r = rng(seed)
    t = np.arange(n) / SR
    vib_env = np.clip((t - vib_delay) / 1.2, 0, 1)
    f = freq * 2 ** (cents / 1200) * (1 + vib_depth * vib_env * np.sin(2 * np.pi * vib_rate * t + r.uniform(0, 6.28)))
    ph = (np.cumsum(f) / SR + r.uniform(0, 1)) % 1.0
    return (2 * ph - 1 - _polyblep(ph, f / SR)).astype(np.float32)


def strings(freqs: list[float], dur: float, vel: float = 0.5, attack: float = 1.5, release: float = 2.0,
            cutoff: float = 2400, voices: int = 5, width: float = 0.7, seed: int = 1,
            tremolo: float = 0.0) -> np.ndarray:
    """弦乐群：每个音由多支轻微失谐的锯齿波组成，带延迟颤音与低通滤波。"""
    n = int((dur + release) * SR)
    out = np.zeros((n, 2), dtype=np.float32)
    for i, f in enumerate(freqs):
        for v in range(voices):
            s = seed * 1000 + i * 37 + v
            cents = (v - (voices - 1) / 2) * 7 + rng(s).uniform(-3, 3)
            x = saw(f, n, cents, rng(s).uniform(4.6, 5.6), 0.0035, 0.5, s)
            p = ((v / max(voices - 1, 1)) * 2 - 1) * width
            out += pan(x, p) / voices
    out /= max(len(freqs), 1) ** 0.5
    out = butter(out, "low", cutoff, 2)
    out = butter(out, "high", 60, 1)
    env = adsr(n, attack, 0.5, 0.85, release)
    if tremolo:
        t = np.arange(n) / SR
        env = env * (0.72 + 0.28 * np.sin(2 * np.pi * tremolo * t))
    return out * env[:, None] * vel


def brass(freqs: list[float], dur: float, vel: float = 0.5, attack: float = 0.35, release: float = 1.2,
          seed: int = 7) -> np.ndarray:
    """铜管质感：暗/亮两种滤波版本随包络交叉淡化，模拟吹奏时音色逐渐打开。"""
    n = int((dur + release) * SR)
    raw = np.zeros((n, 2), dtype=np.float32)
    for i, f in enumerate(freqs):
        for v in range(3):
            raw += pan(saw(f, n, (v - 1) * 5, 5.2, 0.002, 0.4, seed + i * 11 + v), (v - 1) * 0.35) / 3
    raw /= max(len(freqs), 1) ** 0.5
    dark = butter(raw, "low", 650, 2)
    bright = butter(raw, "low", 2600, 2)
    t = np.arange(n) / SR
    open_env = np.clip(t / (attack * 2.5), 0, 1) ** 0.7 * np.exp(-np.maximum(t - dur, 0) * 2)
    out = dark * (1 - open_env[:, None]) + bright * open_env[:, None]
    return butter(out, "high", 70, 1) * adsr(n, attack, 0.6, 0.8, release)[:, None] * vel


def choir(freqs: list[float], dur: float, vel: float = 0.4, attack: float = 2.0, release: float = 2.5,
          seed: int = 21) -> np.ndarray:
    """“啊”元音人声垫：锯齿波经过三组共振峰带通。"""
    n = int((dur + release) * SR)
    raw = np.zeros((n, 2), dtype=np.float32)
    for i, f in enumerate(freqs):
        for v in range(4):
            raw += pan(saw(f, n, (v - 1.5) * 6, 5.0, 0.006, 0.3, seed + i * 13 + v), (v - 1.5) * 0.4) / 4
    raw /= max(len(freqs), 1) ** 0.5
    out = (butter(raw, "band", [600, 850], 2) * 1.0 + butter(raw, "band", [1050, 1350], 2) * 0.55
           + butter(raw, "band", [2400, 2900], 2) * 0.25)
    return out * adsr(n, attack, 0.5, 0.9, release)[:, None] * vel * 2.2


def piano(freq: float, vel: float = 0.5, dur: float = 4.0, seed: int = 3) -> np.ndarray:
    """加法合成的钢琴：带非谐性泛音与击弦噪声。用作“矿灯”主题动机。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n, dtype=np.float32)
    b = 0.00035
    for k in range(1, 10):
        fk = k * freq * np.sqrt(1 + b * k * k)
        if fk > 12000:
            break
        x += (1 / k ** 1.3) * np.exp(-t * (0.55 + 0.38 * k)) * np.sin(2 * np.pi * fk * t + k)
    click = butter(rng(seed).standard_normal(n).astype(np.float32), "band", [900, 4000], 2)
    x += click * np.exp(-t * 80) * 0.15
    x *= np.minimum(1, t / 0.004)
    p = np.clip((np.log2(freq / 261.6)) * 0.35, -0.6, 0.6)
    return pan(x * vel * 0.5, float(p))


def timpani(freq: float, vel: float = 0.6, seed: int = 5) -> np.ndarray:
    n = int(2.8 * SR)
    t = np.arange(n) / SR
    f = freq * (1 + 0.1 * np.exp(-t * 40))
    ph = np.cumsum(f) / SR
    x = np.sin(2 * np.pi * ph) * np.exp(-t * 1.7) + 0.4 * np.sin(2 * np.pi * 1.5 * ph) * np.exp(-t * 3.5)
    nz = butter(rng(seed).standard_normal(n).astype(np.float32), "band", [120, 700], 2) * np.exp(-t * 35)
    return pan((x + nz * 0.7).astype(np.float32) * vel, 0.0)


def drum(vel: float = 0.6, low: float = 58, seed: int = 9) -> np.ndarray:
    """低沉的大鼓（类似堂鼓/太鼓）"""
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    f = low * (1 + 0.9 * np.exp(-t * 30))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.2)
    skin = butter(rng(seed).standard_normal(n).astype(np.float32), "band", [150, 1200], 2) * np.exp(-t * 45)
    return pan((x * 1.0 + skin * 0.5).astype(np.float32) * vel, 0.0)


def snare_brush(vel: float = 0.2, seed: int = 11) -> np.ndarray:
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    x = butter(rng(seed).standard_normal(n).astype(np.float32), "band", [1500, 6000], 2) * np.exp(-t * 18)
    return pan(x * vel, 0.15)


def impact(vel: float = 0.8, seed: int = 13) -> np.ndarray:
    """低频冲击：用于重要日期出现。"""
    n = int(4.0 * SR)
    t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(42 * (1 + 0.6 * np.exp(-t * 12))) / SR) * np.exp(-t * 1.1)
    body = butter(rng(seed).standard_normal(n).astype(np.float32), "low", 320, 2) * np.exp(-t * 5)
    return pan((sub + body * 0.9).astype(np.float32) * vel, 0.0)


def drone(freq: float, dur: float, vel: float = 0.3, seed: int = 15) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t + 1)
    x = (np.sin(2 * np.pi * freq * t) * 0.8 + butter(saw(freq * 2, n, 0, 0.1, 0, 0, seed), "low", 300, 2) * 0.35)
    env = np.minimum(1, t / 3.0) * np.minimum(1, (dur - t) / 3.0)
    return pan((x * lfo * env).astype(np.float32) * vel, 0.0)


def shimmer(freqs: list[float], dur: float, vel: float = 0.12) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2), dtype=np.float32)
    for i, f in enumerate(freqs):
        x = np.sin(2 * np.pi * f * t) * (0.6 + 0.4 * np.sin(2 * np.pi * (0.3 + 0.11 * i) * t + i))
        out += pan(x.astype(np.float32), (i % 2) * 1.2 - 0.6)
    env = np.minimum(1, t / 2.5) * np.minimum(1, np.maximum(dur - t, 0) / 2.5)
    return out * env[:, None] * vel / max(len(freqs), 1) ** 0.5


def spiccato(freq: float, vel: float = 0.3, seed: int = 17) -> np.ndarray:
    n = int(0.42 * SR)
    x = np.zeros((n, 2), dtype=np.float32)
    for v in range(3):
        x += pan(saw(freq, n, (v - 1) * 8, 5, 0, 1, seed + v), (v - 1) * 0.5) / 3
    x = butter(x, "low", 1400, 2)
    t = np.arange(n) / SR
    return x * (np.minimum(1, t / 0.012) * np.exp(-t * 9))[:, None] * vel


# ───────────────────────── 乐谱 ─────────────────────────

def compose() -> np.ndarray:
    total = total_seconds()
    beats = json.loads((DATA_DIR / "beats.json").read_text(encoding="utf-8"))
    n = int(total * SR)
    pads = np.zeros((n, 2), dtype=np.float32)   # 长音（弦乐、人声、铜管）
    perc = np.zeros((n, 2), dtype=np.float32)   # 打击乐
    keys = np.zeros((n, 2), dtype=np.float32)   # 钢琴动机

    def chord(t0: float, t1: float, spec: str, vel: float, bus=pads, fn=strings, **kw):
        place(bus, fn(notes(spec), t1 - t0, vel, **kw), t0)

    # 矿灯动机：D–F–A–G（上行而后回落，像一盏灯在黑暗中亮起又摇曳）
    def lamp_motif(t: float, octave: int = 4, vel: float = 0.45, step: float = 0.62):
        for i, nm in enumerate(["D", "F", "A", "G"]):
            place(keys, piano(hz(f"{nm}{octave}"), vel * (1 - i * 0.08), 4.5, seed=31 + i), t + i * step)

    # ── 01 序幕 0–15：低频持续音 + 弦乐缓慢进入，形成悬念
    place(pads, drone(hz("D1"), 16.5, 0.34), 0.0)
    chord(3.2, 9.0, "D3 A3", 0.20, attack=4.0, release=2.5, cutoff=900)
    chord(8.6, 15.4, "D3 F3 A3 D4", 0.24, attack=2.5, release=2.0, cutoff=1500)
    place(pads, shimmer(notes("A5 D6 F6"), 7.0, 0.05), beats["opening"]["titleIn"])
    place(perc, timpani(hz("D2"), 0.32), beats["opening"]["titleIn"] - 0.05)
    lamp_motif(beats["opening"]["lampClink"] + 1.2, 4, 0.22, 0.9)

    # ── 02 时代背景 15–42：压抑的小调进行 Dm | Bb | Gm | A
    prog2 = [("D2 D3 F3 A3", 15.0, 21.8), ("Bb1 D3 F3 Bb3", 21.8, 28.5), ("G1 D3 G3 Bb3", 28.5, 35.2), ("A1 E3 A3 C#4", 35.2, 42.0)]
    for spec, a, b in prog2:
        chord(a - 0.3, b + 0.2, spec, 0.24, attack=2.2, release=2.2, cutoff=1300)
    place(pads, drone(hz("D1"), 27.5, 0.18), 14.8)
    chord(37.5, 42.2, "A4 E5", 0.08, attack=3.0, release=1.5, cutoff=3000)  # 悄然积聚的张力
    lamp_motif(30.0, 4, 0.30)
    for k, t in enumerate(np.arange(16.0, 41.0, 4.2)):
        place(perc, timpani(hz("D2") if k % 2 == 0 else hz("A1"), 0.12), float(t))

    # ── 03 时代觉醒 42–70：节奏增强，八分音符固定音型 + 鼓点，渐强至骤停
    prog3 = [("D2 D3 F3 A3", 42.0, 48.0, "D3"), ("C2 C3 E3 G3", 48.0, 54.0, "C3"), ("Bb1 D3 F3 Bb3", 54.0, 60.0, "Bb2"),
             ("G1 D3 G3 Bb3", 60.0, 64.5, "G2"), ("A1 E3 A3 C#4", 64.5, 69.9, "A2")]
    eighth = 60 / 84 / 2
    for spec, a, b, osti in prog3:
        grow = (a - 42) / 28
        chord(a - 0.2, b, spec, 0.20 + 0.14 * grow, attack=1.2, release=0.6, cutoff=1500 + 1500 * grow)
        if a >= 48:
            for j, t in enumerate(np.arange(a, b - 0.05, eighth)):
                accent = 1.0 if j % 4 == 0 else 0.6
                place(perc, spiccato(hz(osti), (0.10 + 0.14 * grow) * accent, seed=40 + j % 7), float(t))
    for j, t in enumerate(np.arange(48.0, 69.8, eighth * 4)):
        g = (t - 48) / 22
        place(perc, drum(0.22 + 0.4 * g, seed=50 + j % 5), float(t))
        if t > 60 and j % 2 == 1:
            place(perc, drum(0.18 + 0.3 * g, 70, seed=60 + j % 5), float(t + eighth * 2))
    chord(beats["awakening"]["silenceText"] - 0.5, 69.95, "A4 C#5 E5", 0.12, fn=brass, attack=1.2, release=0.05)

    # ── 04 七月九日 70–102：骤停 → 汽笛 → 机器停转（弦乐震音）→ 一盏盏矿灯（高音逐个进入）→ 高潮
    sb = beats["strike"]
    place(perc, impact(0.9), sb["date"] - 0.02)
    chord(sb["boiler"] - 0.5, sb["lamps"] + 0.4, "D2 A2 D3", 0.22, tremolo=11.0, attack=1.5, release=1.5, cutoff=1100)
    for k, t in enumerate(np.arange(sb["boiler"], sb["flywheelStop"], 1.0)):
        place(perc, timpani(hz("D2"), 0.30 * (1 - k * 0.1)), float(t + k * 0.12 * k))  # 逐渐减速的鼓
    lamp_notes = ["D4", "F4", "A4", "D5", "F5"]
    for i, nm in enumerate(lamp_notes):
        t = sb["lamps"] + 0.6 + i * 0.9
        place(pads, strings([hz(nm)], 13.5 - i * 0.9, 0.10, attack=1.0, release=2.0, cutoff=3500, voices=3, seed=70 + i), t)
        place(keys, piano(hz(nm), 0.28, 4.0, seed=80 + i), t)
    chord(sb["walkout"], sb["crowd"], "D2 A2 D3 F3 A3", 0.26, attack=2.5, release=1.0, cutoff=1800)
    for j, t in enumerate(np.arange(sb["walkout"], 101.8, 60 / 72)):
        g = min(1, (t - sb["walkout"]) / 8)
        place(perc, drum(0.25 + 0.35 * g, seed=90 + j % 6), float(t))
        if j % 4 == 0:
            place(perc, timpani(hz("D2"), 0.35 + 0.2 * g), float(t))
    prog4 = [("D2 D3 F3 A3 D4", 95.0, 97.4), ("Bb1 D3 F3 Bb3 D4", 97.4, 99.2), ("F2 C3 F3 A3 C4", 99.2, 100.6), ("C2 C3 E3 G3 C4", 100.6, 102.3)]
    for spec, a, b in prog4:
        chord(a, b, spec, 0.34, attack=0.6, release=0.8, cutoff=3200)
        chord(a, b, spec.split()[2] + " " + spec.split()[3], 0.18, fn=brass)
    place(pads, choir(notes("D4 F4 A4"), 7.0, 0.20), 95.0)
    place(perc, impact(0.6), sb["title"])

    # ── 05 从矿井到街头 102–134：行进鼓点；宣言出现时收束；随后再度推进
    sol = beats["solidarity"]
    prog5 = [("D2 D3 F3 A3", 102.0, 105.2), ("Bb1 D3 F3 Bb3", 105.2, 108.4), ("F2 C3 F3 A3", 108.4, 111.0), ("C2 C3 E3 G3", 111.0, 113.4),
             ("D2 A2 D3", 113.4, 122.4),
             ("Bb1 D3 F3 Bb3", 122.4, 125.4), ("F2 C3 F3 A3", 125.4, 128.4), ("G2 D3 G3 Bb3", 128.4, 131.2), ("A1 E3 A3 C#4", 131.2, 134.2)]
    for spec, a, b in prog5:
        quiet = sol["document"] <= a < sol["river"]
        chord(a, b, spec, 0.16 if quiet else 0.26, attack=0.9 if not quiet else 2.5, release=1.2, cutoff=1000 if quiet else 2400)
    march = 60 / 76
    for j, t in enumerate(np.arange(102.0, 133.9, march)):
        if sol["document"] - 0.3 <= t < sol["river"]:
            continue
        g = 0.75 + 0.25 * (j % 4 == 0)
        place(perc, drum(0.36 * g, seed=100 + j % 6), float(t))
        place(perc, snare_brush(0.10, seed=110 + j % 5), float(t + march / 2))
        if j % 2 == 0:
            place(perc, spiccato(hz("D3"), 0.14, seed=120 + j % 7), float(t))
            place(perc, spiccato(hz("D3"), 0.10, seed=121 + j % 7), float(t + march / 2))
    lamp_motif(sol["document"] + 1.2, 5, 0.18, 0.75)
    place(perc, timpani(hz("D2"), 0.4), sol["document"])
    chord(sol["river"] + 3.5, 134.0, "A4 C#5 E5", 0.11, fn=brass, attack=2.0, release=0.8)

    # ── 06 八个月 134–161：低沉 → 合同签订 → 转入温暖的 F 大调
    pe = beats["persistence"]
    prog6 = [("D2 D3 F3 A3", 134.0, 139.5), ("Bb1 D3 F3 Bb3", 139.5, 144.0), ("G1 D3 G3 Bb3", 144.0, 148.4),
             ("F2 C3 F3 A3", 148.4, 151.0), ("Bb1 D3 F3 Bb3", 151.0, 153.5), ("C2 C3 E3 G3", 153.5, 157.0),
             ("F2 C3 F3 A3 C4", 157.0, 161.4)]
    for i, (spec, a, b) in enumerate(prog6):
        warm = a >= pe["contract"]
        chord(a - 0.2, b, spec, 0.18 + (0.07 if warm else 0), attack=1.8, release=1.6, cutoff=1600 if warm else 1000)
    lamp_motif(134.6, 4, 0.30, 0.8)
    lamp_motif(144.2, 3, 0.20, 1.0)
    place(perc, impact(0.55), pe["contract"])
    place(perc, impact(0.45), pe["resumption"])
    for i, nm in enumerate(["C5", "D5", "F5", "A5", "G5", "F5"]):
        place(keys, piano(hz(nm), 0.24, 4, seed=140 + i), pe["victory"] - 3.4 + i * 0.6)
    place(pads, choir(notes("F4 A4 C5"), 4.8, 0.14), pe["victory"])

    # ── 07 精神回响 161–188：情感升华，厚重弦乐 + 缓慢鼓点 + 温暖和声
    sp = beats["spirit"]
    prog7 = [("F2 C3 F3 A3", 161.0, 164.0), ("C2 C3 E3 G3", 164.0, 167.0), ("D2 D3 F3 A3", 167.0, 169.8), ("Bb1 D3 F3 Bb3", 169.8, 172.4),
             ("F2 C3 F3 A3 C4 F4", 172.4, 175.4), ("C2 C3 G3 C4 E4", 175.4, 178.0), ("D2 D3 A3 D4 F4", 178.0, 181.5),
             ("Bb1 D3 F3 Bb3 D4", 181.5, 184.5), ("C2 C3 G3 C4 E4", 184.5, 186.4), ("F2 C3 F3 A3 C4", 186.4, 188.3)]
    for spec, a, b in prog7:
        lift = (a - 161) / 27
        chord(a - 0.2, b, spec, 0.24 + 0.1 * lift, attack=1.2, release=1.4, cutoff=1800 + 1600 * lift)
    place(pads, choir(notes("A3 C4 F4"), 6.0, 0.16), sp["beams"])
    place(pads, choir(notes("C4 F4 A4"), 15.5, 0.22), sp["slogan"])
    chord(sp["slogan"], sp["unity"], "F3 A3 C4", 0.20, fn=brass, attack=0.8)
    place(perc, impact(0.7), sp["slogan"] - 0.05)
    for j, t in enumerate(np.arange(sp["slogan"], 187.9, 60 / 66)):
        place(perc, drum(0.24 if j % 2 == 0 else 0.15, seed=150 + j % 6), float(t))
        if j % 4 == 0:
            place(perc, timpani(hz("F2"), 0.28), float(t))
    for nm, t in [("A5", sp["unity"]), ("C6", sp["struggle"]), ("F6", sp["patriotism"])]:
        place(pads, shimmer([hz(nm)], 4.0, 0.05), t)

    # ── 08 尾声 188–210：温暖、坚定的收束，最后只剩矿灯与尾音
    en = beats["ending"]
    prog8 = [("Bb1 D3 F3 Bb3", 188.0, 192.5), ("F2 C3 F3 A3", 192.5, 197.5), ("G2 D3 G3 Bb3", 197.5, 201.0),
             ("C2 C3 G3 C4 E4", 201.0, 203.0)]
    for spec, a, b in prog8:
        chord(a - 0.2, b, spec, 0.24, attack=1.6, release=1.5, cutoff=2600)
    place(pads, choir(notes("D4 F4 Bb4"), 4.5, 0.12), 188.0)
    lamp_motif(188.8, 4, 0.30, 0.85)
    chord(en["finalTitle"] - 0.2, 207.5, "F2 C3 F3 A3 C4 F4", 0.30, attack=2.2, release=3.0, cutoff=2400)
    place(pads, choir(notes("F4 A4 C5"), 6.0, 0.16), en["finalTitle"])
    place(pads, shimmer(notes("C6 F6 A6"), 7.0, 0.06), en["finalTitle"])
    place(perc, timpani(hz("F2"), 0.35), en["finalTitle"])
    lamp_motif(en["finalSlogan"] + 0.4, 5, 0.16, 1.0)
    place(pads, drone(hz("F1"), 9.0, 0.16), 201.0)

    mix = pads * 1.0 + perc * 0.9 + keys * 0.8
    # 骤停：七月九日前的黑场静默（70.0–71.0 s）
    t = np.arange(n) / SR
    gate = np.ones(n, dtype=np.float32)
    gate[(t >= 69.95) & (t < 70.98)] = 0.0
    k = int(0.04 * SR)
    i0 = int(69.95 * SR)
    gate[i0 - k:i0] = np.linspace(1, 0, k)
    mix = mix * gate[:, None]

    hall = make_ir(3.4, 3.0, seed=2025, bright=5200)
    mix = reverb(mix, hall, 0.30)
    mix = mix * gate[:, None]  # 混响尾音也在黑场处截断，保持静默段干净
    mix = butter(mix, "high", 30, 2)
    # 柔和限制 + 首尾淡入淡出
    mix = np.tanh(mix * 1.3) / 1.3
    fade_in = np.minimum(1, t / 2.0)
    fade_out = np.clip((total - t) / 3.2, 0, 1) ** 1.5
    mix = mix * (fade_in * fade_out)[:, None]
    return normalize_peak(mix, -2.0)


def main() -> int:
    print("▶ 合成原创配乐 …")
    music = compose()
    write_wav(PUBLIC_AUDIO / "music.wav", music)
    print(f"✓ public/audio/music.wav  ({len(music) / SR:.1f}s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
