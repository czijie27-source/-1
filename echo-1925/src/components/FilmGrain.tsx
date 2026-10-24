import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { hash, noise1, rand } from "../lib/anim";

/**
 * 胶片质感（VintageTexture）：颗粒、偶发划痕与尘点、轻微曝光闪烁、暗角。
 * 所有随机量都由帧号决定，离线渲染结果稳定。
 */
export const FilmGrain: React.FC<{ intensity?: number; scratches?: boolean; vignette?: number }> = ({
  intensity = 1,
  scratches = true,
  vignette = 1,
}) => {
  const frame = useCurrentFrame();
  const tile = frame % 8;
  const ox = Math.floor(hash(frame * 1.7) * 512);
  const oy = Math.floor(hash(frame * 3.1 + 9) * 512);
  const flicker = (noise1(frame * 0.35, 4) - 0.5) * 0.05 + (hash(frame) > 0.97 ? 0.03 : 0);

  const r = rand(frame + 17);
  const lines: { x: number; o: number; w: number; y0: number; y1: number }[] = [];
  if (scratches) {
    const n = r() < 0.35 ? 1 + Math.floor(r() * 2) : 0;
    for (let i = 0; i < n; i++) {
      lines.push({ x: r() * 1920, o: 0.08 + r() * 0.12, w: 0.8 + r() * 1.2, y0: r() * 300, y1: 700 + r() * 380 });
    }
  }
  const dust: { x: number; y: number; s: number; o: number; dark: boolean }[] = [];
  const nd = Math.floor(r() * 4);
  for (let i = 0; i < nd; i++) {
    dust.push({ x: r() * 1920, y: r() * 1080, s: 1 + r() * 3, o: 0.12 + r() * 0.25, dark: r() > 0.4 });
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile(`images/textures/grain_${tile}.png`)})`,
          backgroundPosition: `${ox}px ${oy}px`,
          backgroundSize: "512px 512px",
          mixBlendMode: "overlay",
          opacity: 0.55 * intensity,
        }}
      />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {lines.map((l, i) => (
          <line key={i} x1={l.x} x2={l.x + 2} y1={l.y0} y2={l.y1} stroke="#e8e0d2" strokeWidth={l.w} opacity={l.o * intensity} />
        ))}
        {dust.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.s} fill={d.dark ? "#000" : "#e8e0d2"} opacity={d.o * intensity} />
        ))}
      </svg>
      <AbsoluteFill style={{ background: flicker > 0 ? "#fff" : "#000", opacity: Math.abs(flicker) * intensity }} />
      {vignette > 0 && (
        <AbsoluteFill
          style={{
            background: "radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 85%, rgba(0,0,0,0.85) 100%)",
            opacity: vignette,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
