"""一键准备全部音频：旁白（离线 TTS 或本地录音）→ 原创配乐 → 音效 → SRT 字幕。

用法：python3 scripts/prepare_audio.py [--source auto|kokoro|cues|file] [--skip-narration]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import compose_music  # noqa: E402
import generate_subtitles  # noqa: E402
import narration  # noqa: E402
import sound_effects  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default="auto", choices=["auto", "kokoro", "cues", "file"])
    ap.add_argument("--skip-narration", action="store_true", help="保留现有旁白，只重新生成配乐与音效")
    a = ap.parse_args()
    if not a.skip_narration:
        code = narration.main(["--source", a.source])
        if code != 0:
            return code
    compose_music.main()
    sound_effects.main()
    generate_subtitles.main()
    print("✓ 音频准备完成")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
