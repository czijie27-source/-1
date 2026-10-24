import React, { useMemo } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { CinematicCamera, Layer } from "../components/CinematicCamera";
import { CoalParticles } from "../components/CoalParticles";
import { InfoCaption, ReenactmentLabel } from "../components/HistoricalTitle";
import { IndustrialFog } from "../components/IndustrialFog";
import { Glow, LightBeam } from "../components/LightBeam";
import { flameFlicker, MineLamp } from "../components/MineLamp";
import { Headframe, MineCart, Smoke } from "../components/MineSilhouette";
import { SceneFade, Shot } from "../components/SceneTransition";
import { buildFigure, rimmed } from "../components/WorkerSilhouette";
import { BEATS, sceneById } from "../data/timeline";
import { keys, rand, ramp, ridgePath } from "../lib/anim";
import { C } from "../theme";

const S0 = sceneById("mining-life").start;
const L = (abs: number) => abs - S0;

/** 阴沉天空 + 远山：地面工业场景的背景 */
export const OvercastSky: React.FC<{ tone?: number; warm?: number }> = ({ tone = 1, warm = 0 }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/textures/sky.png")})`, backgroundSize: "cover", filter: `grayscale(1) brightness(${0.75 * tone})` }} />
    <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(16,20,25,0.65) 0%, rgba(16,20,25,0.1) 55%, rgba(${120 + 80 * warm},${110 + 50 * warm},${100},${0.25 + 0.2 * warm}) 78%, rgba(16,20,25,0.9) 100%)` }} />
  </AbsoluteFill>
);

/** 煤块堆（细节特写用）：以煤壁纹理填充的不规则碎块，受矿灯照射一侧泛暖光 */
const CoalLumps: React.FC<{ seed: number; y: number; count: number; size: number; light: { x: number; y: number }; amt: number }> = ({ seed, y, count, size, light, amt }) => {
  const lumps = useMemo(() => {
    const r = rand(seed);
    return Array.from({ length: count }, () => {
      const cx = r() * 2400 - 240;
      const s = size * (0.45 + r() * 0.9);
      const n = 7 + Math.floor(r() * 4);
      const pts = Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + r() * 0.35;
        const rr = s * (0.8 + r() * 0.28);
        return [Math.cos(a) * rr, Math.sin(a) * rr * 0.58] as [number, number];
      });
      return { cx, cy: y + r() * size * 1.4 - s * 0.2, pts, s, rot: r() * 360 };
    }).sort((a, b) => a.cy - b.cy);
  }, [seed, count, size, y]);
  const pid = `coalpat-${seed}`;
  return (
    <g>
      <defs>
        <pattern id={pid} patternUnits="userSpaceOnUse" width={600} height={270}>
          <image href={staticFile("images/textures/coal_wall.png")} width={600} height={270} preserveAspectRatio="none" />
        </pattern>
      </defs>
      {lumps.map((l, i) => {
        const dx = light.x - l.cx;
        const dy = light.y - l.cy;
        const lit = Math.max(0, 1 - Math.hypot(dx, dy) / 1200) * amt;
        const ang = Math.atan2(dy, dx);
        const poly = l.pts.map((p) => p.join(",")).join(" ");
        const gid = `lump-${seed}-${i}`;
        const warm = `rgb(${Math.round(30 + 150 * lit)},${Math.round(27 + 110 * lit)},${Math.round(24 + 60 * lit)})`;
        return (
          <g key={i} transform={`translate(${l.cx} ${l.cy})`}>
            <defs>
              <linearGradient id={gid} x1={0.5 - Math.cos(ang) * 0.5} y1={0.5 - Math.sin(ang) * 0.5} x2={0.5 + Math.cos(ang) * 0.5} y2={0.5 + Math.sin(ang) * 0.5}>
                <stop offset="0" stopColor="#030303" />
                <stop offset="0.55" stopColor="#0C0B0A" />
                <stop offset="1" stopColor={warm} />
              </linearGradient>
            </defs>
            <polygon points={poly} fill={`url(#${gid})`} stroke={`url(#${gid})`} strokeWidth={l.s * 0.08} strokeLinejoin="round" />
            <polygon points={poly} fill={`url(#${pid})`} opacity={0.35} style={{ mixBlendMode: "overlay" }} />
          </g>
        );
      })}
    </g>
  );
};

