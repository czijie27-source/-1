"""下载离线中文 TTS 模型（Kokoro v1.1-zh，sherpa-onnx 打包版，约 350MB，Apache-2.0）到 models/。"""
from __future__ import annotations

import tarfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_1.tar.bz2"


def main() -> int:
    models = ROOT / "models"
    models.mkdir(exist_ok=True)
    if (models / "kokoro-multi-lang-v1_1" / "model.onnx").exists():
        print("✓ 模型已存在")
        return 0
    tmp = models / "kokoro.tar.bz2"
    print(f"▶ 下载 {URL}")
    urllib.request.urlretrieve(URL, tmp)
    with tarfile.open(tmp) as tf:
        tf.extractall(models)
    tmp.unlink()
    print("✓ 已解压到 models/kokoro-multi-lang-v1_1")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
