import fs from "node:fs";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setConcurrency(null);
Config.setChromiumOpenGlRenderer("swangle");

// 若本机已有 Chrome Headless Shell / Chromium，可通过环境变量指定，避免 Remotion 再次下载浏览器。
const browser = process.env.REMOTION_BROWSER_EXECUTABLE;
if (browser && fs.existsSync(browser)) {
  Config.setBrowserExecutable(browser);
}
