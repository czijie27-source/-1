// 《回响·1925》渲染入口（跨平台：Windows / macOS / Linux 均可用 `npm run render`）
//   node scripts/render.mjs              → output/回响1925.mp4（1920×1080，H.264 + AAC）+ 封面 + SRT
//   node scripts/render.mjs --preview    → output/preview_960x540.mp4（低分辨率预览）
//   node scripts/render.mjs --cover-only → 仅输出 output/封面.png
//   --allow-no-narration                 → 旁白缺失时仍然渲染（成片会标记为“无旁白版”）
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const args = new Set(process.argv.slice(2));
const preview = args.has("--preview");
const coverOnly = args.has("--cover-only");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const out = path.join(root, "output");
fs.mkdirSync(out, { recursive: true });

const narration = path.join(root, "public/audio/narration.wav");
const timing = path.join(root, "src/data/narration.timing.json");
if (!coverOnly && !(fs.existsSync(narration) && fs.existsSync(timing))) {
  console.error("✗ 旁白音轨缺失（public/audio/narration.wav 或 src/data/narration.timing.json 不存在）。");
  console.error("  请先运行 npm run audio（离线 TTS），或导入自己的录音后再运行。");
  if (!args.has("--allow-no-narration")) process.exit(2);
  console.error("  已指定 --allow-no-narration：继续渲染，但这不是完整成品。");
}
for (const f of ["music.wav", "sfx.wav"]) {
  if (!fs.existsSync(path.join(root, "public/audio", f))) {
    console.error(`✗ 缺少 public/audio/${f}，请先运行 npm run audio`);
    process.exit(2);
  }
}

const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

console.log("▶ 打包工程 …");
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });

// 封面
{
  const composition = await selectComposition({ serveUrl, id: "Cover", puppeteerInstance: browser });
  await renderStill({ serveUrl, composition, output: path.join(out, "封面.png"), puppeteerInstance: browser, imageFormat: "png" });
  console.log("✓ output/封面.png");
}
if (coverOnly) {
  await browser.close({ silent: true });
  process.exit(0);
}

const composition = await selectComposition({ serveUrl, id: "Echo1925", puppeteerInstance: browser, inputProps: { subtitles: true, audio: true } });
const raw = path.join(out, preview ? "preview_raw.mp4" : "render_raw.mp4");
const final = path.join(out, preview ? "preview_960x540.mp4" : "回响1925.mp4");
let last = -1;
const t0 = Date.now();
await renderMedia({
  serveUrl,
  composition,
  codec: "h264",
  outputLocation: raw,
  puppeteerInstance: browser,
  inputProps: { subtitles: true, audio: true },
  scale: preview ? 0.5 : 1,
  crf: preview ? 26 : 20,
  x264Preset: preview ? "veryfast" : "slow",
  pixelFormat: "yuv420p",
  audioCodec: "aac",
  audioBitrate: "192k",
  imageFormat: "jpeg",
  jpegQuality: 92,
  concurrency: Math.max(1, (await import("node:os")).cpus().length),
  chromiumOptions: { gl: "swangle" },
  onProgress: ({ progress, renderedFrames }) => {
    const p = Math.floor(progress * 100);
    if (p !== last && p % 5 === 0) {
      last = p;
      const el = (Date.now() - t0) / 1000;
      console.log(`  ${p}%  帧 ${renderedFrames}/${composition.durationInFrames}  已用 ${el.toFixed(0)}s`);
    }
  },
});
await browser.close({ silent: true });

// 响度标准化（EBU R128，-16 LUFS / -1.5 dBTP，适合网络播放）；视频流直接复制，不再二次压缩
if (hasFfmpeg) {
  console.log("▶ 响度标准化 …");
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", raw, "-c:v", "copy", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", final]);
  fs.rmSync(raw);
} else {
  fs.renameSync(raw, final);
  console.log("  （未检测到系统 ffmpeg，跳过响度标准化）");
}
console.log(`✓ ${path.relative(root, final)}  用时 ${((Date.now() - t0) / 60000).toFixed(1)} 分钟`);

// 字幕
const py = process.platform === "win32" ? "python" : "python3";
const r = spawnSync(py, [path.join(root, "scripts/generate_subtitles.py")], { stdio: "inherit" });
if (r.status !== 0) console.warn("  ⚠ SRT 生成失败（需要 Python 3），可手动运行 python scripts/generate_subtitles.py");
