"""把思源（Noto CJK）字体裁剪为常用汉字子集（GB2312 一级字 + 工程内用到的全部字符），输出 woff2。

用法：python3 scripts/subset_fonts.py <存放 NotoSerifSC-*.otf / NotoSansSC-*.otf 的目录>
字体下载：https://github.com/notofonts/noto-cjk （SIL Open Font License 1.1）
"""
from __future__ import annotations

import sys
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
FONTS = {
    "NotoSerifSC-Black.otf": "NotoSerifSC-Black.woff2",
    "NotoSerifSC-Bold.otf": "NotoSerifSC-Bold.woff2",
    "NotoSerifSC-Regular.otf": "NotoSerifSC-Regular.woff2",
    "NotoSansSC-Medium.otf": "NotoSansSC-Medium.woff2",
}


def charset() -> str:
    chars = set()
    for hi in range(0xB0, 0xD8):  # GB2312 一级汉字
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    for p in list((ROOT / "src").rglob("*")) + [ROOT / "README.md"]:
        if p.is_file() and p.suffix in {".ts", ".tsx", ".json", ".md"}:
            chars.update(p.read_text(encoding="utf-8"))
    chars.update(chr(c) for c in range(0x20, 0x7F))
    chars.update("，。、；：？！“”‘’《》（）—…·｜　〇")
    return "".join(sorted(chars))


def main() -> int:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "fonts-src"
    out = ROOT / "public" / "fonts"
    out.mkdir(parents=True, exist_ok=True)
    text = charset()
    for name, target in FONTS.items():
        f = src / name
        if not f.exists():
            print(f"  ⚠ 跳过（未找到 {f}）")
            continue
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        font = subset.load_font(str(f), opts)
        s = subset.Subsetter(opts)
        s.populate(text=text)
        s.subset(font)
        subset.save_font(font, str(out / target), opts)
        print(f"  ✓ {target}  {(out / target).stat().st_size / 1e6:.2f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
