import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";

/** 工业雾气 / 烟尘：两层程序生成的雾纹理以不同速度漂移。 */
export const IndustrialFog: React.FC<{
  opacity?: number;
  speed?: number; // 像素/秒
  top?: number;
  height?: number;
  tint?: string;
  blend?: React.CSSProperties["mixBlendMode"];
  seedOffset?: number;
}> = ({ opacity = 0.35, speed = 12, top = 0, height = 1080, tint, blend = "screen", seedOffset = 0 }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const layer = (i: number, k: number, op: number) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width: 1920,
        height,
        backgroundImage: `url(${staticFile(`images/textures/fog_${i}.png`)})`,
        backgroundRepeat: "repeat-x",
        backgroundSize: `${2048 * (height / 768)}px ${height}px`,
        backgroundPosition: `${-(t * speed * k + seedOffset * 300 + i * 700)}px 0px`,
        opacity: op,
        mixBlendMode: blend,
        filter: tint ? `drop-shadow(0 0 0 ${tint})` : undefined,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {layer(0, 1, 0.8)}
      {layer(1, 1.7, 0.6)}
    </AbsoluteFill>
  );
};
