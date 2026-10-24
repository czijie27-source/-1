#!/usr/bin/env bash
# 一键：准备音频 → 渲染预览（可选）→ 渲染成片。用法：bash scripts/render.sh [--preview]
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f public/audio/narration.wav ] || [ ! -f public/audio/music.wav ]; then
  python3 scripts/prepare_audio.py
fi
node scripts/render.mjs "$@"
