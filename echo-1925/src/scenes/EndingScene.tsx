import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CinematicCamera, Layer } from "../components/CinematicCamera";
import { CoalParticles } from "../components/CoalParticles";
import { HistoricalTitle } from "../components/HistoricalTitle";
import { IndustrialFog } from "../components/IndustrialFog";
import { Glow, LightBeam } from "../components/LightBeam";
import { flameFlicker, MineLamp } from "../components/MineLamp";
import { Headframe } from "../components/MineSilhouette";
import { SceneFade, Shot } from "../components/SceneTransition";
import { buildFigure, rimmed } from "../components/WorkerSilhouette";
import { BEATS, sceneById } from "../data/timeline";
import { EASE_OUT, rand, ramp, ridgePath } from "../lib/anim";
import { C, FONT } from "../theme";

const S0 = sceneById("ending").start;
const L = (abs: number) => abs - S0;

/**
 * 场景08｜尾声：让国家记忆继续回响（03:08—03:30）
 * 镜头：①旧矿灯特写，火光化作一道光束 → ②光束延伸向当代工业图景（风机、输电塔、现代井塔、列车灯带）
 * → ③工业遗址井架前，青年人驻足回望 → ④回到矿灯，片名与主题语，纯净结束画面
 */
export const EndingScene: React.FC = () => {
  const b = BEATS.ending;
  return (
    <SceneFade dur={22} fadeIn={0.8} fadeOut={L(210) - L(b.fadeOut)}>
      <Shot from={0} to={L(b.modern) + 0.9} fadeIn={0} fadeOut={0.9} name="矿灯特写">
        <LampBeamShot />
      </Shot>
      <Shot from={L(b.modern)} to={L(b.youth) + 0.8} fadeIn={0.9} fadeOut={0.8} name="当代工业">
        <ModernShot />
      </Shot>
      <Shot from={L(b.youth)} to={L(b.finalLamp) + 0.6} fadeIn={0.8} fadeOut={0.8} name="青年回望">
        <YouthShot />
      </Shot>
      <Shot from={L(b.finalLamp)} to={22} fadeIn={0.8} fadeOut={0} name="片尾">
        <FinalShot />
      </Shot>
    </SceneFade>
  );
};

const LampBeamShot: React.FC = () => {
  const frame = useCurrentFrame();
  const fl = flameFlicker(frame, 100);
  const beam = ramp(frame, [2.0, 4.6], [0, 1], EASE_OUT);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.25, x: 0 }, { t: 2.4, zoom: 1.2, x: 0 }, { t: 5.4, zoom: 1.0, x: 520 }]}>
      <Layer depth={1}>
        <AbsoluteFill style={{ background: "#040404" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Glow id="eb" x={960} y={520} r={700} opacity={0.5 * fl} core={0.05} />
          <LightBeam id="eb1" x={980} y={520} angle={0} length={2600 * beam + 10} spread={10 + 8 * beam} intensity={0.6 * beam * fl} />
          <MineLamp x={960} y={520} scale={1.15} halo={1} seed={100} />
        </svg>
        <CoalParticles count={130} seed={1001} beam={{ x: 980, y: 520, angle: 0, spread: 18, length: 2600 }} light={{ x: 960, y: 520, r: 500 }} base={0} size={[0.8, 3.6]} />
      </Layer>
    </CinematicCamera>
  );
};

const Pylon: React.FC<{ x: number; y: number; s: number; c: string }> = ({ x, y, s, c }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={c} fill="none" strokeWidth={4}>
    <path d="M -60 0 L -12 -400 L 12 -400 L 60 0" />
    <path d="M -100 -300 L 100 -300 M -80 -360 L 80 -360 M -10 -400 L 0 -440 L 10 -400" />
    {Array.from({ length: 6 }, (_, i) => {
      const y0 = -i * 60;
      const w0 = 60 - (48 * i * 60) / 400;
      const w1 = 60 - (48 * (i + 1) * 60) / 400;
      return <path key={i} d={`M ${-w0} ${y0} L ${w1} ${y0 - 60} M ${w0} ${y0} L ${-w1} ${y0 - 60}`} strokeWidth={2} />;
    })}
  </g>
);

const Turbine: React.FC<{ x: number; y: number; s: number; a: number; c: string }> = ({ x, y, s, a, c }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -6 0 L -3 -300 L 3 -300 L 6 0 Z" fill={c} />
    <g transform={`translate(0 -300) rotate(${a})`}>
      {[0, 120, 240].map((r) => (
        <path key={r} transform={`rotate(${r})`} d="M 0 0 L -6 -10 L 0 -170 L 8 -12 Z" fill={c} />
      ))}
      <circle r={8} fill={c} />
    </g>
  </g>
);

const ModernShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const lights = useMemo(() => {
    const r = rand(1101);
    return Array.from({ length: 140 }, () => ({ x: r() * 2400 - 240, y: 700 + r() * 150, s: 1 + r() * 2.5, ph: r() * 6 }));
  }, []);
  const trainX = -900 + t * 330;
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.1, x: -120 }, { t: 5.8, zoom: 1.04, x: 80 }]}>
      <Layer depth={0.15}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #1A2028 0%, #3A3A3C 45%, #8A6A48 70%, #D6A066 80%, #2A2420 100%)" }} />
      </Layer>
      <Layer depth={0.3}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={ridgePath(61, 720, 90)} fill="#3A3634" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Turbine key={i} x={120 + i * 340} y={680 - (i % 2) * 30} s={0.5 + (i % 3) * 0.06} a={t * 40 + i * 30} c="#6A625A" />
          ))}
        </svg>
      </Layer>
      <Layer depth={0.55}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* 输电塔与导线 */}
          {[-100, 600, 1300, 2000].map((x, i) => (
            <Pylon key={i} x={x} y={820} s={0.9} c="#1B1A1B" />
          ))}
          {[0, 1, 2].map((k) => (
            <path key={k} d={[-100, 600, 1300].map((x) => `M ${x + (k - 1) * 90} ${820 - 330 - k * 10} Q ${x + 350} ${820 - 250 - k * 10} ${x + 700 + (k - 1) * 90} ${820 - 330 - k * 10}`).join(" ")} stroke="#1B1A1B" strokeWidth={2} fill="none" />
          ))}
          {/* 现代井塔与皮带走廊 */}
          <rect x={1180} y={360} width={150} height={470} fill="#161517" />
          <rect x={1160} y={330} width={190} height={50} fill="#161517" />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={1200} y={400 + i * 50} width={110} height={8} fill={C.gold} opacity={0.5 + 0.3 * Math.sin(t * 2 + i)} />
          ))}
          <path d="M 1330 720 L 1720 560 L 1760 590 L 1340 760 Z" fill="#141315" />
          <path d="M 300 830 L 300 720 L 820 720 L 820 830 Z" fill="#131214" />
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={320 + i * 36} y={745} width={22} height={14} fill={C.gold} opacity={0.6} />
          ))}
          {/* 高架桥与列车灯带 */}
          <rect x={-400} y={846} width={2800} height={16} fill="#0F0E10" />
          {Array.from({ length: 16 }, (_, i) => (
            <rect key={i} x={-300 + i * 180} y={860} width={18} height={140} fill="#0F0E10" />
          ))}
          <g>
            <path d={`M ${trainX} 846 L ${trainX + 1300} 846 Q ${trainX + 1420} 846 ${trainX + 1440} 812 L ${trainX + 1300} 800 L ${trainX} 800 Z`} fill="#26252A" />
            <rect x={trainX + 20} y={812} width={1300} height={10} fill="#F2D29A" opacity={0.85} />
          </g>
          <rect x={-400} y={990} width={2800} height={200} fill="#0B0A0B" />
          <g style={{ mixBlendMode: "screen" }}>
            {lights.map((l, i) => (
              <circle key={i} cx={l.x} cy={l.y + 150} r={l.s} fill="#F5D79E" opacity={0.5 + 0.4 * Math.sin(t * 2 + l.ph)} />
            ))}
          </g>
        </svg>
      </Layer>
      <Layer depth={1}>
        <IndustrialFog opacity={0.18} speed={10} top={600} height={500} />
      </Layer>
    </CinematicCamera>
  );
};

const YouthShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.0, y: -20 }, { t: 4.4, zoom: 1.08, y: 20 }]}>
      <Layer depth={0.15}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #232830 0%, #5A4A3A 50%, #C88E58 78%, #3A2A20 100%)" }} />
      </Layer>
      <Layer depth={0.6}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* 保留下来的工业遗址井架 */}
          <Headframe x={1080} y={860} scale={1.0} color="#151210" wheelAngle={0} engineHouse chimney={false} windowGlow={0.6} />
          <Glow id="yh" x={1080} y={700} r={600} opacity={0.35} core={0.05} color="#F0C080" />
          <rect x={-300} y={856} width={2600} height={400} fill="#0E0C0B" />
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {[
            { x: 300, h: 540, raise: false },
            { x: 450, h: 500, raise: false },
            { x: 600, h: 560, raise: true },
            { x: 760, h: 520, raise: false },
          ].map((p, i) => rimmed(buildFigure({ x: p.x, y: 1010, h: p.h, view: "front", pose: p.raise ? "raise" : "stand", phase: t * 0.5 + i * 1.3, hat: "none", garment: i === 1 ? "coat" : "jacket", color: "#070605", build: 0.88 + (i % 2) * 0.08 }), 0.9, 1).el)}
          <rect x={-300} y={1005} width={2600} height={200} fill="#060505" />
        </svg>
      </Layer>
    </CinematicCamera>
  );
};

const FinalShot: React.FC = () => {
  const frame = useCurrentFrame();
  const fl = flameFlicker(frame, 120);
  const b = BEATS.ending;
  const base = b.finalLamp;
  const grow = ramp(frame, [0, 4], [0.5, 1]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Glow id="fl" x={960} y={330} r={760 * grow} opacity={0.5 * fl} core={0.04} />
        <MineLamp x={960} y={330} scale={0.42} halo={grow} seed={120} />
      </svg>
      <CoalParticles count={80} seed={1201} light={{ x: 960, y: 330, r: 600 * grow }} base={0} />
      <HistoricalTitle text="回响·1925" inAt={b.finalTitle - base} size={132} y={600} color="#F0E4CA" spacingFrom={0.4} spacingTo={0.16} glow="rgba(214,172,102,0.35)" />
      <HistoricalTitle text="铭记历史回响，传承奋斗精神。" inAt={b.finalSlogan - base} size={50} y={730} weight={700} color="rgba(240,228,202,0.92)" spacingFrom={0.4} spacingTo={0.22} stagger={0.04} dur={1.2} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 830, textAlign: "center", fontFamily: FONT.sans, fontSize: 26, letterSpacing: "0.5em", color: "rgba(214,172,102,0.8)", opacity: ramp(frame, [b.credit - base, b.credit - base + 1.2]) }}>
        国家记忆 · 红色精神传承主题作品
      </div>
    </AbsoluteFill>
  );
};
