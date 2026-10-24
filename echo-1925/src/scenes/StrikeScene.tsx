import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CinematicCamera, Layer } from "../components/CinematicCamera";
import { CoalParticles } from "../components/CoalParticles";
import { CrowdSilhouette } from "../components/CrowdSilhouette";
import { DateDisplay, HistoricalTitle, ReenactmentLabel } from "../components/HistoricalTitle";
import { IndustrialFog } from "../components/IndustrialFog";
import { Glow, LightBeam } from "../components/LightBeam";
import { flameFlicker, MineLamp } from "../components/MineLamp";
import { Boiler, Flywheel, Headframe, MineCart, Smoke } from "../components/MineSilhouette";
import { SceneFade, Shot } from "../components/SceneTransition";
import { BEATS, sceneById } from "../data/timeline";
import { EASE_OUT, clamp, rand, ramp } from "../lib/anim";
import { C } from "../theme";
import { OvercastSky } from "./MiningLifeScene";

const S0 = sceneById("strike").start;
const L = (abs: number) => abs - S0;

/** 减速至停止的转角：初角速度 w0（度/秒），在 T 秒内匀减速到 0 */
const decel = (t: number, w0: number, T: number) => {
  const k = clamp(t, 0, T);
  return w0 * (k - (k * k) / (2 * T));
};

/**
 * 场景04｜历史转折：七月九日（01:10—01:42）
 * 镜头：①黑场静默 → 大号日期 + 汽笛 → ②锅炉熄火 → ③飞轮减速停止 → ④矿车停下、天轮停转
 * → ⑤黑暗中矿灯一盏盏亮起 → ⑥矿工走出井口 → ⑦工人群像汇聚，井架与暗红天幕，主标题
 */
export const StrikeScene: React.FC = () => {
  const b = BEATS.strike;
  return (
    <SceneFade dur={32} fadeIn={0} fadeOut={0.8}>
      <Shot from={L(b.date) - 0.2} to={L(b.boiler) + 0.4} fadeIn={0} fadeOut={0.5} name="日期">
        <DateShot />
      </Shot>
      <Shot from={L(b.boiler)} to={L(b.flywheel) + 0.3} fadeIn={0.4} fadeOut={0.3} name="锅炉熄火">
        <BoilerShot />
      </Shot>
      <Shot from={L(b.flywheel)} to={L(b.cart) + 0.3} fadeIn={0.3} fadeOut={0.3} name="飞轮停转">
        <FlywheelShot />
      </Shot>
      <Shot from={L(b.cart)} to={L(b.lamps) + 0.2} fadeIn={0.3} fadeOut={0.6} name="矿车停下">
        <CartStopShot />
      </Shot>
      <Shot from={L(b.lamps)} to={L(b.walkout) + 0.6} fadeIn={0} fadeOut={0.6} name="矿灯亮起">
        <LampsShot />
      </Shot>
      <Shot from={L(b.walkout)} to={L(b.crowd) + 0.8} fadeIn={0.6} fadeOut={0.8} name="走出井口">
        <WalkoutShot />
      </Shot>
      <Shot from={L(b.crowd)} to={32} fadeIn={0.8} fadeOut={0} name="群像">
        <AssemblyShot />
      </Shot>
    </SceneFade>
  );
};

const DateShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const steam = ramp(frame, [1.2, 3.5]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Smoke x={960} y={1200} t={t * 0.8 + 2} scale={2.2} opacity={0.22 * steam} seed={41} color="#7A8086" wind={0.2} />
      </svg>
      <DateDisplay year="1925" rest="年7月9日" inAt={0.2} size={220} y={520} />
    </AbsoluteFill>
  );
};

const BoilerShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const fire = 1 - ramp(frame, [0.3, 3.0]) * 0.92;
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.0 }, { t: 3.3, zoom: 1.12, y: 10 }]}>
      <Layer depth={1}>
        <AbsoluteFill style={{ background: "#07080A" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Boiler x={960} y={560} w={980} fire={fire} t={t} />
          <rect x={-200} y={880} width={2400} height={400} fill="#050505" />
        </svg>
        <CoalParticles count={120} seed={402} light={{ x: 960, y: 600, r: 700 * fire }} drift={[0, -40]} size={[0.8, 2.6]} color="#F0A050" base={0} />
      </Layer>
      <Layer depth={1.2}>
        <IndustrialFog opacity={0.35 * (1 - fire) + 0.1} speed={-30} top={200} height={700} />
      </Layer>
    </CinematicCamera>
  );
};

const FlywheelShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const T = L(BEATS.strike.flywheelStop) - L(BEATS.strike.flywheel);
  const angle = decel(t, 150, T) + 40;
  const settle = t > T ? Math.sin((t - T) * 12) * 1.2 * Math.exp(-(t - T) * 5) : 0;
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.1, x: -40 }, { t: 3.3, zoom: 1.2, x: 30 }]} handheld={0.3}>
      <Layer depth={0.6}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 70% at 65% 45%, #2A2D30 0%, #0B0C0E 70%)" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {[200, 520, 840, 1160, 1480, 1800].map((x) => (
            <rect key={x} x={x} y={-50} width={36} height={1200} fill="#0A0B0C" />
          ))}
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Flywheel cx={1250} cy={520} R={360} angle={angle + settle} light={0.7} />
          <rect x={-200} y={950} width={2400} height={300} fill="#060708" />
        </svg>
      </Layer>
    </CinematicCamera>
  );
};

const CartStopShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const T = L(BEATS.strike.cartStop) - L(BEATS.strike.cart);
  const dist = decel(t, 380, T);
  const wheel = decel(t, 520, T) * 0.9;
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.05, x: -60 }, { t: 3.4, zoom: 1.1, x: 40 }]}>
      <Layer depth={0.15}>
        <OvercastSky tone={0.75} />
      </Layer>
      <Layer depth={0.5}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Headframe x={1350} y={830} scale={0.62} color="#15181B" wheelAngle={decel(t, 140, T + 0.4)} t={t} smoke={0.25 * (1 - t / 4)} />
          <rect x={-300} y={826} width={2600} height={400} fill="#0E1012" />
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <rect x={-300} y={930} width={2600} height={300} fill="#060708" />
          {Array.from({ length: 40 }, (_, i) => (
            <rect key={i} x={-300 + i * 80} y={950} width={50} height={14} fill="#15130F" />
          ))}
          <rect x={-300} y={942} width={2600} height={9} fill="#3B3833" />
          <MineCart x={200 + dist} y={942} scale={1.6} wheel={wheel} color="#0B0D0F" />
          <MineCart x={-220 + dist} y={942} scale={1.6} wheel={wheel} color="#0B0D0F" />
        </svg>
      </Layer>
      <IndustrialFog opacity={0.18} speed={8} top={500} height={600} />
    </CinematicCamera>
  );
};

const LAMP_POS: [number, number, number][] = [
  [960, 560, 0.36],
  [620, 520, 0.27],
  [1310, 500, 0.25],
  [400, 470, 0.19],
  [1560, 455, 0.18],
];

const LampsShot: React.FC = () => {
  const frame = useCurrentFrame();
  const many = useMemo(() => {
    const r = rand(77);
    return Array.from({ length: 70 }, () => ({ x: r() * 2200 - 140, y: 360 + r() * 120, s: 0.04 + r() * 0.08, d: r() }));
  }, []);
  const field = ramp(frame, [4.0, 5.2]);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.15 }, { t: 5.6, zoom: 1.0, y: -20 }]}>
      <Layer depth={1}>
        <AbsoluteFill style={{ background: "#020203" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <radialGradient id="lf-dot">
              <stop offset="0" stopColor="#FFF0C8" />
              <stop offset="0.25" stopColor={C.gold} stopOpacity={0.6} />
              <stop offset="1" stopColor={C.gold} stopOpacity={0} />
            </radialGradient>
          </defs>
          <g style={{ mixBlendMode: "screen" }}>
            {many.map((m, i) => {
              const k = clamp((field - m.d * 0.7) * 3) * flameFlicker(frame, i);
              return <circle key={i} cx={m.x} cy={m.y} r={260 * m.s} fill="url(#lf-dot)" opacity={k} />;
            })}
          </g>
          {LAMP_POS.map(([x, y, s], i) => {
            const on = ramp(frame, [0.6 + i * 0.9, 0.6 + i * 0.9 + 0.5], [0, 1], EASE_OUT);
            return (
              <g key={i}>
                <Glow id={`lp${i}`} x={x} y={y} r={900 * s} opacity={0.5 * on} core={0.05} />
                <MineLamp x={x} y={y} scale={s} lit={on} halo={1} seed={50 + i} />
              </g>
            );
          })}
        </svg>
        <CoalParticles count={140} seed={404} light={{ x: 960, y: 560, r: 600 * ramp(frame, [0.6, 1.2]) }} base={0} />
      </Layer>
    </CinematicCamera>
  );
};

