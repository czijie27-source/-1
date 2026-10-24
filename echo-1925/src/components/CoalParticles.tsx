import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { rand } from "../lib/anim";

/**
 * 煤尘粒子（ParticleField）：确定性生成，缓慢漂浮；
 * 落在光源附近的粒子会被照亮（暖金色），远离光源时几乎不可见——像真正的光柱里的尘埃。
 */
export const CoalParticles: React.FC<{
  count?: number;
  seed?: number;
  light?: { x: number; y: number; r: number } | null;
  beam?: { x: number; y: number; angle: number; spread: number; length: number } | null;
  drift?: [number, number]; // 像素/秒
  size?: [number, number];
  color?: string;
  base?: number; // 未被照亮时的亮度
  intensity?: number;
}> = ({
  count = 160,
  seed = 1,
  light = null,
  beam = null,
  drift = [6, -4],
  size = [0.8, 3.2],
  color = "#E9C98C",
  base = 0.06,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const ps = useMemo(() => {
    const r = rand(seed);
    return Array.from({ length: count }, () => ({
      x: r() * 2120 - 100,
      y: r() * 1280 - 100,
      s: size[0] + Math.pow(r(), 2.2) * (size[1] - size[0]),
      vx: drift[0] * (0.4 + r()),
      vy: drift[1] * (0.4 + r()),
      ph: r() * 6.28,
      wob: 6 + r() * 18,
      tw: 0.5 + r() * 1.5,
    }));
  }, [count, seed, size, drift]);

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id={`dust-${seed}`}>
          <stop offset="0" stopColor={color} stopOpacity={1} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      {ps.map((p, i) => {
        const x = ((p.x + p.vx * t + Math.sin(t * 0.5 + p.ph) * p.wob) % 2120 + 2120) % 2120 - 100;
        const y = ((p.y + p.vy * t + Math.cos(t * 0.4 + p.ph) * p.wob * 0.6) % 1280 + 1280) % 1280 - 100;
        let lit = base;
        if (light) {
          const d = Math.hypot(x - light.x, y - light.y);
          lit = Math.max(lit, Math.max(0, 1 - d / light.r) ** 1.5);
        }
        if (beam) {
          const dx = x - beam.x;
          const dy = y - beam.y;
          const dist = Math.hypot(dx, dy);
          const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
          let da = Math.abs(((ang - beam.angle + 540) % 360) - 180);
          da = da / (beam.spread / 2);
          if (da < 1 && dist < beam.length) lit = Math.max(lit, (1 - da) ** 1.2 * (1 - dist / beam.length) ** 0.8);
        }
        const tw = 0.75 + 0.25 * Math.sin(t * p.tw * 3 + p.ph);
        const o = Math.min(1, lit * tw * intensity);
        if (o < 0.015) return null;
        return <circle key={i} cx={x} cy={y} r={p.s * (p.s > 2.4 ? 2.2 : 1)} fill={p.s > 2.4 ? `url(#dust-${seed})` : color} opacity={o} />;
      })}
    </svg>
  );
};
