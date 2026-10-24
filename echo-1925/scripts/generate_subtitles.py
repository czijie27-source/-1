"""根据 src/data/narration.timing.json 生成 SRT 字幕（与画面内字幕使用同一套时间与断句规则）。"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEAD, TAIL, GAP = 0.08, 0.35, 0.06  # 与 src/data/narration.ts 中保持一致


def subtitle_spans(cues: list[dict]) -> list[tuple[float, float, list[str]]]:
    spans = []
    for i, c in enumerate(cues):
        start = max(0.0, c["start"] - LEAD)
        end = c["end"] + TAIL
        if i + 1 < len(cues):
            end = min(end, cues[i + 1]["start"] - LEAD - GAP)
        spans.append((start, end, c["lines"]))
    return spans


def ts(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def check(lines: list[str], cid: str) -> list[str]:
    issues = []
    if len(lines) > 2:
        issues.append(f"{cid}: 超过两行")
    for ln in lines:
        width = sum(0.5 if ch.isascii() else 1 for ch in ln)
        if width > 18:
            issues.append(f"{cid}: 单行 {width:g} 字宽超过 18 —— {ln}")
    return issues


def main() -> int:
    timing = json.loads((ROOT / "src/data/narration.timing.json").read_text(encoding="utf-8"))
    out = ROOT / "output" / "回响1925.srt"
    out.parent.mkdir(parents=True, exist_ok=True)
    blocks, issues = [], []
    for n, (a, b, lines) in enumerate(subtitle_spans(timing["cues"]), 1):
        issues += check(lines, timing["cues"][n - 1]["id"])
        blocks.append(f"{n}\n{ts(a)} --> {ts(b)}\n" + "\n".join(lines) + "\n")
    out.write_text("\n".join(blocks), encoding="utf-8")
    print(f"✓ 字幕 {len(blocks)} 条 → {out.relative_to(ROOT)}")
    for i in issues:
        print("  ⚠", i)
    return 0


if __name__ == "__main__":
    sys.exit(main())
