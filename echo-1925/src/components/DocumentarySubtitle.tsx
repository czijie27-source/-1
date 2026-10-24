import React from "react";
import { useCurrentFrame } from "remotion";
import { SUBTITLES } from "../data/narration";
import { FONT } from "../theme";

/**
 * 统一管理的旁白字幕：数据来自 src/data/narration.timing.json（由实际配音时长生成），
 * 与 SRT 文件使用同一套时间。位于底部安全区，最多两行，浅色文字配柔和阴影。
 */
export const DocumentarySubtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = SUBTITLES.find((s) => frame >= s.from && frame < s.to);
  if (!cur) return null;
  const fade = 5;
  const o = Math.min(1, (frame - cur.from + 1) / fade, (cur.to - frame) / fade);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 74,
        textAlign: "center",
        fontFamily: FONT.sans,
        fontWeight: 500,
        fontSize: 42,
        lineHeight: 1.5,
        letterSpacing: "0.06em",
        color: "#F2EDE4",
        opacity: o,
        textShadow: "0 0 3px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.85), 0 0 26px rgba(0,0,0,0.6)",
      }}
    >
      {cur.lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};
