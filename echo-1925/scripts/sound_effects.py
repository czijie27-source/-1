"""环境音与关键音效（全部程序合成）。

单个音效导出到 public/audio/effects/*.wav，便于替换；
同时按 src/data/beats.json 的时间节点排布成整条音效轨 public/audio/sfx.wav。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from audio_lib import (DATA_DIR, PUBLIC_AUDIO, SR, butter, make_ir, normalize_peak, pan,  # noqa: E402
                       peaking, place, reverb, rng, total_seconds, write_wav)

EFFECTS = PUBLIC_AUDIO / "effects"


def _t(n: int) -> np.ndarray:
    return np.arange(n) / SR


def noise(n: int, seed: int) -> np.ndarray:
    return rng(seed).standard_normal(n).astype(np.float32)


def brown(n: int, seed: int) -> np.ndarray:
    x = np.cumsum(noise(n, seed)) / 60
    x = butter(x, "high", 18, 1)
    return (x / (np.max(np.abs(x)) + 1e-9)).astype(np.float32)


# ───────────── 单个音效 ─────────────

def mine_ambience(dur: float, seed: int = 1) -> np.ndarray:
    """矿井深处：低频轰鸣、远处机器嗡鸣、偶发滴水。"""
    n = int(dur * SR)
    t = _t(n)
    rumble = butter(brown(n, seed), "low", 160, 2) * 0.9
    hum = sum(np.sin(2 * np.pi * f * t + i) * a for i, (f, a) in enumerate([(50, .25), (100, .12), (150, .05)]))
    hum = hum * (0.7 + 0.3 * np.sin(2 * np.pi * 0.13 * t))
    x = rumble + hum * 0.35
    r = rng(seed + 7)
    for tt in np.cumsum(r.uniform(1.6, 4.5, 40)):
        if tt > dur - 1:
            break
        m = int(0.25 * SR)
        tm = _t(m)
        f0 = r.uniform(900, 1500)
        drip = np.sin(2 * np.pi * f0 * (1 + 0.6 * np.exp(-tm * 30)) * tm) * np.exp(-tm * 22) * 0.18
        i = int(tt * SR)
        x[i:i + m] += drip[: max(0, min(m, n - i))]
    env = np.minimum(1, t / 2.5) * np.minimum(1, (dur - t) / 2.5)
    return reverb(x * env, make_ir(2.4, 2.2, 3, 3000), 0.35)


def metal_clink(seed: int = 2) -> np.ndarray:
    """矿灯提起时的金属轻响。"""
    n = int(1.6 * SR)
    t = _t(n)
    x = np.zeros(n)
    for f, a, d in [(1870, .5, 9), (2930, .35, 12), (4410, .25, 16), (6120, .12, 22), (920, .2, 6)]:
        x += a * np.sin(2 * np.pi * f * t) * np.exp(-t * d)
    x += butter(noise(n, seed), "high", 3000, 2) * np.exp(-t * 120) * 0.4
    return reverb(x.astype(np.float32) * 0.6, make_ir(1.8, 1.6, 4, 7000), 0.3)


def cart_rolling(dur: float, speed_curve=None, seed: int = 3) -> np.ndarray:
    """旧式矿车沿轨道行进：车轮滚动的隆隆声 + 铁轨接缝的规律撞击。"""
    n = int(dur * SR)
    t = _t(n)
    sp = np.ones(n) if speed_curve is None else speed_curve(t)
    roll = butter(noise(n, seed), "band", [60, 420], 2) * (0.35 + 0.4 * sp)
    roll *= 0.8 + 0.2 * np.sin(2 * np.pi * 7.3 * np.cumsum(sp) / SR)
    x = roll.copy()
    pos, i = 0.0, 0
    period = 1.15
    clack_n = int(0.12 * SR)
    ct = _t(clack_n)
    clack = (butter(noise(clack_n, seed + 1), "band", [300, 2400], 2) * np.exp(-ct * 55)
             + np.sin(2 * np.pi * 180 * ct) * np.exp(-ct * 40) * 0.6)
    while i < n:
        s = max(sp[i], 1e-3)
        if s < 0.03:
            break
        for off in (0.0, 0.16 / s):
            j = i + int(off * SR)
            if j < n - clack_n:
                x[j:j + clack_n] += clack * 0.8 * min(1, s * 1.3)
        pos += period / s
        i = int(pos * SR)
    x = peaking(x, 2600, -4, 1.0)
    return x.astype(np.float32)


def brake_squeal(seed: int = 4) -> np.ndarray:
    n = int(1.6 * SR)
    t = _t(n)
    f = 2300 + 200 * np.sin(2 * np.pi * 3 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.2) * np.exp(-np.maximum(t - 0.8, 0) * 6)
    x += butter(noise(n, seed), "band", [1800, 3500], 2) * 0.3 * np.exp(-t * 2)
    thunk_n = int(0.6 * SR)
    th = _t(thunk_n)
    thunk = np.sin(2 * np.pi * 70 * th) * np.exp(-th * 9) + butter(noise(thunk_n, seed + 1), "low", 600, 2) * np.exp(-th * 14)
    out = x * 0.12
    out[int(1.0 * SR): int(1.0 * SR) + thunk_n] += thunk * 0.9
    return out.astype(np.float32)


def machine_clank(pitch: float = 1.0, seed: int = 5) -> np.ndarray:
    n = int(0.5 * SR)
    t = _t(n)
    x = sum(a * np.sin(2 * np.pi * f * pitch * t) * np.exp(-t * d) for f, a, d in [(140, .8, 14), (310, .5, 20), (720, .3, 30), (1530, .15, 45)])
    x += butter(noise(n, seed), "band", [400, 3000], 2) * np.exp(-t * 60) * 0.5
    return x.astype(np.float32)


def machinery(dur: float, slow_from: float | None = None, stop_at: float | None = None, seed: int = 6) -> np.ndarray:
    """蒸汽机械运转：活塞节奏的撞击 + 皮带轮的嗡鸣；可设置从某时刻开始减速直至停止。"""
    n = int(dur * SR)
    t = _t(n)
    rate = np.ones(n) * 1.6  # 次/秒
    if slow_from is not None and stop_at is not None:
        k = np.clip((t - slow_from) / (stop_at - slow_from), 0, 1)
        rate = rate * (1 - k) ** 1.6
    phase = np.cumsum(rate) / SR
    hum_f = 55 * (0.4 + 0.6 * rate / 1.6)
    hum = (np.sin(2 * np.pi * np.cumsum(hum_f) / SR) * 0.3 + np.sin(2 * np.pi * np.cumsum(hum_f * 2) / SR) * 0.15) * (rate / 1.6)
    x = hum + butter(noise(n, seed), "band", [80, 400], 2) * 0.12 * (rate / 1.6)
    hits = np.where(np.diff(np.floor(phase)) > 0)[0]
    for k, h in enumerate(hits):
        p = 0.6 + 0.4 * rate[h] / 1.6
        c = machine_clank(p, seed + k % 4) * (0.4 + 0.6 * rate[h] / 1.6)
        e = min(n, h + len(c))
        x[h:e] += c[: e - h]
    if stop_at is not None:
        i = int(stop_at * SR)
        c = machine_clank(0.5, seed + 9) * 1.2
        e = min(n, i + len(c))
        x[i:e] += c[: e - i]
    return x.astype(np.float32)


def steam_whistle(dur: float = 4.6, seed: int = 7) -> np.ndarray:
    """蒸汽汽笛：三根音管构成的和声，伴随蒸汽嘶声，起音略带音高爬升。"""
    n = int(dur * SR)
    t = _t(n)
    env = np.minimum(1, t / 0.35) ** 1.5 * np.clip((dur - t) / 1.2, 0, 1)
    rise = 1 - 0.06 * np.exp(-t * 3.5)
    x = np.zeros(n)
    for f, a in [(311, 0.6), (370, 0.5), (466, 0.4)]:
        wob = 1 + 0.003 * np.sin(2 * np.pi * 5.5 * t + f)
        ph = np.cumsum(f * rise * wob) / SR
        x += a * (np.sin(2 * np.pi * ph) + 0.35 * np.sin(4 * np.pi * ph) + 0.15 * np.sin(6 * np.pi * ph))
    hiss = butter(noise(n, seed), "band", [1800, 7000], 2) * 0.35
    out = (x * 0.55 + hiss) * env
    out = butter(out, "low", 6000, 2)
    return reverb(out.astype(np.float32), make_ir(4.5, 4.0, 8, 4000), 0.55)


def steam_hiss(dur: float, seed: int = 8) -> np.ndarray:
    """锅炉泄压、熄火时的蒸汽声，逐渐衰减。"""
    n = int(dur * SR)
    t = _t(n)
    x = butter(noise(n, seed), "band", [900, 6000], 2) * np.exp(-t * 0.9) * np.minimum(1, t / 0.15)
    crackle = np.zeros(n)
    r = rng(seed + 1)
    for tt in r.uniform(0, dur * 0.7, 25):
        i = int(tt * SR)
        m = int(0.02 * SR)
        crackle[i:i + m] += butter(noise(m, int(tt * 100)), "high", 2000, 1) * r.uniform(0.1, 0.4) * np.exp(-tt * 0.8)
    return (x * 0.5 + crackle).astype(np.float32)


def bell(seed: int = 9) -> np.ndarray:
    """远处的钟声（非谐泛音），大量混响与高频衰减营造距离感。"""
    n = int(7 * SR)
    t = _t(n)
    f0 = 196.0
    x = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * d) for r, a, d in
            [(0.5, .5, .5), (1.0, .8, .7), (1.19, .45, .9), (1.5, .35, 1.1), (2.0, .3, 1.4), (2.74, .2, 2), (3.76, .12, 2.6)])
    x = butter(x.astype(np.float32), "low", 2500, 2)
    return reverb(x * 0.5, make_ir(5, 4.5, 10, 2500), 0.6)


def crowd(dur: float, density: float = 1.0, seed: int = 10) -> np.ndarray:
    """人群环境声：多层带通噪声 + 随机“说话声”音节，营造远处人群的低语与呼应。"""
    n = int(dur * SR)
    t = _t(n)
    base = butter(noise(n, seed), "band", [250, 1600], 2) * 0.3
    base *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.21 * t + 1)
    out = np.stack([base, base[::-1]], axis=1)
    r = rng(seed + 1)
    count = int(dur * 9 * density)
    for k in range(count):
        tt = r.uniform(0, dur - 0.5)
        m = int(r.uniform(0.12, 0.35) * SR)
        tm = _t(m)
        f0 = r.uniform(100, 220)
        syl = np.sin(2 * np.pi * f0 * (1 + 0.05 * np.sin(2 * np.pi * 4 * tm)) * tm)
        syl = sum(np.sin(2 * np.pi * f0 * h * tm) / h for h in range(1, 6))
        syl = butter(syl.astype(np.float32), "band", [r.uniform(350, 600), r.uniform(1200, 2200)], 1)
        syl *= np.sin(np.pi * tm / tm[-1]) * r.uniform(0.04, 0.12)
        place(out, pan(syl, r.uniform(-0.9, 0.9)), tt)
    env = np.minimum(1, t / 2) * np.minimum(1, (dur - t) / 2)
    return reverb(out * env[:, None], make_ir(2.5, 2.0, 11, 3500), 0.4)


def footsteps(dur: float, people: int = 30, pace: float = 1.8, seed: int = 12) -> np.ndarray:
    """群众脚步声：每个人的步伐频率略有不同，叠加形成队伍行进的质感。"""
    n = int(dur * SR)
    out = np.zeros((n, 2), dtype=np.float32)
    r = rng(seed)
    m = int(0.09 * SR)
    tm = _t(m)
    for p in range(people):
        period = 1 / (pace * r.uniform(0.9, 1.1))
        tt = r.uniform(0, period)
        g = r.uniform(0.15, 0.6) / np.sqrt(people / 10)
        pp = r.uniform(-0.9, 0.9)
        k = 0
        while tt < dur - 0.1:
            step = (butter(noise(m, seed * 100 + p * 7 + k % 5), "band", [120, 1800], 2) * np.exp(-tm * 50)
                    + np.sin(2 * np.pi * 85 * tm) * np.exp(-tm * 45) * 0.5)
            place(out, pan(step.astype(np.float32) * g * r.uniform(0.7, 1.0), pp), tt)
            tt += period * r.uniform(0.96, 1.04)
            k += 1
    t = _t(n)
    env = np.minimum(1, t / 2.5) * np.minimum(1, (dur - t) / 2)
    return butter(out * env[:, None], "low", 3000, 2)


def lamp_ignite(seed: int = 13) -> np.ndarray:
    """矿灯点亮：火焰“噗”的一声与轻微的金属响。"""
    n = int(1.4 * SR)
    t = _t(n)
    whoosh = butter(noise(n, seed), "band", [200, 2500], 2) * np.minimum(1, t / 0.05) * np.exp(-t * 4) * 0.5
    tink = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in [(2400, .15, 18), (3650, .08, 25)])
    return (whoosh + tink).astype(np.float32)


def paper(dur: float = 0.8, seed: int = 14) -> np.ndarray:
    """纸张翻动/摩擦声。"""
    n = int(dur * SR)
    t = _t(n)
    r = rng(seed)
    env = np.zeros(n)
    for k in range(6):
        c = r.uniform(0.05, dur - 0.1)
        env += np.exp(-((t - c) / r.uniform(0.02, 0.08)) ** 2) * r.uniform(0.3, 1)
    x = butter(noise(n, seed), "band", [1200, 9000], 2) * env
    return (x * 0.35).astype(np.float32)


def wind(dur: float, seed: int = 15) -> np.ndarray:
    """冬夜寒风：带通噪声中心频率缓慢漂移。"""
    n = int(dur * SR)
    t = _t(n)
    a = butter(noise(n, seed), "band", [300, 900], 2)
    b = butter(noise(n, seed + 1), "band", [700, 1800], 2)
    mix = 0.5 + 0.5 * np.sin(2 * np.pi * 0.17 * t)
    gust = 0.6 + 0.4 * np.sin(2 * np.pi * 0.09 * t + 2) ** 2
    x = (a * mix + b * (1 - mix) * 0.6) * gust
    env = np.minimum(1, t / 2) * np.minimum(1, (dur - t) / 2)
    return (x * env * 0.5).astype(np.float32)


def pick_strike(seed: int = 16) -> np.ndarray:
    """矿镐凿击煤层。"""
    n = int(0.6 * SR)
    t = _t(n)
    x = (butter(noise(n, seed), "band", [250, 3500], 2) * np.exp(-t * 30)
         + sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in [(620, .3, 25), (1340, .2, 35)]))
    debris = butter(noise(n, seed + 1), "band", [2000, 8000], 2) * np.exp(-np.maximum(t - 0.05, 0) * 8) * (t > 0.05) * 0.1
    return reverb((x + debris).astype(np.float32) * 0.6, make_ir(1.5, 1.2, 17, 4000), 0.4)


def lamp_flame(dur: float, seed: int = 18) -> np.ndarray:
    """矿灯火焰的细微燃烧声。"""
    n = int(dur * SR)
    t = _t(n)
    x = butter(noise(n, seed), "band", [150, 1200], 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t) * np.sin(2 * np.pi * 1.9 * t))
    env = np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 1.5)
    return (x * env * 0.12).astype(np.float32)


# ───────────── 排布 ─────────────

def arrange() -> tuple[np.ndarray, dict[str, np.ndarray]]:
    total = total_seconds()
    b = json.loads((DATA_DIR / "beats.json").read_text(encoding="utf-8"))
    n = int(total * SR)
    track = np.zeros((n, 2), dtype=np.float32)
    lib: dict[str, np.ndarray] = {}

    def put(name: str, clip: np.ndarray, t: float, gain: float = 1.0, p: float = 0.0):
        lib.setdefault(name, clip)
        if clip.ndim == 1:
            clip = pan(clip, p)
        place(track, clip, t, gain)

    o, ml, aw, st = b["opening"], b["miningLife"], b["awakening"], b["strike"]
    so, pe, sp, en = b["solidarity"], b["persistence"], b["spirit"], b["ending"]

    # 01 序幕
    put("mine_ambience", mine_ambience(44.0), 0.0, 0.55)
    put("metal_clink", metal_clink(), o["lampClink"], 0.55, -0.15)
    put("lamp_flame", lamp_flame(12.0), 2.0, 0.6)
    put("metal_clink", metal_clink(), o["beamSweep"] + 2.2, 0.18, 0.3)

    # 02 矿井下的生活
    put("machinery", machinery(27.0), ml["headframe"], 0.32)
    put("cart_rolling", cart_rolling(6.6), ml["cart"] - 0.3, 0.7)
    for k, tt in enumerate(np.arange(ml["workers"] + 0.4, ml["details"], 1.35)):
        put("pick_strike", pick_strike(16 + k % 3), float(tt), 0.45, -0.4 + 0.25 * (k % 4))

    # 03 风暴传来
    put("bell", bell(), aw["bell1"], 0.5, 0.2)
    put("bell", bell(), aw["bell2"], 0.38, -0.2)
    put("crowd", crowd(11.0, 0.8), aw["crowd"] - 2.0, 0.55)
    for k in range(3):
        put("paper", paper(0.7, 20 + k), aw["newspapers"] + k * 1.8, 0.5, (k - 1) * 0.4)

    # 04 七月九日：静默 → 汽笛 → 锅炉熄火 → 机械停转 → 矿车停下 → 矿灯一盏盏亮起 → 走出井口
    put("steam_whistle", steam_whistle(), st["whistle"], 0.9)
    put("steam_hiss", steam_hiss(4.5), st["boiler"], 0.5)
    put("machinery_stop", machinery(6.0, slow_from=0.2, stop_at=st["flywheelStop"] - st["flywheel"] + 0.3),
        st["flywheel"] - 0.3, 0.6)
    put("cart_stop", cart_rolling(2.8, lambda t: np.clip(1 - t / 2.4, 0, 1) ** 1.3, seed=31), st["cart"], 0.65)
    put("brake_squeal", brake_squeal(), st["cartStop"] - 1.0, 0.45)
    for i in range(5):
        put("lamp_ignite", lamp_ignite(40 + i), st["lamps"] + 0.6 + i * 0.9, 0.45, -0.6 + i * 0.3)
    put("footsteps_walkout", footsteps(13.5, 24, 1.7, 41), st["walkout"], 0.75)
    put("crowd", crowd(10.0, 1.2, 42), st["crowd"] - 1.0, 0.45)

    # 05 从矿井到街头
    put("footsteps_march", footsteps(11.6, 60, 1.27, 51), so["street"] - 0.2, 0.7)
    put("crowd", crowd(11.0, 1.0, 52), so["street"], 0.4)
    put("paper", paper(1.2, 53), so["document"] + 0.1, 0.6)
    put("paper", paper(0.8, 54), so["document"] + 4.5, 0.35)
    put("footsteps_march", footsteps(11.6, 80, 1.27, 55), so["river"], 0.6)
    put("crowd", crowd(11.5, 1.3, 56), so["river"], 0.45)

    # 06 八个月的斗争
    put("lamp_flame", lamp_flame(10.0, 61), pe["nightSchool"], 0.7)
    put("crowd", crowd(5.0, 0.35, 62), pe["mutualAid"], 0.3)
    put("wind", wind(6.0), pe["winter"] - 0.5, 0.6)
    for k in range(8):
        put("paper", paper(0.35, 70 + k), pe["winter"] + 1.6 + k * 0.32, 0.35, (k % 3 - 1) * 0.4)
    put("paper", paper(1.0, 80), pe["contract"] + 0.2, 0.5)
    put("steam_whistle_short", steam_whistle(2.6, 81), pe["resumption"] + 0.6, 0.35)
    put("crowd", crowd(5.5, 0.6, 82), pe["resumption"] + 0.8, 0.28)

    # 07 精神回响：以音乐为主，仅保留空气感
    put("wind", wind(9.0, 90), sp["archive"], 0.18)

    # 08 尾声：最后只留下矿灯微弱的燃烧声
    put("lamp_flame", lamp_flame(5.0, 91), en["lamp"], 0.6)
    put("lamp_flame", lamp_flame(9.4, 92), en["finalLamp"], 0.75)
    put("metal_clink", metal_clink(93), en["finalLamp"] + 0.4, 0.12)

    t = np.arange(n) / SR
    gate = np.ones(n, dtype=np.float32)
    gate[(t >= 69.95) & (t < st["date"] - 0.05)] = 0.0  # 黑场静默
    track *= gate[:, None]
    track *= np.clip((total - t) / 2.0, 0, 1)[:, None]
    return normalize_peak(track, -3.0), lib


def main() -> int:
    print("▶ 合成环境音与音效 …")
    track, lib = arrange()
    EFFECTS.mkdir(parents=True, exist_ok=True)
    for name, clip in lib.items():
        write_wav(EFFECTS / f"{name}.wav", normalize_peak(clip, -3.0))
    write_wav(PUBLIC_AUDIO / "sfx.wav", track)
    print(f"✓ public/audio/sfx.wav + {len(lib)} 个单独音效 → public/audio/effects/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
