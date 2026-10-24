import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CinematicCamera, Layer } from "../components/CinematicCamera";
import { CrowdSilhouette } from "../components/CrowdSilhouette";
import { HistoricalDocument, InkLines } from "../components/HistoricalDocument";
import { ReenactmentLabel } from "../components/HistoricalTitle";
import { IndustrialFog } from "../components/IndustrialFog";
import { Glow } from "../components/LightBeam";
import { flameFlicker, MineLamp } from "../components/MineLamp";
import { Headframe } from "../components/MineSilhouette";
import { LightSweep, SceneFade, Shot } from "../components/SceneTransition";
import { BEATS, sceneById } from "../data/timeline";
import { EASE_OUT, clamp, lerp, rand, ramp, ridgePath } from "../lib/anim";
import { C, FONT } from "../theme";
import { OvercastSky } from "./MiningLifeScene";

const S0 = sceneById("solidarity").start;
const L = (abs: number) => abs - S0;

/**
 * 场景05｜团结抗争：从矿井到街头（01:42—02:14）
 * 镜头：①街道纵深中，工人、学生、商人汇入队伍 → ②横向跟拍延绵的行进队列（多层视差）
 * → ③《焦作煤矿工人罢工宣言》文献展示（内容示意，非原件）→ ④高处俯瞰：一条条灯火之河汇聚
 */
export const SolidarityScene: React.FC = () => {
  const b = BEATS.solidarity;
  return (
    <SceneFade dur={32} fadeIn={0.8} fadeOut={0.8}>
      <Shot from={0} to={L(b.procession) + 0.6} fadeIn={0} fadeOut={0.6} name="街道纵深">
        <StreetShot />
      </Shot>
      <Shot from={L(b.procession)} to={L(b.document) + 0.6} fadeIn={0.6} fadeOut={0.6} name="横向队列">
        <ProcessionShot />
      </Shot>
      <Shot from={L(b.document)} to={L(b.river) + 0.7} fadeIn={0.6} fadeOut={0.7} name="罢工宣言">
        <ManifestoShot />
      </Shot>
      <Shot from={L(b.river)} to={32} fadeIn={0.7} fadeOut={0} name="灯火之河">
        <RiverShot />
      </Shot>
    </SceneFade>
  );
};