/**
 * 场景02｜时代背景：矿井下的生活（00:15—00:42）
 * 镜头：①阴天下的井架与绞车房（横摇）+ 1898 信息条 → ②巷道中矿车沿轨道行进（跟拍）
 * → ③煤层工作面的矿工剪影（推镜）→ ④矿灯与煤块特写（浅景深横移）→ ⑤地面烟囱 / 井下矿工交叉剪辑
 */
export const MiningLifeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const b = BEATS.miningLife;
  return (
    <SceneFade dur={27} fadeIn={0.8} fadeOut={0.8}>
      {/* ① 井架全景 */}
      <Shot from={0} to={L(b.cart) + 0.6} fadeIn={0} fadeOut={0.8} name="井架全景">
        <SurfaceShot />
      </Shot>
      {/* ② 矿车 */}
      <Shot from={L(b.cart)} to={L(b.workers) + 0.6} fadeIn={0.6} fadeOut={0.7} name="矿车">
        <CartShot />
      </Shot>
      {/* ③ 工作面 */}
      <Shot from={L(b.workers)} to={L(b.details) + 0.6} fadeIn={0.6} fadeOut={0.7} name="工作面">
        <CoalFaceShot />
      </Shot>
      {/* ④ 细节特写 */}
      <Shot from={L(b.details)} to={L(b.crosscut) + 0.5} fadeIn={0.6} fadeOut={0.5} name="细节">
        <DetailShot />
      </Shot>
      {/* ⑤ 交叉剪辑 */}
      <Shot from={L(b.crosscut)} to={L(b.crosscut) + 2.2} fadeIn={0.4} fadeOut={0.35} name="地面烟囱">
        <ChimneyShot />
      </Shot>
      <Shot from={L(b.crosscut) + 2.0} to={27} fadeIn={0.35} fadeOut={0} name="井下仰望">
        <LookUpShot />
      </Shot>
      <InfoCaption year="1898年" text="英国福公司取得焦作煤矿开采权" inAt={L(b.infoCardIn)} outAt={L(b.infoCardOut)} x={130} y={140} />
      <ReenactmentLabel opacity={ramp(frame, [L(b.cart), L(b.cart) + 1]) * (1 - ramp(frame, [26, 27]))} />
    </SceneFade>
  );
};

const SurfaceShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.08, x: -90, y: 10 }, { t: 6.6, zoom: 1.14, x: 70, y: -10 }]}>
      <Layer depth={0.15}>
        <OvercastSky tone={0.95} warm={0.25} />
      </Layer>
      <Layer depth={0.3}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={ridgePath(3, 700, 120)} fill="#4A5056" opacity={0.75} />
          <path d={ridgePath(7, 770, 70)} fill="#353A3F" />
        </svg>
      </Layer>
      <Layer depth={0.5}>
        <IndustrialFog opacity={0.32} speed={10} top={420} height={500} />
      </Layer>
      <Layer depth={0.7}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Headframe x={1460} y={870} scale={0.42} color="#1E2226" wheelAngle={t * 40 + 30} t={t + 3} smoke={0.5} windowGlow={0.1} />
          <rect x={-300} y={866} width={2600} height={300} fill="#15181B" />
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Headframe x={720} y={930} scale={1.02} color="#0B0D0F" wheelAngle={-t * 55} t={t} smoke={0.75} windowGlow={0.2} />
          <path d="M -300 925 L 2300 925 L 2300 1200 L -300 1200 Z" fill="#08090A" />
          {/* 地面轨道与远去的矿车 */}
          <line x1={-300} y1={985} x2={2300} y2={985} stroke="#2A2E32" strokeWidth={5} />
          <line x1={-300} y1={1010} x2={2300} y2={1010} stroke="#2A2E32" strokeWidth={6} />
          {[0, 1, 2].map((i) => (
            <MineCart key={i} x={1180 + i * 250 + t * 30} y={1000} scale={0.9} color="#0D0F11" wheel={t * 120} />
          ))}
          {[0, 1, 2, 3].map((i) => buildFigure({ x: 260 + i * 120 + t * (34 + i * 3), y: 985, h: 150 - i * 6, pose: "walk", phase: t * 5 + i * 1.7, hat: i % 2 ? "towel" : "cap", tool: i === 1 ? "pick" : i === 3 ? "lamp" : "none", color: "#07080A" }, i).el)}
        </svg>
      </Layer>
      <Layer depth={1.25}>
        <IndustrialFog opacity={0.22} speed={22} top={600} height={600} seedOffset={2} />
      </Layer>
    </CinematicCamera>
  );
};

const CartShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const cartX = 700 + t * 140;
  const fl = flameFlicker(frame, 3);
  const postSpacing = 560;
  const lampsX = [-40, 1080, 2200];
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.0, x: -200 }, { t: 6.6, zoom: 1.06, x: 660 }]}>
      <Layer depth={0.55}>
        <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/textures/coal_wall.png")})`, backgroundSize: "1800px 900px", backgroundPosition: "0 60px", filter: "brightness(0.8)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.9) 100%)" }} />
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* 顶梁与立柱 */}
          <rect x={-800} y={40} width={4200} height={80} fill="#120E0A" />
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i}>
              <rect x={-500 + i * postSpacing} y={100} width={62} height={840} fill="#1A140E" />
              <rect x={-500 + i * postSpacing + 48} y={100} width={12} height={840} fill={C.gold} opacity={0.12} />
            </g>
          ))}
          {/* 灯下的暖光 */}
          {lampsX.map((lx, i) => (
            <Glow key={`g${i}`} id={`cg${i}`} x={lx} y={330} r={760} opacity={0.42 * fl} core={0.04} />
          ))}
          {/* 地面与轨道 */}
          <rect x={-800} y={940} width={4200} height={300} fill="#0D0B09" />
          {Array.from({ length: 60 }, (_, i) => (
            <rect key={i} x={-700 + i * 80} y={948} width={52} height={16} fill="#211A13" />
          ))}
          <rect x={-800} y={936} width={4200} height={9} fill="#4A453E" />
          <rect x={-800} y={936} width={4200} height={2} fill={C.gold} opacity={0.45} />
          {lampsX.map((lx, i) => (
            <MineLamp key={i} x={lx} y={330} scale={0.26} lit={1} halo={0.9} seed={10 + i} />
          ))}
          {/* 矿车与推车矿工 */}
          <MineCart x={cartX + 150} y={940} scale={1.5} wheel={t * 200} lightAmt={0.6 * fl} color="#1B1E21" />
          <MineCart x={cartX - 230} y={940} scale={1.5} wheel={t * 200} lightAmt={0.5 * fl} color="#1B1E21" />
          {rimmed(buildFigure({ x: cartX - 560, y: 940, h: 440, pose: "push", phase: t * 3.6, facing: 1, hat: "towel", color: "#08090A", build: 1.05 }), 0.9, -1).el}
        </svg>
        <CoalParticles count={140} seed={21} light={{ x: 1080, y: 360, r: 900 }} base={0.05} drift={[-12, -2]} />
      </Layer>
      <Layer depth={1.7} blur={12}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {Array.from({ length: 4 }, (_, i) => (
            <rect key={i} x={300 + i * 1500} y={-100} width={120} height={1300} fill="#050403" />
          ))}
        </svg>
      </Layer>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 75% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)" }} />
    </CinematicCamera>
  );
};

const CoalFaceShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const fl = flameFlicker(frame, 5);
  const lamp1 = { x: 620, y: 360 };
  const lamp2 = { x: 1420, y: 330 };
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.0, x: -40, y: 20 }, { t: 6.4, zoom: 1.18, x: 40, y: 0 }]} handheld={0.6}>
      <Layer depth={0.6}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <radialGradient id="cf-g">
              <stop offset="0" stopColor="#fff" stopOpacity={1} />
              <stop offset="0.5" stopColor="#fff" stopOpacity={0.45} />
              <stop offset="1" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
            <mask id="cf-light" maskUnits="userSpaceOnUse" x={-500} y={-500} width={3000} height={2200}>
              <rect x={-500} y={-500} width={3000} height={2200} fill="#000" />
              <circle cx={lamp1.x} cy={lamp1.y} r={900 * fl} fill="url(#cf-g)" />
              <circle cx={lamp2.x} cy={lamp2.y} r={760 * fl} fill="url(#cf-g)" />
            </mask>
          </defs>
          <image href={staticFile("images/textures/coal_wall.png")} x={-300} y={-60} width={2520} height={1200} preserveAspectRatio="none" mask="url(#cf-light)" />
        </svg>
      </Layer>
      <Layer depth={0.8} blur={2.5}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {buildFigure({ x: 1500, y: 860, h: 300, pose: "bend", phase: t * 2.4 + 1, facing: -1, hat: "towel", tool: "shovel", color: "#0A0B0C" }).el}
          <MineLamp x={lamp2.x} y={lamp2.y} scale={0.24} halo={0.9} seed={7} />
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <rect x={-500} y={900} width={3000} height={400} fill="#060606" />
          {rimmed(buildFigure({ x: 900, y: 940, h: 520, pose: "swing", phase: t * 2.2, facing: -1, hat: "towel", tool: "pick", color: "#050607" }), 0.8, 1).el}
          <MineLamp x={lamp1.x} y={lamp1.y} scale={0.3} halo={1} seed={6} />
          <LightBeam id="cf" x={lamp1.x} y={lamp1.y} angle={150} length={900} spread={60} intensity={0.12 * fl} />
        </svg>
        <CoalParticles count={160} seed={33} light={{ x: lamp1.x, y: lamp1.y, r: 700 }} drift={[4, 10]} base={0.02} />
      </Layer>
      <Layer depth={1.4} blur={14}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {buildFigure({ x: 250, y: 1250, h: 900, pose: "stand", phase: t, facing: 1, hat: "towel", color: "#020203" }).el}
        </svg>
      </Layer>
      <IndustrialFog opacity={0.15} speed={6} />
    </CinematicCamera>
  );
};

const DetailShot: React.FC = () => {
  const frame = useCurrentFrame();
  const fl = flameFlicker(frame, 8);
  const lamp = { x: 1150, y: 600 };
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.1, x: 120, y: 0 }, { t: 4.8, zoom: 1.22, x: -60, y: 0 }]}>
      <Layer depth={0.5} blur={6}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <rect x={-500} y={-500} width={3000} height={2200} fill="#040404" />
          <ellipse cx={1150} cy={760} rx={1300} ry={240} fill="#1A1611" opacity={0.6} />
          <CoalLumps seed={81} y={640} count={60} size={46} light={lamp} amt={0.5 * fl} />
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Glow id="dt" x={lamp.x} y={lamp.y} r={900} opacity={0.45 * fl} core={0.08} />
          <MineLamp x={lamp.x} y={lamp.y} scale={1.25} halo={0.8} seed={8} />
          <CoalLumps seed={82} y={760} count={46} size={110} light={lamp} amt={1.0 * fl} />
        </svg>
        <CoalParticles count={90} seed={44} light={{ x: lamp.x, y: lamp.y, r: 600 }} base={0} size={[1, 4]} />
      </Layer>
      <Layer depth={1.5} blur={18}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <CoalLumps seed={83} y={1040} count={10} size={220} light={lamp} amt={0.6} />
        </svg>
      </Layer>
    </CinematicCamera>
  );
};

const ChimneyShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.04, x: 0, y: 40 }, { t: 2.4, zoom: 1.1, x: 30, y: -30 }]}>
      <Layer depth={0.2}>
        <OvercastSky tone={1.05} warm={0.2} />
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Smoke x={760} y={330} t={t + 4} scale={1.5} opacity={0.95} seed={4} color="#A3A8AD" wind={1.4} />
          <Smoke x={1250} y={420} t={t + 1} scale={1.1} opacity={0.75} seed={5} color="#8E9398" wind={1.4} />
          <path d="M 700 1200 L 718 330 L 802 330 L 820 1200 Z" fill="#0C0E10" />
          <rect x={706} y={306} width={108} height={30} fill="#0C0E10" />
          {Array.from({ length: 16 }, (_, i) => (
            <line key={i} x1={712} x2={812} y1={360 + i * 52} y2={360 + i * 52} stroke="#1F2327" strokeWidth={2} />
          ))}
          <path d="M 1210 1200 L 1222 420 L 1278 420 L 1290 1200 Z" fill="#111417" />
          <path d="M 880 1200 L 880 700 L 1240 540 L 1600 700 L 1600 1200 Z" fill="#0E1012" />
          {[960, 1170, 1380].map((x) => (
            <g key={x}>
              <path d={`M ${x} 1010 L ${x} 820 Q ${x + 70} 745 ${x + 140} 820 L ${x + 140} 1010 Z`} fill={C.gold} opacity={0.42 + 0.06 * Math.sin(t * 3 + x)} />
              <line x1={x + 70} x2={x + 70} y1={770} y2={1010} stroke="#0E1012" strokeWidth={6} />
              <line x1={x} x2={x + 140} y1={900} y2={900} stroke="#0E1012" strokeWidth={6} />
            </g>
          ))}
          <rect x={-300} y={1010} width={2600} height={200} fill="#07080A" />
        </svg>
      </Layer>
      <Layer depth={1.3}>
        <IndustrialFog opacity={0.3} speed={30} top={560} height={600} />
      </Layer>
    </CinematicCamera>
  );
};

const LookUpShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const fl = flameFlicker(frame, 9);
  const swell = keys(frame, [[0, 0.55], [2.2, 0.75], [3.6, 1.15], [4.6, 1.3]]);
  const lamp = { x: 1260, y: 430 };
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.05, x: 0, y: 0 }, { t: 5, zoom: 1.25, x: 60, y: -20 }]}>
      <Layer depth={0.6}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <radialGradient id="lu-g">
              <stop offset="0" stopColor="#fff" stopOpacity={1} />
              <stop offset="1" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
            <mask id="lu-l" maskUnits="userSpaceOnUse" x={-500} y={-500} width={3000} height={2200}>
              <rect x={-500} y={-500} width={3000} height={2200} fill="#000" />
              <circle cx={lamp.x} cy={lamp.y} r={800 * swell * fl} fill="url(#lu-g)" />
            </mask>
          </defs>
          <image href={staticFile("images/textures/coal_wall.png")} x={-300} y={-60} width={2520} height={1200} preserveAspectRatio="none" mask="url(#lu-l)" opacity={0.8} />
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Glow id="lu" x={lamp.x} y={lamp.y} r={1000 * swell} opacity={0.5 * fl} core={0.05} />
          {rimmed(buildFigure({ x: 1020, y: 1130, h: 660, pose: "stand", phase: t, facing: 1, hat: "cap", tool: "none", color: "#040506", lean: -8, garment: "coat" }), 1, 1).el}
          <MineLamp x={lamp.x} y={lamp.y} scale={0.42} halo={swell} seed={9} />
        </svg>
        <CoalParticles count={160} seed={55} light={{ x: lamp.x, y: lamp.y, r: 800 * swell }} base={0} drift={[2, -14]} />
      </Layer>
    </CinematicCamera>
  );
};
