import React from "react";

/**
 * 矿灯光束：多层叠加的锥形渐变（越靠中心越亮），边缘柔和，不使用昂贵的模糊滤镜。
 * 以 SVG 片段形式使用，需放在 <svg> 内。
 */
export const LightBeam: React.FC<{
  x: number;
  y: number;
  angle: number; // 度，0 = 向右，90 = 向下
  length?: number;
  spread?: number; // 度
  intensity?: number;
  color?: string;
  id: string;
  layers?: number;
}> = ({ x, y, angle, length = 1400, spread = 30, intensity = 0.6, color = "#E7C88E", id, layers = 8 }) => {
  const a = (angle * Math.PI) / 180;
  const ex = x + Math.cos(a) * length;
  const ey = y + Math.sin(a) * length;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`beam-${id}`} gradientUnits="userSpaceOnUse" x1={x} y1={y} x2={ex} y2={ey}>
          <stop offset="0" stopColor={color} stopOpacity={1} />
          <stop offset="0.25" stopColor={color} stopOpacity={0.55} />
          <stop offset="0.7" stopColor={color} stopOpacity={0.15} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {Array.from({ length: layers }, (_, i) => {
        const k = 1 - i / layers;
        const s = ((spread * k) / 2) * (Math.PI / 180);
        const p1 = [x + Math.cos(a - s) * length, y + Math.sin(a - s) * length];
        const p2 = [x + Math.cos(a + s) * length, y + Math.sin(a + s) * length];
        const w = 4 + 8 * k;
        const n = [-Math.sin(a) * w, Math.cos(a) * w];
        return (
          <polygon
            key={i}
            points={`${x - n[0]},${y - n[1]} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${x + n[0]},${y + n[1]}`}
            fill={`url(#beam-${id})`}
            opacity={(intensity / layers) * 1.6}
          />
        );
      })}
    </g>
  );
};

/** 柔和的点光源光晕（SVG 片段） */
export const Glow: React.FC<{ x: number; y: number; r: number; color?: string; opacity?: number; id: string; core?: number }> = ({
  x,
  y,
  r,
  color = "#E7C88E",
  opacity = 1,
  id,
  core = 0.15,
}) => (
  <g style={{ mixBlendMode: "screen" }}>
    <defs>
      <radialGradient id={`glow-${id}`}>
        <stop offset="0" stopColor="#FFF4D6" stopOpacity={1} />
        <stop offset={core} stopColor={color} stopOpacity={0.6} />
        <stop offset="0.5" stopColor={color} stopOpacity={0.15} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r} fill={`url(#glow-${id})`} opacity={opacity} />
  </g>
);