/** 1920 年代街道两侧的二层铺面（坡屋顶出檐、木格窗、竖向招牌），按透视排列 */
const StreetSide: React.FC<{ side: -1 | 1; vx: number; vy: number; seed: number; groundNear: number; color: string }> = ({ side, vx, vy, seed, groundNear, color }) => {
  const blocks = useMemo(() => {
    const r = rand(seed);
    let d = 0.15;
    const out: { d0: number; d1: number; h: number; win: number; sign: boolean }[] = [];
    while (d < 9) {
      const len = 0.5 + r() * 0.9;
      out.push({ d0: d, d1: d + len, h: 0.75 + r() * 0.45, win: 2 + Math.floor(r() * 2), sign: r() > 0.4 });
      d += len + 0.02;
    }
    return out.reverse();
  }, [seed]);
  const P = (dist: number) => 1 / (1 + dist);
  const X = (dist: number) => vx + side * 1500 * P(dist);
  const G = (dist: number) => vy + (groundNear - vy) * P(dist);
  const Hh = (dist: number, h: number) => 900 * h * P(dist);
  return (
    <g>
      {blocks.map((bk, i) => {
        const x0 = X(bk.d0);
        const x1 = X(bk.d1);
        const g0 = G(bk.d0);
        const g1 = G(bk.d1);
        const t0 = g0 - Hh(bk.d0, bk.h);
        const t1 = g1 - Hh(bk.d1, bk.h);
        const eave = 60 * P(bk.d0);
        const shade = 0.6 + 0.4 * (i % 2);
        const pts = (k: number, v: number): [number, number] => [lerp(x0, x1, k), lerp(lerp(g0, t0, v), lerp(g1, t1, v), k)];
        return (
          <g key={i}>
            <path d={`M ${x0} ${g0} L ${x0} ${t0} L ${x1} ${t1} L ${x1} ${g1} Z`} fill={color} opacity={shade} />
            {/* 出檐 */}
            <path d={`M ${x0 + side * eave} ${t0 - eave * 0.2} L ${x1 + side * eave * 0.3} ${t1 - eave * 0.06} L ${x1} ${t1 + eave * 0.2} L ${x0} ${t0 + eave * 0.5} Z`} fill="#050607" />
            {/* 二层窗 */}
            {Array.from({ length: bk.win }, (_, w) => {
              const k0 = (w + 0.25) / bk.win;
              const k1 = (w + 0.75) / bk.win;
              const a = pts(k0, 0.82);
              const b2 = pts(k1, 0.82);
              const c2 = pts(k1, 0.6);
              const d2 = pts(k0, 0.6);
              return <path key={w} d={`M ${a[0]} ${a[1]} L ${b2[0]} ${b2[1]} L ${c2[0]} ${c2[1]} L ${d2[0]} ${d2[1]} Z`} fill="#2A2C2E" opacity={0.7} />;
            })}
            {/* 一层铺面门洞 */}
            {(() => {
              const a = pts(0.1, 0.42);
              const b2 = pts(0.9, 0.42);
              const c2 = pts(0.9, 0);
              const d2 = pts(0.1, 0);
              return <path d={`M ${a[0]} ${a[1]} L ${b2[0]} ${b2[1]} L ${c2[0]} ${c2[1]} L ${d2[0]} ${d2[1]} Z`} fill="#060708" />;
            })()}
            {bk.sign && (() => {
              const a = pts(0.5, 0.9);
              const w = 26 * P(bk.d0);
              return <rect x={a[0] - w / 2} y={a[1]} width={w} height={Hh(bk.d0, 0.4)} fill="#1D1F21" stroke="#3A3C3E" strokeWidth={2 * P(bk.d0)} />;
            })()}
          </g>
        );
      })}
    </g>
  );
};

const StreetShot: React.FC = () => {
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.0, y: 0 }, { t: 7, zoom: 1.1, y: -10 }]} handheld={0.4}>
      <Layer depth={0.2}>
        <OvercastSky tone={0.95} warm={0.2} />
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d="M -400 1300 L 2320 1300 L 1000 540 L 920 540 Z" fill="#15171A" />
          <StreetSide side={-1} vx={960} vy={540} seed={51} groundNear={1300} color="#121416" />
          <StreetSide side={1} vx={960} vy={540} seed={52} groundNear={1300} color="#121416" />
        </svg>
        <IndustrialFog opacity={0.3} speed={6} top={300} height={500} />
        <CrowdSilhouette
          seed={501}
          count={80}
          motion="toward"
          speed={0.045}
          horizon={540}
          vanishX={960}
          nearY={1420}
          hNear={760}
          hFar={40}
          spreadX={1500}
          roles={{ miner: 4, student: 2, merchant: 1.2, citizen: 1.5 }}
          colorFar="#575D63"
          colorNear="#06070A"
          lampGlow={0.6}
        />
      </Layer>
      <ReenactmentLabel />
    </CinematicCamera>
  );
};

