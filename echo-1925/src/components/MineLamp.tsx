import React from "react";
import { useCurrentFrame } from "remotion";
import { noise1 } from "../lib/anim";
import { C } from "../theme";

/** 火焰闪烁系数（0.8~1.05），多处共用以保证灯光与粒子照明一致 */
export const flameFlicker = (frame: number, seed = 0) => {
  const t = frame / 30;
  return 0.86 + 0.1 * noise1(t * 7 + seed, seed) + 0.06 * noise1(t * 19 + seed * 3, seed + 5) - 0.03;
};

/**
 * 1920 年代井下常见的油灯式安全矿灯（铜质灯头、玻璃灯罩、钢丝网、油壶底座）。
 * 以 (x, y) 为灯焰中心定位，scale=1 时整灯高约 300px。
 */
export const MineLamp: React.FC<{
  x: number;
  y: number;
  scale?: number;
  lit?: number; // 0..1 点亮程度
  swing?: number; // 摆动角度（度）
  halo?: number; // 光晕强度
  seed?: number;
  metal?: string;
}> = ({ x, y, scale = 1, lit = 1, swing = 0, halo = 1, seed = 0, metal = "#4A3B28" }) => {
  const frame = useCurrentFrame();
  const fl = flameFlicker(frame, seed) * lit;
  const id = `lamp${seed}`;
  const fx = Math.sin(frame / 30 * 9 + seed) * 1.2; // 火苗微摆
  return (
    <g transform={`translate(${x} ${y}) rotate(${swing} 0 -150) scale(${scale})`}>
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="#FFE2A8" stopOpacity={0.55 * fl * halo} />
          <stop offset="0.12" stopColor={C.gold} stopOpacity={0.32 * fl * halo} />
          <stop offset="0.45" stopColor="#A87A3C" stopOpacity={0.1 * fl * halo} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-brass`} x1="0" x2="1">
          <stop offset="0" stopColor="#1C150D" />
          <stop offset="0.35" stopColor={metal} />
          <stop offset="0.55" stopColor={`rgb(${120 + 80 * fl},${90 + 55 * fl},${50 + 25 * fl})`} />
          <stop offset="0.75" stopColor={metal} />
          <stop offset="1" stopColor="#120D08" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" x2="1">
          <stop offset="0" stopColor="#E8D2A0" stopOpacity={0.08 + 0.12 * fl} />
          <stop offset="0.3" stopColor="#FFF1CF" stopOpacity={0.15 + 0.3 * fl} />
          <stop offset="0.7" stopColor="#E8C27E" stopOpacity={0.1 + 0.2 * fl} />
          <stop offset="1" stopColor="#E8D2A0" stopOpacity={0.05 + 0.1 * fl} />
        </linearGradient>
        <radialGradient id={`${id}-flame`} cx="0.5" cy="0.7" r="0.6">
          <stop offset="0" stopColor="#FFFBEA" />
          <stop offset="0.35" stopColor="#FFD98A" />
          <stop offset="0.8" stopColor="#E08A2E" stopOpacity={0.9} />
          <stop offset="1" stopColor="#B04A10" stopOpacity={0} />
        </radialGradient>
      </defs>
      {halo > 0 && <circle cx={0} cy={0} r={620} fill={`url(#${id}-halo)`} style={{ mixBlendMode: "screen" }} />}
      {/* 提环与吊钩 */}
      <ellipse cx={0} cy={-150} rx={16} ry={20} fill="none" stroke={`url(#${id}-brass)`} strokeWidth={5} />
      <rect x={-5} y={-132} width={10} height={16} fill={`url(#${id}-brass)`} />
      {/* 灯帽 */}
      <path d="M -26 -116 L 26 -116 L 38 -88 L -38 -88 Z" fill={`url(#${id}-brass)`} />
      <rect x={-42} y={-90} width={84} height={10} rx={2} fill={`url(#${id}-brass)`} />
      {/* 钢丝网罩 */}
      <rect x={-30} y={-80} width={60} height={40} fill="#2A241C" opacity={0.85} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={-30 + i * 7.5} x2={-30 + i * 7.5} y1={-80} y2={-40} stroke="#6B5A40" strokeWidth={1} opacity={0.7} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`h${i}`} x1={-30} x2={30} y1={-80 + i * 8} y2={-80 + i * 8} stroke="#6B5A40" strokeWidth={1} opacity={0.6} />
      ))}
      <rect x={-36} y={-42} width={72} height={7} fill={`url(#${id}-brass)`} />
      {/* 玻璃灯罩与火焰 */}
      <rect x={-30} y={-35} width={60} height={62} fill={`url(#${id}-glass)`} />
      <g transform={`translate(${fx * 0.5} 0)`} opacity={lit}>
        <path
          d={`M 0 ${-26 - 6 * fl} C ${8 + fx} -8, 9 6, 0 14 C -9 6, ${-8 + fx} -8, 0 ${-26 - 6 * fl} Z`}
          fill={`url(#${id}-flame)`}
          transform={`scale(${0.9 + 0.15 * fl})`}
        />
        <ellipse cx={0} cy={9} rx={3} ry={5} fill="#5A88C8" opacity={0.6} />
      </g>
      {/* 立柱 */}
      {[-33, -11, 11, 33].map((px) => (
        <rect key={px} x={px - 2.2} y={-36} width={4.4} height={64} fill={`url(#${id}-brass)`} opacity={Math.abs(px) > 20 ? 1 : 0.55} />
      ))}
      {/* 油壶底座 */}
      <rect x={-40} y={27} width={80} height={9} rx={2} fill={`url(#${id}-brass)`} />
      <path d="M -38 36 L 38 36 L 42 92 Q 0 102 -42 92 Z" fill={`url(#${id}-brass)`} />
      {[52, 66, 80].map((yy) => (
        <line key={yy} x1={-40} x2={40} y1={yy} y2={yy} stroke="#120D08" strokeWidth={1.5} opacity={0.6} />
      ))}
    </g>
  );
};
