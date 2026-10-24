import React, { useMemo } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { AnimatedTimeline } from "../components/AnimatedTimeline";
import { CinematicCamera, Layer } from "../components/CinematicCamera";
import { CoalParticles } from "../components/CoalParticles";
import { CrowdSilhouette } from "../components/CrowdSilhouette";
import { HistoricalDocument, InkLines } from "../components/HistoricalDocument";
import { InfoCaption, ReenactmentLabel } from "../components/HistoricalTitle";
import { IndustrialFog } from "../components/IndustrialFog";
import { Glow } from "../components/LightBeam";
import { flameFlicker, MineLamp } from "../components/MineLamp";
import { Headframe, Smoke } from "../components/MineSilhouette";
import { LightSweep, SceneFade, Shot } from "../components/SceneTransition";
import { buildFigure, rimmed } from "../components/WorkerSilhouette";
import { BEATS, sceneById } from "../data/timeline";
import { EASE_OUT, clamp, rand, ramp } from "../lib/anim";
import { C, FONT } from "../theme";
import { OvercastSky } from "./MiningLifeScene";

const S0 = sceneById("persistence").start;
const L = (abs: number) => abs - S0;

/**
 * 场景06｜漫长坚守：八个月的斗争（02:14—02:41）
 * 镜头：①昏黄灯光下的工人夜校 → ②互助与救济 → ③寒冬中沉寂的井架 → ④翻动的月历
 * → ⑤《一九二六年工人罢工条款合同》签订（文献示意）→ ⑥晨光中复工，天轮重新转动
 * 贯穿：画面上缘的时间轴 1925年7月 → 1925年秋冬 → 1926年3月
 */
export const PersistenceScene: React.FC = () => {
  const b = BEATS.persistence;
  return (
    <SceneFade dur={27} fadeIn={0.8} fadeOut={0.8}>
      <Shot from={0} to={L(b.mutualAid) + 0.6} fadeIn={0} fadeOut={0.6} name="夜校">
        <NightSchoolShot />
      </Shot>
      <Shot from={L(b.mutualAid)} to={L(b.winter) + 0.6} fadeIn={0.6} fadeOut={0.6} name="互助">
        <MutualAidShot />
      </Shot>
      <Shot from={L(b.winter)} to={L(b.winter) + 2.9} fadeIn={0.6} fadeOut={0.4} name="寒冬">
        <WinterShot />
      </Shot>
      <Shot from={L(b.winter) + 2.6} to={L(b.contract) + 0.4} fadeIn={0.3} fadeOut={0.4} name="月历">
        <CalendarShot />
      </Shot>
      <Shot from={L(b.contract)} to={L(b.resumption) + 0.6} fadeIn={0.4} fadeOut={0.6} name="合同">
        <ContractShot />
      </Shot>
      <Shot from={L(b.resumption)} to={27} fadeIn={0.6} fadeOut={0} name="复工">
        <ResumptionShot />
      </Shot>
      <AnimatedTimeline
        from={0.2}
        to={L(b.contract) + 0.2}
        marks={[
          { label: "1925年7月", at: 0.6 },
          { label: "1925年秋冬", at: L(b.winter) + 0.4 },
          { label: "1926年3月", at: L(b.contract) - 0.6 },
        ]}
      />
    </SceneFade>
  );
};

const NightSchoolShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const fl = flameFlicker(frame, 80);
  const lamp = { x: 860, y: 300 };
  const chars = ["工", "人", "识", "字"];
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.06, x: -40 }, { t: 6.1, zoom: 1.16, x: 50 }]}>
      <Layer depth={0.7}>
        <AbsoluteFill style={{ background: "#0B0B0A" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <radialGradient id="ns-wall" cx="0.45" cy="0.3" r="0.7">
              <stop offset="0" stopColor="#4A3F31" stopOpacity={0.9 * fl} />
              <stop offset="0.6" stopColor="#1A1714" stopOpacity={0.9} />
              <stop offset="1" stopColor="#080808" />
            </radialGradient>
          </defs>
          <rect x={-300} y={-200} width={2600} height={1500} fill="url(#ns-wall)" />
          {/* 黑板 */}
          <rect x={1180} y={240} width={640} height={400} fill="#1F2723" stroke="#2E261C" strokeWidth={16} />
          {chars.map((ch, i) => {
            const k = ramp(frame, [0.8 + i * 0.9, 1.4 + i * 0.9], [0, 1], EASE_OUT);
            return (
              <text key={i} x={1250 + (i % 2) * 260} y={410 + Math.floor(i / 2) * 170} fontSize={140} fontFamily={FONT.serif} fontWeight={700} fill="#DCD8CC" opacity={0.75 * k} style={{ filter: "blur(0.8px)" }}>
                {ch}
              </text>
            );
          })}
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Glow id="ns" x={lamp.x} y={lamp.y} r={900} opacity={0.4 * fl} core={0.04} />
          <line x1={lamp.x} y1={-50} x2={lamp.x} y2={lamp.y - 90} stroke="#1B1611" strokeWidth={3} />
          <MineLamp x={lamp.x} y={lamp.y} scale={0.5} halo={0.9} seed={80} />
          {rimmed(buildFigure({ x: 1130, y: 940, h: 560, pose: "stand", phase: t, facing: 1, hat: "none", garment: "gown", color: "#070707" }), 0.8, 1).el}
          {/* 长凳与学员 */}
          {[0, 1, 2].map((row) => (
            <g key={row}>
              {[0, 1, 2].map((k) => {
                const x = 160 + k * 230 + row * 90;
                const y = 900 + row * 70;
                return <g key={k}>{rimmed(buildFigure({ x, y, h: 400 + row * 40, pose: "sit", phase: t * 0.6 + k + row, facing: 1, hat: (k + row) % 3 === 0 ? "towel" : (k + row) % 3 === 1 ? "cap" : "none", color: "#060606", lean: 6 }), 0.5, 1).el}</g>;
              })}
              <rect x={60 + row * 90} y={900 + row * 70 - 6} width={800} height={14} fill="#120E0A" />
              <rect x={150 + row * 90} y={900 + row * 70 - (400 + row * 40) * 0.36} width={760} height={16} fill="#17120D" />
            </g>
          ))}
        </svg>
        <CoalParticles count={60} seed={801} light={{ x: lamp.x, y: lamp.y, r: 600 }} base={0} size={[0.6, 2]} />
      </Layer>
      <ReenactmentLabel />
    </CinematicCamera>
  );
};

const MutualAidShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const fl = flameFlicker(frame, 81);
  const fire = { x: 960, y: 820 };
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.12, y: 30 }, { t: 5.1, zoom: 1.04, y: 0 }]}>
      <Layer depth={0.5}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 55% at 50% 72%, #3A2A18 0%, #120E0A 55%, #050505 100%)" }} />
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Glow id="ma" x={fire.x} y={fire.y} r={800} opacity={0.55 * fl} color="#E59A4A" core={0.05} />
          <Smoke x={960} y={690} t={t + 2} scale={0.7} opacity={0.35} seed={82} color="#8A8070" wind={0.3} />
          {/* 灶与大锅 */}
          <path d="M 820 880 L 840 760 L 1080 760 L 1100 880 Z" fill="#0C0B0A" />
          <ellipse cx={960} cy={760} rx={150} ry={26} fill="#16120E" />
          <path d="M 880 870 Q 960 820 1040 870 Z" fill="#E08A3A" opacity={0.7 * fl} />
          {rimmed(buildFigure({ x: 760, y: 900, h: 470, pose: "bend", phase: t * 1.3, facing: 1, hat: "towel", color: "#060606" }), 0.9, 1).el}
          {rimmed(buildFigure({ x: 1200, y: 920, h: 500, pose: "stand", phase: t, facing: -1, hat: "cap", garment: "coat", color: "#060606" }), 0.9, -1).el}
          {rimmed(buildFigure({ x: 1380, y: 960, h: 560, pose: "stand", phase: t + 2, facing: -1, hat: "towel", color: "#050505", build: 0.9 }), 0.7, -1).el}
          {rimmed(buildFigure({ x: 520, y: 980, h: 600, pose: "walk", phase: t * 3.2, facing: 1, hat: "cap", tool: "pole", color: "#050505" }), 0.6, 1).el}
          <rect x={-300} y={960} width={2600} height={400} fill="#040404" opacity={0.9} />
        </svg>
        <CoalParticles count={80} seed={811} light={{ x: fire.x, y: fire.y - 100, r: 500 }} drift={[0, -30]} color="#F0A050" base={0} size={[0.8, 2.4]} />
      </Layer>
      <ReenactmentLabel />
    </CinematicCamera>
  );
};

const WinterShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const flakes = useMemo(() => {
    const r = rand(91);
    return Array.from({ length: 260 }, () => ({ x: r() * 2200 - 140, y: r() * 1200, s: 1 + r() * 3.5, v: 40 + r() * 90, ph: r() * 6 }));
  }, []);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.04, x: -30 }, { t: 3, zoom: 1.08, x: 20 }]}>
      <Layer depth={0.15}>
        <OvercastSky tone={0.85} />
        <AbsoluteFill style={{ background: "rgba(150,165,180,0.12)" }} />
      </Layer>
      <Layer depth={0.8}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Headframe x={820} y={880} scale={0.9} color="#14171A" wheelAngle={18} snow={0.85} smoke={0} />
          <rect x={-300} y={876} width={2600} height={400} fill="#B9BEC3" opacity={0.75} />
          <rect x={-300} y={900} width={2600} height={400} fill="#8E949A" opacity={0.6} />
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {flakes.map((f, i) => {
            const y = (f.y + t * f.v) % 1200 - 60;
            const x = f.x + Math.sin(t * 1.3 + f.ph) * 20 - t * 25;
            return <circle key={i} cx={x} cy={y} r={f.s} fill="#E8ECEF" opacity={0.65} />;
          })}
        </svg>
      </Layer>
    </CinematicCamera>
  );
};

const MONTHS: [string, string][] = [["1925", "十月"], ["1925", "十一月"], ["1925", "十二月"], ["1926", "一月"], ["1926", "二月"], ["1926", "三月"]];

const CalendarShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const per = 0.36;
  const idx = Math.min(MONTHS.length - 1, Math.floor(t / per));
  const k = clamp((t - idx * per) / per);
  const page = (i: number, flip: number) => (
    <div
      key={i}
      style={{
        position: "absolute",
        left: 760,
        top: 300,
        width: 400,
        height: 500,
        transformOrigin: "50% 0%",
        transform: `perspective(1400px) rotateX(${flip * 110}deg)`,
        opacity: 1 - flip * 0.9,
        backgroundImage: `url(${staticFile("images/textures/paper.png")})`,
        backgroundSize: "100% 100%",
        fontFamily: FONT.serif,
        color: C.ink,
        textAlign: "center",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ marginTop: 60, fontSize: 52, fontWeight: 700, letterSpacing: "0.2em" }}>{MONTHS[i][0]}</div>
      <div style={{ marginTop: 40, fontSize: 130, fontWeight: 900, color: i === MONTHS.length - 1 ? C.red : C.ink }}>{MONTHS[i][1]}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 50% 50% at 50% 50%, #2A241C 0%, #0A0908 80%)" }}>
      <div style={{ position: "absolute", left: 740, top: 270, width: 440, height: 40, background: "#1A1510", borderRadius: 6 }} />
      {idx + 1 < MONTHS.length && page(idx + 1, 0)}
      {page(idx, idx === MONTHS.length - 1 ? 0 : ramp(frame, [idx * per + per * 0.3, (idx + 1) * per], [0, 1]) * (k > 0 ? 1 : 0))}
    </AbsoluteFill>
  );
};

const ContractShot: React.FC = () => {
  const frame = useCurrentFrame();
  const fl = flameFlicker(frame, 83);
  const a = ramp(frame, [0.3, 1.5], [0, 1], EASE_OUT);
  const ttl = ramp(frame, [0.9, 2.6], [0, 1], EASE_OUT);
  const sign = ramp(frame, [2.6, 3.8], [0, 1], EASE_OUT);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 0.95, y: 10, rot: 1 }, { t: 5.6, zoom: 1.05, y: -10, rot: -0.4 }]}>
      <Layer depth={0.5}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 70% at 60% 40%, #2E271D 0%, #0E0C0A 60%, #050505 100%)" }} />
      </Layer>
      <Layer depth={1}>
        <HistoricalDocument x={960} y={560} w={1160} h={900} rotate={1.5} light={0.5 * fl} shadow={0.9} note="文献内容示意 · 非原件">
          <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", fontSize: 44, fontWeight: 700, letterSpacing: "0.3em", opacity: a, color: "rgba(42,38,34,0.85)" }}>1926年3月2日</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 190, textAlign: "center", fontSize: 70, fontWeight: 900, letterSpacing: "0.06em", opacity: ttl, filter: `blur(${(1 - ttl) * 6}px)` }}>
            《一九二六年工人罢工条款合同》
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontSize: 50, fontWeight: 900, letterSpacing: "0.8em", color: C.red, opacity: sign, transform: `scale(${1.3 - 0.3 * sign})` }}>签订</div>
          <div style={{ opacity: a }}>
            <InkLines x={160} y={420} w={840} rows={8} gap={44} seed={17} opacity={0.22} />
          </div>
        </HistoricalDocument>
      </Layer>
      <LightSweep at={2.4} dur={1.8} color="rgba(214,172,102,0.22)" />
    </CinematicCamera>
  );
};

const ResumptionShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const dawn = ramp(frame, [0, 6]);
  const victory = L(BEATS.persistence.victory) - L(BEATS.persistence.resumption);
  const turn = Math.max(0, t - 1.2);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.12, y: 40 }, { t: 7.5, zoom: 1.02, y: -20 }]}>
      <Layer depth={0.15}>
        <OvercastSky tone={0.8 + 0.3 * dawn} warm={dawn} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 40% at 62% 82%, rgba(240,190,120,${0.55 * dawn}) 0%, rgba(214,172,102,${0.18 * dawn}) 45%, rgba(0,0,0,0) 75%)` }} />
      </Layer>
      <Layer depth={0.6}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Headframe x={700} y={830} scale={0.85} color="#0D0F11" wheelAngle={turn * turn * 12} t={t} smoke={0.6 * clamp(turn / 3)} windowGlow={0.5 * dawn} />
          <rect x={-300} y={826} width={2600} height={500} fill="#0A0B0C" />
        </svg>
      </Layer>
      <Layer depth={1}>
        <CrowdSilhouette seed={620} count={60} motion="still" appear={1} horizon={830} nearY={1250} hNear={420} hFar={70} zRange={[0.05, 0.8]} roles={{ miner: 1 }} colorFar="#3E3328" colorNear="#060607" spreadX={2600} />
      </Layer>
      <LightSweep at={victory} dur={2.0} color="rgba(240,200,140,0.3)" />
      <InfoCaption year="1926年3月6日" text="复工仪式" inAt={0.6} outAt={6.6} x={130} y={140} />
      <IndustrialFog opacity={0.12} speed={8} top={500} height={500} />
    </CinematicCamera>
  );
};