const ProcessionShot: React.FC = () => (
  <CinematicCamera keys={[{ t: 0, zoom: 1.05, x: -40 }, { t: 5.4, zoom: 1.08, x: 60 }]}>
    <Layer depth={0.15}>
      <OvercastSky tone={0.9} warm={0.3} />
    </Layer>
    <Layer depth={0.35}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={ridgePath(21, 640, 90)} fill="#3E4449" />
        {/* 远处城镇屋脊 */}
        {Array.from({ length: 16 }, (_, i) => {
          const x = -200 + i * 150;
          const h = 60 + ((i * 37) % 50);
          return <path key={i} d={`M ${x} 700 L ${x} ${700 - h} Q ${x + 70} ${690 - h - 30} ${x + 140} ${700 - h} L ${x + 140} 700 Z`} fill="#2B3035" />;
        })}
        <Headframe x={1550} y={700} scale={0.32} color="#2B3035" engineHouse={false} chimney={false} />
        <rect x={-300} y={698} width={2600} height={500} fill="#24282C" />
      </svg>
    </Layer>
    <Layer depth={0.5}>
      <CrowdSilhouette seed={511} count={44} motion="lateral" speed={34} horizon={700} nearY={760} hNear={120} hFar={110} zRange={[0.5, 0.6]} colorFar="#3A3F44" colorNear="#30353A" roles={{ miner: 3, student: 1, citizen: 1 }} />
    </Layer>
    <Layer depth={0.75}>
      <IndustrialFog opacity={0.22} speed={10} top={520} height={400} />
      <CrowdSilhouette seed={512} count={34} motion="lateral" speed={70} horizon={700} nearY={900} hNear={260} hFar={240} zRange={[0.6, 0.7]} colorFar="#1E2226" colorNear="#1A1D21" roles={{ miner: 3, student: 1.5, merchant: 0.7, citizen: 1 }} />
    </Layer>
    <Layer depth={1}>
      <CrowdSilhouette seed={513} count={16} motion="lateral" speed={130} horizon={700} nearY={1180} hNear={620} hFar={600} zRange={[0.8, 0.9]} colorFar="#07080A" colorNear="#060709" roles={{ miner: 3, student: 1, citizen: 1 }} lampGlow={0.8} />
    </Layer>
    <ReenactmentLabel />
  </CinematicCamera>
);

const ManifestoShot: React.FC = () => {
  const frame = useCurrentFrame();
  const fl = flameFlicker(frame, 70);
  const a = ramp(frame, [0.6, 2.0], [0, 1], EASE_OUT);
  const titleIn = ramp(frame, [1.4, 3.2], [0, 1], EASE_OUT);
  const issuer = ramp(frame, [3.0, 4.6]);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 0.94, x: 40, y: 10, rot: -1 }, { t: 9.8, zoom: 1.06, x: -20, y: -10, rot: 0.5 }]}>
      <Layer depth={0.5}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 70% at 40% 40%, #2B241B 0%, #0E0C0A 60%, #050505 100%)" }} />
      </Layer>
      <Layer depth={1}>
        <HistoricalDocument x={1000} y={520} w={880} h={940} rotate={-2.5} light={0.55 * fl} shadow={0.9} note="文献内容示意 · 非原件">
          <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontSize: 40, fontWeight: 700, letterSpacing: "0.3em", opacity: a, color: "rgba(42,38,34,0.85)" }}>1925年7月12日</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 190, textAlign: "center", fontSize: 64, fontWeight: 900, letterSpacing: "0.12em", opacity: titleIn, filter: `blur(${(1 - titleIn) * 6}px)` }}>
            《焦作煤矿工人罢工宣言》
          </div>
          <div style={{ position: "absolute", left: 140, right: 140, top: 322, height: 3, background: C.red, opacity: 0.8 * titleIn, transform: `scaleX(${titleIn})` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontSize: 34, fontWeight: 700, letterSpacing: "0.5em", opacity: issuer, color: "rgba(42,38,34,0.8)" }}>焦作煤矿工会　发表</div>
          <div style={{ opacity: issuer }}>
            <InkLines x={130} y={460} w={620} rows={9} gap={42} seed={12} opacity={0.22} />
          </div>
        </HistoricalDocument>
      </Layer>
      <Layer depth={1.4} blur={8}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Glow id="mf" x={250} y={260} r={700} opacity={0.4 * fl} core={0.04} />
          <MineLamp x={250} y={260} scale={0.9} halo={0.7} seed={70} />
        </svg>
      </Layer>
      <LightSweep at={1.2} dur={2.2} color="rgba(214,172,102,0.25)" />
      <div style={{ position: "absolute", left: 90, top: 120, fontFamily: FONT.serif, color: C.paper, opacity: ramp(frame, [0.4, 1.4]) * (1 - ramp(frame, [8.6, 9.4])) }}>
        <div style={{ fontSize: 30, letterSpacing: "0.3em", color: C.gold }}>历史文献</div>
      </div>
    </CinematicCamera>
  );
};

const RiverShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const center: [number, number] = [980, 610];
  const roads = useMemo(() => {
    const starts: [number, number][] = [[-200, 1150], [300, 1250], [1500, 1260], [2150, 1080], [-250, 760], [2200, 700], [600, 1300]];
    return starts.map((s, i) => {
      const c: [number, number] = [lerp(s[0], center[0], 0.5) + (i % 2 ? 160 : -160), lerp(s[1], center[1], 0.5) + 60];
      return { s, c };
    });
  }, []);
  const pt = (r: { s: [number, number]; c: [number, number] }, k: number): [number, number] => [
    (1 - k) ** 2 * r.s[0] + 2 * (1 - k) * k * r.c[0] + k * k * center[0],
    (1 - k) ** 2 * r.s[1] + 2 * (1 - k) * k * r.c[1] + k * k * center[1],
  ];
  const grow = ramp(frame, [0, 9]);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.3, y: 120 }, { t: 11.5, zoom: 1.0, y: -10 }]}>
      <Layer depth={0.2}>
        <OvercastSky tone={0.55} warm={0.5} />
      </Layer>
      <Layer depth={0.45}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={ridgePath(31, 470, 110)} fill="#262A2E" />
          <Headframe x={1420} y={470} scale={0.3} color="#16191C" chimney engineHouse wheelAngle={0} />
          <rect x={-400} y={466} width={2800} height={900} fill="#0D0F11" />
        </svg>
      </Layer>
      <Layer depth={1}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <radialGradient id="rv-dot">
              <stop offset="0" stopColor="#FFF0CC" />
              <stop offset="0.3" stopColor={C.gold} stopOpacity={0.7} />
              <stop offset="1" stopColor={C.gold} stopOpacity={0} />
            </radialGradient>
          </defs>
          {roads.map((r, i) => (
            <path key={i} d={`M ${r.s[0]} ${r.s[1]} Q ${r.c[0]} ${r.c[1]} ${center[0]} ${center[1]}`} stroke="#1C1F22" strokeWidth={46} fill="none" strokeLinecap="round" />
          ))}
          <ellipse cx={center[0]} cy={center[1]} rx={260} ry={90} fill="#1C1F22" />
          <g style={{ mixBlendMode: "screen" }}>
            <Glow id="rv-c" x={center[0]} y={center[1]} r={300 + 500 * grow} opacity={0.25 + 0.5 * grow} core={0.05} />
            {roads.map((r, i) =>
              Array.from({ length: 30 }, (_, j) => {
                const rr = rand(i * 100 + j);
                const jk = rr() * 0.03;
                const lane = (rr() - 0.5) * 34;
                const speed = 0.035 + rr() * 0.02;
                if (rr() < 0.22) return null;
                const k = (((j / 30 + jk + t * speed + i * 0.13) % 1) + 1) % 1;
                const vis = clamp((grow * 1.3 - (1 - k)) * 3);
                const [x0, y0] = pt(r, k);
                const x = x0 + lane * (1 - k);
                const y = y0 + lane * 0.3 * (1 - k);
                const sz = lerp(12, 4, k) * (0.7 + rr() * 0.6);
                return <circle key={`${i}-${j}`} cx={x} cy={y} r={sz * 2.4} fill="url(#rv-dot)" opacity={vis * flameFlicker(frame, i * 40 + j)} />;
              }),
            )}
          </g>
        </svg>
      </Layer>
      <Layer depth={1.3}>
        <IndustrialFog opacity={0.2} speed={9} top={350} height={600} />
      </Layer>
      <ReenactmentLabel />
    </CinematicCamera>
  );
};
