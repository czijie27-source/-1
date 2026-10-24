import React from "react";
import { staticFile } from "remotion";
import { C, FONT } from "../theme";

/**
 * 历史文书视觉：程序生成的旧纸纹理 + 现代排印的文献标题。
 * 注意：这里展示的是“文献内容示意”，不是原件扫描，角落会明确标注。
 */
export const HistoricalDocument: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  children?: React.ReactNode;
  shadow?: number;
  light?: number; // 暖光照射强度
  note?: string;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, rotate = 0, children, shadow = 0.6, light = 0.3, note, style }) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      transform: `rotate(${rotate}deg)`,
      filter: `drop-shadow(0 ${30 * shadow}px ${50 * shadow}px rgba(0,0,0,${0.75 * shadow}))`,
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${staticFile("images/textures/paper.png")})`,
        backgroundSize: "100% 100%",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse 70% 60% at 45% 40%, rgba(255,214,150,${light * 0.35}), rgba(0,0,0,${0.35 - light * 0.2}) 100%)`,
        mixBlendMode: "multiply",
      }}
    />
    <div style={{ position: "absolute", inset: 0, color: C.ink, fontFamily: FONT.serif }}>{children}</div>
    {note && (
      <div
        style={{
          position: "absolute",
          right: w * 0.05,
          bottom: h * 0.035,
          fontFamily: FONT.sans,
          fontSize: Math.max(16, w * 0.022),
          color: "rgba(42,38,34,0.55)",
          letterSpacing: "0.15em",
        }}
      >
        {note}
      </div>
    )}
  </div>
);

/** 文书正文的“排版行”：用细墨线模拟成段文字（不伪造具体原文内容） */
export const InkLines: React.FC<{ x: number; y: number; w: number; rows: number; gap?: number; seed?: number; opacity?: number; vertical?: boolean; h?: number }> = ({
  x, y, w, rows, gap = 34, seed = 1, opacity = 0.35, vertical = false, h = 400,
}) => {
  const items = Array.from({ length: rows }, (_, i) => {
    const s = Math.sin((i + 1) * 12.9898 * seed) * 43758.5453;
    const k = 0.55 + (s - Math.floor(s)) * 0.45;
    return k;
  });
  return (
    <>
      {items.map((k, i) =>
        vertical ? (
          <div key={i} style={{ position: "absolute", left: x - i * gap, top: y, width: 3, height: h * k, background: `repeating-linear-gradient(180deg, rgba(42,38,34,${opacity}) 0 18px, transparent 18px 26px)` }} />
        ) : (
          <div key={i} style={{ position: "absolute", left: x, top: y + i * gap, width: w * (i === rows - 1 ? k * 0.6 : k), height: 3, background: `repeating-linear-gradient(90deg, rgba(42,38,34,${opacity}) 0 22px, transparent 22px 30px)` }} />
        ),
      )}
    </>
  );
};
