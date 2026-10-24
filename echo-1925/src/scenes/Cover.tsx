import React from "react";
import { AbsoluteFill } from "remotion";
import { CoalParticles } from "../components/CoalParticles";
import { FilmGrain } from "../components/FilmGrain";
import { IndustrialFog } from "../components/IndustrialFog";
import { Glow, LightBeam } from "../components/LightBeam";
import { MineLamp } from "../components/MineLamp";
import { Headframe } from "../components/MineSilhouette";
import { ensureFonts } from "../fonts";
import { ridgePath } from "../lib/anim";
import { C, FONT } from "../theme";
import { OvercastSky } from "./MiningLifeScene";

ensureFonts();

/** 视频封面：黑白煤矿工业场景 + 矿灯光束 + 片名 */
export const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <OvercastSky tone={0.8} warm={0.35} />
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <path d={ridgePath(3, 760, 100)} fill="#2E3338" />
      <Headframe x={1330} y={900} scale={1.15} color="#0A0B0D" wheelAngle={15} t={4} smoke={0.6} windowGlow={0.35} />
      <rect x={0} y={896} width={1920} height={200} fill="#060708" />
      <LightBeam id="cv" x={430} y={800} angle={-38} length={1500} spread={20} intensity={0.5} />
      <Glow id="cvg" x={430} y={800} r={520} opacity={0.6} core={0.05} />
      <MineLamp x={430} y={800} scale={0.6} halo={1} seed={7} />
    </svg>
    <CoalParticles count={160} seed={9} beam={{ x: 430, y: 800, angle: -38, spread: 20, length: 1500 }} light={{ x: 430, y: 800, r: 400 }} base={0.02} />
    <IndustrialFog opacity={0.25} top={560} height={500} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.0) 100%)" }} />
    <div style={{ position: "absolute", left: 160, top: 170, fontFamily: FONT.serif, color: "#F0E4CA" }}>
      <div style={{ fontSize: 170, fontWeight: 900, letterSpacing: "0.12em", textShadow: "0 0 50px rgba(214,172,102,0.35), 0 8px 40px rgba(0,0,0,0.8)" }}>回响·1925</div>
      <div style={{ marginTop: 20, fontSize: 52, fontWeight: 400, letterSpacing: "0.5em", color: "rgba(232,224,210,0.9)" }}>国家记忆中的工人力量</div>
      <div style={{ marginTop: 34, width: 520, height: 4, background: C.red, boxShadow: `0 0 18px ${C.red}` }} />
      <div style={{ marginTop: 26, fontFamily: FONT.sans, fontSize: 28, letterSpacing: "0.32em", color: "rgba(214,172,102,0.9)" }}>1925 年焦作煤矿工人大罢工 · 历史纪录短片</div>
    </div>
    <FilmGrain intensity={0.7} scratches={false} />
  </AbsoluteFill>
);
