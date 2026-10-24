import { Easing, interpolate } from "remotion";
import { FPS } from "../data/timeline";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const EASE = Easing.bezier(0.45, 0, 0.25, 1); // 电影式缓入缓出
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.6, 0, 0.84, 0);

/** 以秒为单位的区间插值（帧号为局部帧），越界钳制 */
export const ramp = (
  frame: number,
  [s0, s1]: [number, number],
  [v0, v1]: [number, number] = [0, 1],
  easing: (t: number) => number = EASE,
) =>
  interpolate(frame, [s0 * FPS, s1 * FPS], [v0, v1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** 淡入淡出包络：in 区间 [a,b]，out 区间 [c,d]（秒） */
export const envelope = (frame: number, a: number, b: number, c: number, d: number) =>
  Math.min(ramp(frame, [a, b]), 1 - ramp(frame, [c, d]));

/** 多关键帧插值（秒 → 值） */
export const keys = (frame: number, ks: [number, number][], easing = EASE) => {
  const t = frame / FPS;
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, v0] = ks[i];
    const [t1, v1] = ks[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * easing((t - t0) / Math.max(t1 - t0, 1e-6));
  }
  return ks[ks.length - 1][1];
};

/** 确定性伪随机（mulberry32），保证离线渲染每次一致 */
export const rand = (seed: number) => {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** 平滑一维值噪声，用于火焰闪烁、手持感微抖 */
export const noise1 = (t: number, seed = 0) => {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return hash(i + seed * 57.3) * (1 - u) + hash(i + 1 + seed * 57.3) * u;
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const mixColor = (c1: string, c2: string, t: number) => {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1);
  const b = p(c2);
  const m = a.map((v, i) => Math.round(lerp(v, b[i], clamp(t))));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
};

/** 山脊 / 远景轮廓线（确定性），返回闭合到底部的 SVG path */
export const ridgePath = (seed: number, baseY: number, amp: number, x0 = -400, x1 = 2400, step = 24, bottom = 1400) => {
  let d = `M ${x0} ${bottom} L ${x0} ${baseY}`;
  for (let x = x0; x <= x1; x += step) {
    const u = x / 1920;
    const y = baseY - amp * (0.55 * noise1(u * 3 + seed, seed) + 0.3 * noise1(u * 9 + seed * 2, seed + 1) + 0.15 * noise1(u * 23, seed + 2));
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return `${d} L ${x1} ${bottom} Z`;
};
