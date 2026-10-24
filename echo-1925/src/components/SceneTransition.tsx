import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { FPS } from "../data/timeline";
import { ramp } from "../lib/anim";

/**
 * 镜头（Shot）：场景内的一个镜头/构图状态，from/to 为场景局部秒。
 * fadeIn/fadeOut 形成溶接（与相邻镜头重叠）或黑场过渡。
 * 子组件内 useCurrentFrame() 返回镜头内的局部帧。
 */
export const Shot: React.FC<{
  from: number;
  to: number;
  fadeIn?: number;
  fadeOut?: number;
  children: React.ReactNode;
  name?: string;
}> = ({ from, to, fadeIn = 0.6, fadeOut = 0.6, children, name }) => {
  const f0 = Math.round(from * FPS);
  const dur = Math.max(1, Math.round((to - from) * FPS));
  return (
    <Sequence from={f0} durationInFrames={dur} name={name} layout="none">
      <ShotFade dur={to - from} fadeIn={fadeIn} fadeOut={fadeOut}>
        {children}
      </ShotFade>
    </Sequence>
  );
};

const ShotFade: React.FC<{ dur: number; fadeIn: number; fadeOut: number; children: React.ReactNode }> = ({ dur, fadeIn, fadeOut, children }) => {
  const frame = useCurrentFrame();
  const a = fadeIn > 0 ? ramp(frame, [0, fadeIn]) : 1;
  const b = fadeOut > 0 ? 1 - ramp(frame, [dur - fadeOut, dur]) : 1;
  return <AbsoluteFill style={{ opacity: Math.min(a, b) }}>{children}</AbsoluteFill>;
};

/** 场景首尾的黑场淡入淡出（秒） */
export const SceneFade: React.FC<{ dur: number; fadeIn?: number; fadeOut?: number; children: React.ReactNode }> = ({ dur, fadeIn = 0.8, fadeOut = 0.8, children }) => {
  const frame = useCurrentFrame();
  const a = fadeIn > 0 ? ramp(frame, [0, fadeIn]) : 1;
  const b = fadeOut > 0 ? 1 - ramp(frame, [dur - fadeOut, dur]) : 1;
  return <AbsoluteFill style={{ opacity: Math.min(a, b), background: "#000" }}>{children}</AbsoluteFill>;
};

/** 光线遮罩过渡：一道柔和的暖光扫过画面 */
export const LightSweep: React.FC<{ at: number; dur?: number; color?: string }> = ({ at, dur = 1.2, color = "rgba(214,172,102,0.55)" }) => {
  const frame = useCurrentFrame();
  const k = ramp(frame, [at, at + dur]);
  if (k <= 0 || k >= 1) return null;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(100deg, transparent ${k * 140 - 40}%, ${color} ${k * 140 - 20}%, transparent ${k * 140}%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};