const WalkoutShot: React.FC = () => {
  const frame = useCurrentFrame();
  const fl = flameFlicker(frame, 60);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.12, y: 20 }, { t: 6.6, zoom: 1.0, y: -20 }]}>
      <Layer depth={0.2}>
        <OvercastSky tone={0.6} warm={0.4} />
      </Layer>
      <Layer depth={0.7}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* 井口：石砌拱形巷道口，内部透出灯光 */}
          <rect x={-300} y={700} width={2600} height={500} fill="#0A0B0C" />
          <path d="M 560 760 L 560 380 Q 960 160 1360 380 L 1360 760 Z" fill="#121416" />
          <path d="M 660 760 L 660 430 Q 960 260 1260 430 L 1260 760 Z" fill="#2B2216" />
          <path d="M 660 760 L 660 430 Q 960 260 1260 430 L 1260 760 Z" fill="url(#wo-in)" />
          <defs>
            <radialGradient id="wo-in" cx="0.5" cy="0.75" r="0.7">
              <stop offset="0" stopColor="#F2C886" stopOpacity={0.85 * fl} />
              <stop offset="0.5" stopColor={C.gold} stopOpacity={0.35} />
              <stop offset="1" stopColor="#000" stopOpacity={0.2} />
            </radialGradient>
          </defs>
          {Array.from({ length: 9 }, (_, i) => {
            const a = Math.PI * (0.12 + (i / 8) * 0.76);
            return <line key={i} x1={960 - Math.cos(a) * 300} y1={480 - Math.sin(a) * 170} x2={960 - Math.cos(a) * 400} y2={460 - Math.sin(a) * 260} stroke="#07080A" strokeWidth={8} />;
          })}
        </svg>
      </Layer>
      <Layer depth={1}>
        <CrowdSilhouette
          seed={420}
          count={42}
          motion="toward"
          speed={0.07}
          horizon={720}
          vanishX={960}
          nearY={1500}
          hNear={900}
          hFar={150}
          spreadX={1700}
          roles={{ miner: 1 }}
          colorFar="#2A2219"
          colorNear="#050607"
          lampGlow={1}
        />
      </Layer>
      <Layer depth={1.2}>
        <IndustrialFog opacity={0.2} speed={12} top={500} height={600} />
      </Layer>
      <ReenactmentLabel />
    </CinematicCamera>
  );
};

const AssemblyShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const red = ramp(frame, [0.5, 4]);
  const titleAt = L(BEATS.strike.title) - L(BEATS.strike.crowd);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.18, y: 90 }, { t: 7, zoom: 1.04, y: -30 }]}>
      <Layer depth={0.15}>
        <OvercastSky tone={0.7} />
        <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(168,59,53,${0.45 * red}) 62%, rgba(40,10,8,${0.6 * red}) 80%)`, mixBlendMode: "normal" }} />
      </Layer>
      <Layer depth={0.45}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <LightBeam key={i} id={`as${i}`} x={300 + i * 330} y={720} angle={-90 + (i - 2) * 9} length={1100} spread={8} intensity={0.16 * red} />
          ))}
          <Headframe x={960} y={700} scale={0.95} color="#0B0C0E" wheelAngle={12} t={t} smoke={0} windowGlow={0.15} />
        </svg>
      </Layer>
      <Layer depth={0.7}>
        <IndustrialFog opacity={0.25} speed={10} top={420} height={500} />
      </Layer>
      <Layer depth={1}>
        <CrowdSilhouette
          seed={430}
          count={170}
          motion="still"
          appear={1}
          horizon={690}
          nearY={1300}
          hNear={500}
          hFar={50}
          zRange={[0.02, 0.9]}
          roles={{ miner: 1 }}
          colorFar="#3A2A27"
          colorNear="#050607"
          spreadX={3000}
          lampGlow={0.9}
          raiseFraction={0.12}
        />
      </Layer>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 35%)" }} />
      <HistoricalTitle text="焦作煤矿工人大罢工" inAt={titleAt} size={118} y={300} color="#F1E6D0" spacingFrom={0.4} spacingTo={0.14} stagger={0.07} glow="rgba(168,59,53,0.55)" />
      <ReenactmentLabel />
    </CinematicCamera>
  );
};
