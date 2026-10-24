import React from "react";
import { staticFile, useCurrentFrame } from "remotion";
import { CinematicCamera, Layer } from "../components/CinematicCamera";
import { CoalParticles } from "../components/CoalParticles";
import { HistoricalTitle } from "../components/HistoricalTitle";
import { IndustrialFog } from "../components/IndustrialFog";
import { LightBeam } from "../components/LightBeam";
import { flameFlicker, MineLamp } from "../components/MineLamp";
import { TunnelInterior, TunnelTimbers } from "../components/MineSilhouette";
import { SceneFade } from "../components/SceneTransition";
import { BEATS } from "../data/timeline";
import { EASE_OUT, keys, ramp } from "../lib/anim";
import { C, FONT } from "../theme";

/**
 * 场景01｜序幕：黑暗中的光（00:00—00:15）
 * 镜头：①全黑中亮起一点火光 → ②矿灯被提起、光束扫过煤壁，镜头缓推 → ③镜头后拉、上摇，巷道支架显现，标题浮现
 */
export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const b = BEATS.opening;
  const lampX = 960;
  const lampY = 430;

  const ignite = ramp(frame, [b.lightPoint, b.lightPoint + 2.2], [0, 1], EASE_OUT);
  const fl = flameFlicker(frame, 1);
  // 光照半径：点亮 → 照亮煤壁 → 照亮整条巷道
  const radius = keys(frame, [[b.lightPoint, 30], [3.5, 380], [b.tunnelReveal, 520], [13, 1050]]) * (0.94 + 0.06 * fl);
  const swing = t > b.lampClink ? Math.sin((t - b.lampClink) * 2.6) * 7 * Math.exp(-(t - b.lampClink) * 0.45) : 0;
  // 光束扫过煤壁
  const beamAngle = keys(frame, [[b.beamSweep, 200], [b.tunnelReveal + 0.8, -15]]);
  const beamAmt = ramp(frame, [b.beamSweep - 0.3, b.beamSweep + 1]) * (1 - ramp(frame, [b.tunnelReveal, b.tunnelReveal + 2]));
  const tunnel = ramp(frame, [b.tunnelReveal - 0.5, 12]);

  const lightA = (beamAngle * Math.PI) / 180;
  const beamPts = (spread: number, len: number) => {
    const s = (spread * Math.PI) / 360;
    return `${lampX},${lampY} ${lampX + Math.cos(lightA - s) * len},${lampY + Math.sin(lightA - s) * len} ${lampX + Math.cos(lightA + s) * len},${lampY + Math.sin(lightA + s) * len}`;
  };

  return (
    <SceneFade dur={15} fadeIn={0} fadeOut={0.7}>
      <CinematicCamera
        keys={[
          { t: 0, zoom: 1.0, x: 0, y: -110 },
          { t: b.tunnelReveal, zoom: 1.32, x: 0, y: -110 },
          { t: 14.5, zoom: 0.92, x: 0, y: 150 },
        ]}
        handheld={0.5}
      >
        <Layer depth={1}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <radialGradient id="op-light">
                <stop offset="0" stopColor="#000" />
                <stop offset="0.35" stopColor="#333" />
                <stop offset="1" stopColor="#fff" />
              </radialGradient>
              <linearGradient id="op-beam" gradientUnits="userSpaceOnUse" x1={lampX} y1={lampY} x2={lampX + Math.cos(lightA) * 1400} y2={lampY + Math.sin(lightA) * 1400}>
                <stop offset="0" stopColor="#000" stopOpacity={0.9 * beamAmt} />
                <stop offset="1" stopColor="#000" stopOpacity={0} />
              </linearGradient>
              <mask id="op-dark">
                <rect x={-800} y={-600} width={3600} height={2400} fill="#fff" />
                <circle cx={lampX} cy={lampY} r={Math.max(1, radius)} fill="url(#op-light)" opacity={ignite} />
                <polygon points={beamPts(26, 1500)} fill="url(#op-beam)" />
                <polygon points={beamPts(14, 1500)} fill="url(#op-beam)" />
              </mask>
            </defs>
            {/* 煤壁（远景） */}
            <image href={staticFile("images/textures/coal_wall.png")} x={-300} y={-120} width={2520} height={1320} preserveAspectRatio="none" opacity={0.95} />
            {/* 巷道纵深与木支架 */}
            <g opacity={0.3 + 0.7 * tunnel}>
              <TunnelInterior vx={960} vy={520} light={0.5 * ignite} />
            </g>
            <g opacity={0.25 + 0.75 * tunnel}>
              <TunnelTimbers vx={960} vy={520} count={8} offset={-t * 0.02} lightX={lampX} light={0.6 * ignite} />
            </g>
            {/* 暖色光照 */}
            <circle cx={lampX} cy={lampY} r={radius * 1.05} fill="url(#op-warm)" style={{ mixBlendMode: "soft-light" }} opacity={ignite} />
            <defs>
              <radialGradient id="op-warm">
                <stop offset="0" stopColor={C.gold} stopOpacity={0.9} />
                <stop offset="1" stopColor={C.gold} stopOpacity={0} />
              </radialGradient>
            </defs>
            {/* 黑暗 */}
            <rect x={-800} y={-600} width={3600} height={2400} fill={C.coal} mask="url(#op-dark)" />
            {beamAmt > 0 && <LightBeam id="op" x={lampX} y={lampY} angle={beamAngle} length={1300} spread={24} intensity={0.22 * beamAmt * fl} />}
            {/* 吊绳 */}
            <line x1={lampX} y1={lampY - 200} x2={lampX} y2={lampY - 150 * 0.62} stroke="#2A241C" strokeWidth={3} opacity={ignite} />
            <g opacity={Math.min(1, ignite * 1.6)}>
              <MineLamp x={lampX} y={lampY} scale={0.62} lit={ignite} swing={swing} halo={0.9} seed={1} />
            </g>
          </svg>
          <CoalParticles count={220} seed={3} light={{ x: lampX, y: lampY, r: radius * 0.9 }} drift={[5, -3]} base={0} intensity={ignite} />
          <IndustrialFog opacity={0.12 * ignite} speed={8} />
        </Layer>
      </CinematicCamera>

      <HistoricalTitle text="回响·1925" inAt={b.titleIn} outAt={b.titleOut} size={150} y={640} color="#EFE4CC" spacingFrom={0.45} spacingTo={0.16} glow="rgba(214,172,102,0.35)" />
      <HistoricalTitle text="国家记忆中的工人力量" inAt={b.titleIn + 1.6} outAt={b.titleOut} size={46} y={770} weight={400} color="rgba(232,224,210,0.85)" spacingFrom={0.9} spacingTo={0.5} stagger={0.05} dur={1.4} family={FONT.serif} />
    </SceneFade>
  );
};
