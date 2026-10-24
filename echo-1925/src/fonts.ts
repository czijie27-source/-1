import { continueRender, delayRender, staticFile } from "remotion";

const FACES: [string, string, string][] = [
  ["EchoSerif", "NotoSerifSC-Regular.woff2", "400"],
  ["EchoSerif", "NotoSerifSC-Bold.woff2", "700"],
  ["EchoSerif", "NotoSerifSC-Black.woff2", "900"],
  ["EchoSans", "NotoSansSC-Medium.woff2", "500"],
];

let started = false;

/** 加载 public/fonts 中的思源字体子集；加载完成前阻塞渲染，保证每一帧字体一致。 */
export const ensureFonts = () => {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("加载字体");
  Promise.all(
    FACES.map(([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, { weight });
      return face.load().then((f) => {
        document.fonts.add(f);
      });
    }),
  )
    .catch((e) => console.warn("字体加载失败，将使用系统字体", e))
    .finally(() => continueRender(handle));
};
