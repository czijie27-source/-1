import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CinematicCamera, Layer } from "../components/CinematicCamera";
import { CoalParticles } from "../components/CoalParticles";
import { CrowdSilhouette } from "../components/CrowdSilhouette";
import { HistoricalTitle, ReenactmentLabel } from "../components/HistoricalTitle";
import { IndustrialFog } from "../components/IndustrialFog";
import { Glow, LightBeam } from "../components/LightBeam";
import { flameFlicker } from "../components/MineLamp";
import { Headframe } from "../components/MineSilhouette";
import { SceneFade, Shot } from "../components/SceneTransition";
import { buildFigure, rimmed } from "../components/WorkerSilhouette";
import { BEATS, sceneById } from "../data/timeline";
import { EASE_OUT, ramp, ridgePath } from "../lib/anim";
import { FONT } from "../theme";
import { OvercastSky } from "./MiningLifeScene";

const S0 = sceneById("spirit").start;
const L = (abs: number) => abs - S0;

/**
 * 场景07｜精神回响：特别能战斗（02:41—03:08）
 * 镜头：①情景再现的“影像档案”缓慢漂移 → ②井架与矿灯光束交织，画面由灰转暖，“特别能战斗”缓慢显现
 * → ③挽臂而立的工人：团结奋斗 → ④高举矿灯刺破黑暗：勇于抗争 → ⑤晨光与文献：爱国担当
 */
export const SpiritScene: React.FC = () => {
  const b = BEATS.spirit;
  return (
    <SceneFade dur={27} fadeIn={0.8} fadeOut={0.8}>
      <Shot from={0} to={L(b.beams) + 0.8} fadeIn={0} fadeOut={0.8} name="影像档案">
        <ArchiveShot />
      </Shot>
      <Shot from={L(b.beams)} to={L(b.unity) + 0.5} fadeIn={0.8} fadeOut={0.5} name="特别能战斗">
        <SloganShot />
      </Shot>
      <Shot from={L(b.unity)} to={L(b.struggle) + 0.4} fadeIn={0.5} fadeOut={0.4} name="团结奋斗">
        <UnityShot />
      </Shot>
      <Shot from={L(b.struggle)} to={L(b.patriotism) + 0.4} fadeIn={0.4} fadeOut={0.4} name="勇于抗争">
        <StruggleShot />
      </Shot>
      <Shot from={L(b.patriotism)} to={27} fadeIn={0.4} fadeOut={0} name="爱国担当">
        <PatriotismShot />
      </Shot>
    </SceneFade>
  );
};

const PhotoFrame: React.FC<{ x: number; y: number; w: number; h: number; rot: number; children: React.ReactNode }> = ({ x, y, w, h, rot, children }) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      transform: `rotate(${rot}deg)`,
      background: "#D9CFBC",
      padding: 18,
      boxShadow: "0 30px 60px rgba(0,0,0,0.7)",
    }}
  >
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#5E5446", filter: "sepia(0.6) contrast(1.1)" }}>
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
        {children}
      </svg>
    </div>
  </div>
);

const ArchiveShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const drift = (k: number) => t * k;
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.05, x: -50 }, { t: 6.8, zoom: 1.15, x: 50 }]}>
      <Layer depth={0.4}>
        <AbsoluteFill style={{ background: "#0C0E10" }} />
      </Layer>
      <Layer depth={0.6}>
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${drift(-12)}px)` }}>
          <PhotoFrame x={1450} y={300} w={560} h={380} rot={4}>
            <rect width={1920} height={1080} fill="#8A7D69" />
            <Headframe x={900} y={950} scale={1.2} color="#2A231B" />
            <rect y={940} width={1920} height={200} fill="#2A231B" />
          </PhotoFrame>
        </div>
      </Layer>
      <Layer depth={0.85}>
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${drift(10)}px)` }}>
          <PhotoFrame x={480} y={640} w={640} h={440} rot={-5}>
            <rect width={1920} height={1080} fill="#968A75" />
            {Array.from({ length: 9 }, (_, i) => buildFigure({ x: 160 + i * 200, y: 1000 + (i % 2) * 30, h: 700 + (i % 3) * 30, view: "front", pose: "stand", phase: i, hat: i % 3 === 0 ? "cap" : "towel", color: "#2A231B" }, i).el)}
          </PhotoFrame>
        </div>
      </Layer>
      <Layer depth={1.1}>
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${drift(-18)}px)` }}>
          <PhotoFrame x={1180} y={760} w={600} h={400} rot={2}>
            <rect width={1920} height={1080} fill="#7E725F" />
            <CrowdSilhouette seed={701} count={70} motion="still" appear={1} horizon={500} nearY={1200} hNear={700} hFar={80} colorFar="#6A5F4E" colorNear="#2A231B" roles={{ miner: 3, student: 1 }} />
          </PhotoFrame>
        </div>
      </Layer>
      <ReenactmentLabel text="情景再现画面" />
    </CinematicCamera>
  );
};

const SloganShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const warm = ramp(frame, [0, 6]);
  const sloganAt = L(BEATS.spirit.slogan) - L(BEATS.spirit.beams);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.15, y: 80 }, { t: 11, zoom: 1.0, y: -40 }]}>
      <Layer depth={0.15}>
        <OvercastSky tone={0.55 + 0.25 * warm} warm={warm} />
        <AbsoluteFill style={{ background: `rgba(214,172,102,${0.12 * warm})`, mixBlendMode: "soft-light" }} />
      </Layer>
      <Layer depth={0.5}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {Array.from({ length: 9 }, (_, i) => (
            <LightBeam key={i} id={`sl${i}`} x={160 + i * 200} y={900} angle={-90 + (i - 4) * 7 + Math.sin(t * 0.6 + i) * 3} length={1200} spread={7} intensity={(0.12 + 0.12 * warm) * flameFlicker(frame, i)} />
          ))}
          <Headframe x={960} y={880} scale={1.05} color="#0A0B0C" wheelAngle={t * 10} t={t} smoke={0.3} windowGlow={0.4 * warm} />
          <rect x={-300} y={876} width={2600} height={400} fill="#08090A" />
        </svg>
      </Layer>
      <Layer depth={1}>
        <CrowdSilhouette seed={710} count={110} motion="still" appear={1} horizon={880} nearY={1260} hNear={380} hFar={60} zRange={[0.05, 0.85]} roles={{ miner: 1 }} colorFar="#3A3026" colorNear="#060607" spreadX={3000} lampGlow={0.9} />
      </Layer>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 45% at 50% 40%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)", opacity: ramp(frame, [sloganAt - 1, sloganAt]) }} />
      <HistoricalTitle text="特别能战斗" inAt={sloganAt} size={196} y={400} color="#F3E3C0" weight={900} spacingFrom={0.5} spacingTo={0.2} stagger={0.22} dur={2.0} glow="rgba(214,172,102,0.45)" />
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontFamily: FONT.serif, fontSize: 30, letterSpacing: "0.4em", color: "rgba(232,224,210,0.7)", opacity: ramp(frame, [sloganAt + 2.2, sloganAt + 3.2]) }}>
        —— 毛泽东《中国社会各阶级的分析》
      </div>
      <ReenactmentLabel />
    </CinematicCamera>
  );
};

const KeywordText: React.FC<{ text: string; inAt: number; style: React.CSSProperties; vertical?: boolean }> = ({ text, inAt, style, vertical }) => {
  const frame = useCurrentFrame();
  const k = ramp(frame, [inAt, inAt + 1.4], [0, 1], EASE_OUT);
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: FONT.serif,
        fontWeight: 900,
        fontSize: 132,
        color: "#F1E4C8",
        letterSpacing: `${0.4 - 0.18 * k}em`,
        opacity: k,
        filter: `blur(${(1 - k) * 8}px)`,
        textShadow: "0 0 40px rgba(214,172,102,0.35), 0 6px 30px rgba(0,0,0,0.7)",
        writingMode: vertical ? "vertical-rl" : undefined,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

const UnityShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const n = 7;
  const figs = Array.from({ length: n }, (_, i) => ({ x: 420 + i * 200, y: 1000, h: 560 + (i % 3) * 25 }));
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.0, x: 40 }, { t: 3.9, zoom: 1.07, x: -30 }]}>
      <Layer depth={0.15}>
        <OvercastSky tone={0.9} warm={0.9} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 40% at 50% 92%, rgba(236,186,118,0.55) 0%, rgba(0,0,0,0) 70%)" }} />
      </Layer>
      <Layer depth={0.5}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={ridgePath(41, 860, 60)} fill="#1E1A16" />
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <g style={{ filter: "drop-shadow(0 -2px 2px rgba(240,200,140,0.7))" }}>
            {figs.map((f, i) => buildFigure({ x: f.x, y: f.y, h: f.h, view: "front", pose: "stand", phase: t + i, hat: i % 2 ? "towel" : "cap", color: "#060606" }, i).el)}
            {figs.slice(0, -1).map((f, i) => {
              const g = figs[i + 1];
              const ya = f.y - f.h * 0.68;
              const yb = g.y - g.h * 0.68;
              return <path key={`arm${i}`} d={`M ${f.x + f.h * 0.12} ${ya - f.h * 0.06} Q ${(f.x + g.x) / 2} ${(ya + yb) / 2 + 20} ${g.x - g.h * 0.12} ${yb - g.h * 0.06}`} stroke="#060606" strokeWidth={f.h * 0.05} fill="none" strokeLinecap="round" />;
            })}
          </g>
          <rect x={-300} y={995} width={2600} height={200} fill="#050505" />
        </svg>
      </Layer>
      <KeywordText text="团结奋斗" inAt={0.3} style={{ left: 130, top: 150 }} />
    </CinematicCamera>
  );
};

const StruggleShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const fl = flameFlicker(frame, 90);
  const beam = ramp(frame, [0, 1.2], [0, 1], EASE_OUT);
  const fig = buildFigure({ x: 640, y: 1060, h: 700, pose: "raise", phase: t, facing: 1, hat: "towel", tool: "lamp", color: "#040404" });
  const lp = fig.lamp ?? [700, 300];
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.08 }, { t: 3.4, zoom: 1.15, x: 30, y: -20 }]} handheld={0.4}>
      <Layer depth={1}>
        <AbsoluteFill style={{ background: "#030304" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <LightBeam id="st1" x={lp[0]} y={lp[1]} angle={-28} length={1800} spread={22} intensity={0.55 * beam * fl} />
          <LightBeam id="st2" x={lp[0]} y={lp[1]} angle={-28} length={1500} spread={9} intensity={0.4 * beam * fl} />
          <Glow id="st" x={lp[0]} y={lp[1]} r={420} opacity={0.8 * fl} core={0.06} />
          {rimmed(fig, 1, 1).el}
        </svg>
        <CoalParticles count={160} seed={901} beam={{ x: lp[0], y: lp[1], angle: -28, spread: 22, length: 1700 }} base={0} intensity={beam} />
      </Layer>
      <KeywordText text="勇于抗争" inAt={0.4} vertical style={{ right: 180, top: 150 }} />
    </CinematicCamera>
  );
};

const PatriotismShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const dawn = ramp(frame, [0, 3]);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.1, y: 30 }, { t: 3.6, zoom: 1.02, y: -10 }]}>
      <Layer depth={0.15}>
        <OvercastSky tone={0.9 + 0.2 * dawn} warm={1} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 45% at 50% 88%, rgba(246,200,130,${0.6 * dawn}) 0%, rgba(214,172,102,0.15) 50%, rgba(0,0,0,0) 80%)` }} />
      </Layer>
      <Layer depth={0.5}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={ridgePath(51, 820, 80)} fill="#2A231C" />
          <Headframe x={1460} y={840} scale={0.55} color="#14110E" wheelAngle={t * 20} t={t} smoke={0.2} />
          <rect x={-300} y={836} width={2600} height={400} fill="#0E0C0A" />
        </svg>
      </Layer>
      <Layer depth={1}>
        <CoalParticles count={70} seed={951} light={{ x: 960, y: 900, r: 900 }} base={0.05} drift={[4, -8]} color="#F2D29A" />
      </Layer>
      <KeywordText text="爱国担当" inAt={0.3} style={{ left: 0, right: 0, top: 360, textAlign: "center" }} />
      <IndustrialFog opacity={0.12} speed={6} top={600} height={400} />
    </CinematicCamera>
  );
};
