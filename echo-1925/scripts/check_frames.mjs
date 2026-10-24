// 渲染指定时间点的静帧，用于检查画面（章节交界、开头结尾等）。
// 用法：node scripts/check_frames.mjs [输出目录] [秒,秒,...] [--comp Echo1925] [--scale 0.5]
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(n);
  if (i < 0) return d;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const compId = flag("--comp", "Echo1925");
const scale = Number(flag("--scale", "0.5"));
const outDir = path.resolve(args[0] ?? "output/frames");
const times = (args[1] ?? "0.5,7,14.5,15.5,30,42.5,56,70.5,72,80,86,92,99,103,112,118,128,135,146,150,156,162,174,180,186,189,195,203,207,209.5")
  .split(",")
  .map(Number);

fs.mkdirSync(outDir, { recursive: true });
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id: compId, puppeteerInstance: browser });
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps));
  const file = path.join(outDir, `${compId}_${String(t).padStart(6, "0")}s.png`);
  const t0 = Date.now();
  await renderStill({ serveUrl, composition, frame, output: file, scale, puppeteerInstance: browser, imageFormat: "png" });
  console.log(`✓ ${t}s (帧 ${frame}) ${Date.now() - t0}ms → ${path.relative(process.cwd(), file)}`);
}
await browser.close({ silent: true });
