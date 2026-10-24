"""程序化生成画面纹理（原创素材，无第三方图片）：

  public/images/textures/grain_{0..7}.png   胶片颗粒（循环使用，每帧不同偏移）
  public/images/textures/fog_{0,1}.png      工业雾气 / 烟尘（横向可平铺）
  public/images/textures/paper.png          旧纸张（纤维、霉斑、折痕、边缘老化）
  public/images/textures/coal_wall.png      煤壁（层理、裂隙、反光颗粒）
  public/images/textures/sky.png            阴沉天空（云层）
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images" / "textures"


def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def fbm(h: int, w: int, seed: int, octaves: int = 6, base: int = 4, persistence: float = 0.55,
        wrap_x: bool = True) -> np.ndarray:
    """分形噪声（多倍频程平滑噪声叠加），输出 0..1。"""
    r = rng(seed)
    out = np.zeros((h, w), dtype=np.float64)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        gh, gw = base * 2 ** o, base * 2 ** o
        grid = r.random((gh + 1, gw + 1))
        if wrap_x:
            grid[:, -1] = grid[:, 0]
        ys = np.linspace(0, gh, h, endpoint=False)
        xs = np.linspace(0, gw, w, endpoint=False)
        layer = ndimage.map_coordinates(grid, np.meshgrid(ys, xs, indexing="ij"), order=3, mode="wrap" if wrap_x else "nearest")
        out += layer * amp
        total += amp
        amp *= persistence
    out /= total
    out = (out - out.min()) / (out.max() - out.min() + 1e-9)
    return out


def save_gray(a: np.ndarray, name: str, alpha: np.ndarray | None = None) -> None:
    a8 = (np.clip(a, 0, 1) * 255).astype(np.uint8)
    if alpha is None:
        Image.fromarray(a8, "L").save(OUT / name, optimize=True)
    else:
        al = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
        Image.fromarray(np.stack([a8, a8, a8, al], axis=-1), "RGBA").save(OUT / name, optimize=True)


def grain() -> None:
    for i in range(8):
        r = rng(100 + i)
        g = r.normal(0.5, 0.22, (512, 512))
        g = ndimage.gaussian_filter(g, 0.6)
        g = (g - g.mean()) / (g.std() + 1e-9) * 0.18 + 0.5
        save_gray(g, f"grain_{i}.png")


def fog() -> None:
    for i, seed in enumerate((7, 19)):
        h, w = 768, 2048
        n = fbm(h, w, seed, octaves=6, base=3, persistence=0.52)
        n2 = fbm(h, w, seed + 1, octaves=4, base=2, persistence=0.6)
        d = np.clip((n * 0.65 + n2 * 0.35 - 0.38) * 2.4, 0, 1) ** 1.6
        y = np.linspace(0, 1, h)[:, None]
        d *= np.clip(np.sin(np.pi * y) * 1.4, 0, 1)  # 上下边缘淡出
        save_gray(np.ones_like(d), f"fog_{i}.png", alpha=d * 0.9)


def paper() -> None:
    h, w = 1400, 1100
    r = rng(31)
    base = 0.86 + 0.06 * fbm(h, w, 32, 6, 3, 0.6, False)
    fibers = ndimage.gaussian_filter(r.random((h, w)), (0.4, 3.0)) - 0.5
    base += fibers * 0.10
    stains = fbm(h, w, 33, 5, 2, 0.55, False)
    base -= np.clip(stains - 0.62, 0, 1) * 0.5
    for _ in range(14):  # 霉斑
        cy, cx = r.integers(0, h), r.integers(0, w)
        rad = r.uniform(4, 28)
        yy, xx = np.ogrid[:h, :w]
        m = np.exp(-((yy - cy) ** 2 + (xx - cx) ** 2) / (2 * rad ** 2))
        base -= m * r.uniform(0.04, 0.12)
    # 折痕
    base[:, w // 2 - 2: w // 2 + 2] -= np.array([0.03, 0.07, 0.07, 0.02])[None, :]
    base[h // 2 - 1: h // 2 + 2, :] -= np.array([0.04, 0.06, 0.02])[:, None]
    # 边缘老化
    yy, xx = np.mgrid[0:h, 0:w]
    edge = np.minimum.reduce([yy, xx, h - 1 - yy, w - 1 - xx]).astype(float)
    edge_noise = fbm(h, w, 34, 5, 6, 0.6, False) * 40
    base -= np.clip(1 - (edge - edge_noise * 0.5) / 70, 0, 1) ** 2 * 0.35
    alpha = np.clip((edge - edge_noise * 0.25 + 4) / 6, 0, 1)  # 不规则毛边
    rgb = np.stack([base * 1.0, base * 0.955, base * 0.86], axis=-1)
    rgb = np.clip(rgb, 0, 1)
    img = np.concatenate([rgb, alpha[..., None]], axis=-1)
    Image.fromarray((img * 255).astype(np.uint8), "RGBA").save(OUT / "paper.png", optimize=True)


def coal_wall() -> None:
    h, w = 1080, 2400
    r = rng(41)
    y = np.linspace(0, 1, h)[:, None]
    warp = fbm(h, w, 42, 5, 3, 0.55) * 0.12
    strata = np.sin((y + warp) * 2 * np.pi * 9) * 0.5 + 0.5
    rough = fbm(h, w, 43, 7, 6, 0.6)
    v = 0.10 + 0.16 * rough + 0.06 * strata
    cracks = fbm(h, w, 44, 6, 4, 0.5)
    v -= np.clip(0.03 - np.abs(cracks - 0.5), 0, 1) * 4.0
    sparkle = (r.random((h, w)) > 0.9985).astype(float)
    sparkle = ndimage.gaussian_filter(sparkle, 0.8) * 6
    v += sparkle * 0.5
    v = np.clip(v, 0, 1)
    rgb = np.stack([v * 1.02, v * 1.0, v * 0.96], axis=-1)
    Image.fromarray((rgb * 255).astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(0.6)).save(OUT / "coal_wall.png", optimize=True)


def sky() -> None:
    h, w = 1080, 2560
    n = fbm(h, w, 51, 7, 3, 0.55)
    y = np.linspace(0, 1, h)[:, None]
    v = 0.16 + 0.22 * n * (1 - y * 0.4) + 0.12 * y
    rgb = np.stack([v * 1.0, v * 1.02, v * 1.06], axis=-1)
    Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8), "RGB").save(OUT / "sky.png", optimize=True)


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for fn in (grain, fog, paper, coal_wall, sky):
        fn()
        print("  ✓", fn.__name__)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
