"""音频通用工具：读写、重采样、滤波、混响、包络。全部为确定性计算（固定随机种子）。"""
from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
PUBLIC_AUDIO = ROOT / "public" / "audio"
DATA_DIR = ROOT / "src" / "data"


def load_script() -> dict:
    with open(DATA_DIR / "script.json", encoding="utf-8") as f:
        return json.load(f)


def total_seconds() -> float:
    return float(load_script()["durationSeconds"])


def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def read_audio(path: str | os.PathLike, sr: int = SR) -> np.ndarray:
    """读取任意 wav/flac/mp3（mp3 依赖 ffmpeg），返回单声道 float32，采样率 sr。"""
    path = str(path)
    if path.lower().endswith(".mp3"):
        import subprocess
        raw = subprocess.run(
            ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
            check=True, capture_output=True,
        ).stdout
        return np.frombuffer(raw, dtype=np.float32).copy()
    x, file_sr = sf.read(path, dtype="float32", always_2d=True)
    x = x.mean(axis=1)
    return resample(x, file_sr, sr)


def resample(x: np.ndarray, sr_in: int, sr_out: int) -> np.ndarray:
    if sr_in == sr_out:
        return x.astype(np.float32)
    g = np.gcd(sr_in, sr_out)
    return signal.resample_poly(x, sr_out // g, sr_in // g).astype(np.float32)


def write_wav(path: str | os.PathLike, x: np.ndarray, sr: int = SR) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    sf.write(str(path), np.clip(x, -1, 1).astype(np.float32), sr, subtype="PCM_16")


def butter(x: np.ndarray, kind: str, freq, order: int = 2, sr: int = SR) -> np.ndarray:
    sos = signal.butter(order, freq, btype=kind, fs=sr, output="sos")
    return signal.sosfilt(sos, x, axis=0).astype(np.float32)


def peaking(x: np.ndarray, f0: float, gain_db: float, q: float = 1.0, sr: int = SR) -> np.ndarray:
    a = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / sr
    alpha = np.sin(w0) / (2 * q)
    b = [1 + alpha * a, -2 * np.cos(w0), 1 - alpha * a]
    den = [1 + alpha / a, -2 * np.cos(w0), 1 - alpha / a]
    return signal.lfilter(np.array(b) / den[0], np.array(den) / den[0], x, axis=0).astype(np.float32)


def adsr(n: int, a: float, d: float, s: float, r: float, sr: int = SR) -> np.ndarray:
    a_n, d_n, r_n = int(a * sr), int(d * sr), int(r * sr)
    s_n = max(n - a_n - d_n - r_n, 0)
    env = np.concatenate([
        np.linspace(0, 1, max(a_n, 1)) ** 1.5,
        np.linspace(1, s, max(d_n, 1)),
        np.full(s_n, s),
        np.linspace(s, 0, max(r_n, 1)) ** 1.2,
    ])
    if len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return env[:n].astype(np.float32)


def make_ir(seconds: float, decay: float, seed: int, bright: float = 6000.0, sr: int = SR) -> np.ndarray:
    """合成的立体声混响冲激响应（指数衰减噪声 + 早期反射），用于营造空间感。"""
    r = rng(seed)
    n = int(seconds * sr)
    t = np.arange(n) / sr
    ir = np.zeros((n, 2), dtype=np.float32)
    for ch in range(2):
        noise = r.standard_normal(n).astype(np.float32)
        noise = butter(noise, "low", bright, 1)
        ir[:, ch] = noise * np.exp(-t * (6.9 / decay))
        for k in range(8):  # early reflections
            pos = int(r.uniform(0.008, 0.07) * sr)
            ir[pos, ch] += r.uniform(0.2, 0.5) * (1 if r.random() > 0.5 else -1)
    ir[: int(0.004 * sr)] *= np.linspace(0, 1, int(0.004 * sr))[:, None]
    return ir / np.sqrt((ir ** 2).sum(axis=0, keepdims=True))


def reverb(x: np.ndarray, ir: np.ndarray, wet: float) -> np.ndarray:
    """x: (n,) 或 (n,2)；返回 (n,2)。"""
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    out = np.zeros_like(x)
    for ch in range(2):
        out[:, ch] = signal.fftconvolve(x[:, ch], ir[:, ch])[: len(x)]
    return ((1 - wet) * x + wet * out).astype(np.float32)


def pan(x: np.ndarray, p: float) -> np.ndarray:
    """等功率声像，p ∈ [-1, 1]。"""
    ang = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(ang), x * np.sin(ang)], axis=1).astype(np.float32)


def place(track: np.ndarray, clip: np.ndarray, t: float, gain: float = 1.0, sr: int = SR) -> None:
    """把 clip 叠加到 track 的 t 秒位置（自动裁剪越界部分）。"""
    if clip.ndim == 1 and track.ndim == 2:
        clip = np.stack([clip, clip], axis=1)
    start = int(round(t * sr))
    if start >= len(track):
        return
    if start < 0:
        clip = clip[-start:]
        start = 0
    end = min(len(track), start + len(clip))
    track[start:end] += clip[: end - start] * gain


def db(v: float) -> float:
    return 10 ** (v / 20)


def normalize_peak(x: np.ndarray, peak_db: float = -1.0) -> np.ndarray:
    m = np.max(np.abs(x)) + 1e-9
    return (x / m * db(peak_db)).astype(np.float32)


def rms_db(x: np.ndarray) -> float:
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-9)
