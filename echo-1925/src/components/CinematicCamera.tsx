import React, { createContext, useContext } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EASE, keys as kf, noise1 } from "../lib/anim";

export interface CamKey {
  t: number; // 秒（局部）
  zoom?: number;
  x?: number; // 像素，正值向右摇
  y?: number; // 像素，正值向下
  rot?: number; // 度
}

interface CamState {
  zoom: number;
  x: number;
  y: number;
  rot: number;
}

const CamCtx = createContext<CamState>({ zoom: 1, x: 0, y: 0, rot: 0 });

const track = (frame: number, ks: CamKey[], prop: keyof Omit<CamKey, "t">, def: number) => {
  const pts = ks.filter((k) => k[prop] !== undefined).map((k) => [k.t, k[prop] as number] as [number, number]);
  if (pts.length === 0) return def;
  return kf(frame, pts, EASE);
};

/**
 * 摄影机：以关键帧描述推、拉、摇、移，子层 <Layer depth> 按景深产生视差。
 * handheld > 0 时叠加轻微手持呼吸感（确定性噪声）。
 */
export const CinematicCamera: React.FC<{
  keys: CamKey[];
  handheld?: number;
  children: React.ReactNode;
}> = ({ keys: ks, handheld = 0, children }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const st: CamState = {
    zoom: track(frame, ks, "zoom", 1),
    x: track(frame, ks, "x", 0) + handheld * (noise1(t * 0.6, 1) - 0.5) * 14,
    y: track(frame, ks, "y", 0) + handheld * (noise1(t * 0.5, 2) - 0.5) * 10,
    rot: track(frame, ks, "rot", 0) + handheld * (noise1(t * 0.4, 3) - 0.5) * 0.3,
  };
  return (
    <CamCtx.Provider value={st}>
      <AbsoluteFill style={{ overflow: "hidden" }}>{children}</AbsoluteFill>
    </CamCtx.Provider>
  );
};

/**
 * 景深层：depth=1 与摄影机完全同步，depth<1 为远景（移动更慢），depth>1 为前景。
 * blur 模拟浅景深。
 */
export const Layer: React.FC<{
  depth?: number;
  blur?: number;
  opacity?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ depth = 1, blur = 0, opacity = 1, style, children }) => {
  const cam = useContext(CamCtx);
  const s = 1 + (cam.zoom - 1) * depth;
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${s}) translate(${-cam.x * depth}px, ${-cam.y * depth}px) rotate(${cam.rot * depth}deg)`,
        transformOrigin: "50% 50%",
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        opacity,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const useCamera = () => useContext(CamCtx);
