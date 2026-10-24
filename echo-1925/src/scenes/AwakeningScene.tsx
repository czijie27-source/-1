import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { CinematicCamera, Layer } from "../components/CinematicCamera";
import { CoalParticles } from "../components/CoalParticles";
import { CrowdSilhouette } from "../components/CrowdSilhouette";
import { HistoricalDocument, InkLines } from "../components/HistoricalDocument";
import { CenterLine, DateDisplay, ReenactmentLabel } from "../components/HistoricalTitle";
import { IndustrialFog } from "../components/IndustrialFog";
import { Glow } from "../components/LightBeam";
import { MineLamp } from "../components/MineLamp";
import { SceneFade, Shot } from "../components/SceneTransition";
import { BEATS, sceneById } from "../data/timeline";
import { EASE_OUT, clamp, ramp } from "../lib/anim";
import { C, FONT } from "../theme";
import { OvercastSky } from "./MiningLifeScene";

const S0 = sceneById("awakening").start;
const L = (abs: number) => abs - S0;

/**
 * 场景03｜时代觉醒：风暴传来（00:42—01:10）
 * 镜头：①档案纸上的“1925年5月 五卅运动” → ②经纬网示意图：浪潮从上海传向各地、传到焦作
 * → ③报刊版式示意蒙太奇 → ④工人、学生、市民群像汇聚 → ⑤黑暗中一盏灯：“沉默，不再是唯一的选择。”
 */
export const AwakeningScene: React.FC = () => {
  const b = BEATS.awakening;
  return (
    <SceneFade dur={28} fadeIn={0.8} fadeOut={0.12}>
      <Shot from={0} to={L(b.map) + 0.7} fadeIn={0} fadeOut={0.7} name="五卅日期">
        <DateShot />
      </Shot>
      <Shot from={L(b.map)} to={L(b.newspapers) + 0.6} fadeIn={0.7} fadeOut={0.6} name="示意地图">
        <MapShot />
      </Shot>
      <Shot from={L(b.newspapers)} to={L(b.crowd) + 0.6} fadeIn={0.6} fadeOut={0.6} name="报刊蒙太奇">
        <NewspaperShot />
      </Shot>
      <Shot from={L(b.crowd)} to={L(b.silenceText) + 0.6} fadeIn={0.6} fadeOut={0.7} name="群像汇聚">
        <CrowdShot />
      </Shot>
      <Shot from={L(b.silenceText)} to={28} fadeIn={0.7} fadeOut={0} name="沉默">
        <SilenceShot />
      </Shot>
    </SceneFade>
  );
};

const DateShot: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.12, x: 30, rot: -0.6 }, { t: 6.8, zoom: 1.22, x: -30, rot: 0.4 }]}>
      <Layer depth={0.6}>
        <AbsoluteFill style={{ background: C.bg }} />
        <HistoricalDocument x={960} y={540} w={1500} h={1100} rotate={-3} light={0.15} shadow={0.8}>
          <InkLines x={1300} y={130} w={0} rows={22} gap={56} vertical h={760} seed={3} opacity={0.18} />
        </HistoricalDocument>
        <AbsoluteFill style={{ background: "rgba(10,12,14,0.62)" }} />
      </Layer>
      <Layer depth={1}>
        <DateDisplay year="1925" rest="年5月" caption="五卅运动" inAt={0.5} size={210} y={500} />
      </Layer>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 60% at 50% 48%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.7) 100%)", opacity: 0.9 + 0 * frame }} />
    </CinematicCamera>
  );
};

// 经纬度 → 画面坐标（等距圆柱投影，按 32°N 校正经向比例）
const K = 56;
const proj = (lon: number, lat: number): [number, number] => [960 + (lon - 116.8) * K * 0.85, 560 + (32.2 - lat) * K];
const CITIES: { name: string; lon: number; lat: number; key?: "sh" | "jz" }[] = [
  { name: "上海", lon: 121.47, lat: 31.23, key: "sh" },
  { name: "焦作", lon: 113.24, lat: 35.24, key: "jz" },
  { name: "北京", lon: 116.4, lat: 39.9 },
  { name: "天津", lon: 117.2, lat: 39.13 },
  { name: "南京", lon: 118.8, lat: 32.06 },
  { name: "武汉", lon: 114.3, lat: 30.59 },
  { name: "长沙", lon: 112.94, lat: 28.23 },
  { name: "广州", lon: 113.26, lat: 23.13 },
];

const MapShot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const sh = proj(121.47, 31.23);
  const jz = proj(113.24, 35.24);
  const wave = Math.max(0, t - 1.0) * 260; // 浪潮半径（像素）
  const arc = ramp(frame, [2.4, 5.4], [0, 1], EASE_OUT);
  const ctrl: [number, number] = [(sh[0] + jz[0]) / 2 + 40, Math.min(sh[1], jz[1]) - 220];
  const bez = (k: number): [number, number] => [
    (1 - k) ** 2 * sh[0] + 2 * (1 - k) * k * ctrl[0] + k * k * jz[0],
    (1 - k) ** 2 * sh[1] + 2 * (1 - k) * k * ctrl[1] + k * k * jz[1],
  ];
  const head = bez(arc);
  const steps = 60;
  const path = Array.from({ length: Math.max(2, Math.round(steps * arc)) }, (_, i) => bez((i / steps) * 1)).map((p) => p.join(",")).join(" ");
  const jzLit = ramp(frame, [5.2, 6.2]);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.5, x: 230, y: 30 }, { t: 2.8, zoom: 1.25, x: 120, y: 0 }, { t: 7.2, zoom: 1.12, x: -40, y: -30 }]}>
      <Layer depth={1}>
        <AbsoluteFill style={{ background: "#14181C" }} />
        <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/textures/paper.png")})`, backgroundSize: "cover", opacity: 0.08, mixBlendMode: "screen" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* 经纬网 */}
          {Array.from({ length: 13 }, (_, i) => 104 + i * 2).map((lon) => {
            const [x] = proj(lon, 0);
            return (
              <g key={lon}>
                <line x1={x} x2={x} y1={-300} y2={1400} stroke={C.paper} strokeOpacity={0.09} strokeWidth={1.2} />
                <text x={x + 6} y={proj(0, 41.4)[1]} fill={C.paper} fillOpacity={0.3} fontSize={18} fontFamily={FONT.sans}>{lon}°E</text>
              </g>
            );
          })}
          {Array.from({ length: 12 }, (_, i) => 20 + i * 2).map((lat) => {
            const [, y] = proj(0, lat);
            return (
              <g key={lat}>
                <line x1={-400} x2={2400} y1={y} y2={y} stroke={C.paper} strokeOpacity={0.09} strokeWidth={1.2} />
                <text x={proj(103.6, 0)[0]} y={y - 6} fill={C.paper} fillOpacity={0.3} fontSize={18} fontFamily={FONT.sans}>{lat}°N</text>
              </g>
            );
          })}
          {/* 浪潮：从上海扩散的同心圆 */}
          {[0, 1, 2, 3].map((k) => {
            const r = wave - k * 180;
            if (r <= 0) return null;
            return <circle key={k} cx={sh[0]} cy={sh[1]} r={r} fill="none" stroke={C.red} strokeOpacity={clamp(0.55 - r / 2000)} strokeWidth={2.5} />;
          })}
          {/* 上海 → 焦作 */}
          {arc > 0 && <polyline points={path} fill="none" stroke={C.gold} strokeWidth={3} strokeDasharray="10 8" opacity={0.85} />}
          {arc > 0 && arc < 1 && <Glow id="map-head" x={head[0]} y={head[1]} r={40} opacity={0.9} />}
          {CITIES.map((c) => {
            const [x, y] = proj(c.lon, c.lat);
            const d = Math.hypot(x - sh[0], y - sh[1]);
            const lit = c.key === "sh" ? 1 : c.key === "jz" ? jzLit : clamp((wave - d) / 120);
            const col = c.key === "sh" ? C.red : c.key === "jz" ? C.gold : C.paper;
            const r = c.key ? 9 : 5;
            const pulse = c.key === "sh" ? 1 + 0.3 * Math.sin(t * 4) : 1;
            return (
              <g key={c.name} opacity={0.25 + 0.75 * lit}>
                {c.key && <circle cx={x} cy={y} r={r * 3 * pulse} fill={col} opacity={0.18} />}
                <circle cx={x} cy={y} r={r} fill={col} />
                <text x={x + 16} y={y + 8} fill={col} fontSize={c.key ? 38 : 26} fontFamily={FONT.serif} fontWeight={c.key ? 900 : 700}>{c.name}</text>
              </g>
            );
          })}
        </svg>
      </Layer>
      <div style={{ position: "absolute", right: 80, top: 70, fontFamily: FONT.sans, fontSize: 22, letterSpacing: "0.2em", color: "rgba(232,224,210,0.55)" }}>
        示意图 · 仅表示城市地理方位，不表示具体路线
      </div>
    </CinematicCamera>
  );
};

const Newspaper: React.FC<{ x: number; y: number; w: number; h: number; rot: number; head: string; sub: string; seed: number }> = ({ x, y, w, h, rot, head, sub, seed }) => (
  <HistoricalDocument x={x} y={y} w={w} h={h} rotate={rot} light={0.25} shadow={0.7} note="图文示意">
    <div style={{ position: "absolute", left: w * 0.06, right: w * 0.06, top: h * 0.05, height: 4, background: "rgba(42,38,34,0.7)" }} />
    <div style={{ position: "absolute", left: w * 0.06, right: w * 0.06, top: h * 0.05 + 10, height: 1.5, background: "rgba(42,38,34,0.7)" }} />
    <div style={{ position: "absolute", right: w * 0.08, top: h * 0.1, writingMode: "vertical-rl", fontSize: w * 0.16, fontWeight: 900, letterSpacing: "0.08em", color: "rgba(30,26,22,0.9)" }}>{head}</div>
    <div style={{ position: "absolute", right: w * 0.08 + w * 0.2, top: h * 0.12, writingMode: "vertical-rl", fontSize: w * 0.06, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(30,26,22,0.8)" }}>{sub}</div>
    <InkLines x={w * 0.55} y={h * 0.12} w={0} rows={11} gap={w * 0.045} vertical h={h * 0.75} seed={seed} opacity={0.3} />
  </HistoricalDocument>
);

const NewspaperShot: React.FC = () => {
  const frame = useCurrentFrame();
  const s1 = ramp(frame, [0, 1.6], [0, 1], EASE_OUT);
  const s2 = ramp(frame, [1.4, 3.0], [0, 1], EASE_OUT);
  const s3 = ramp(frame, [2.8, 4.4], [0, 1], EASE_OUT);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.0, x: -60, y: 20 }, { t: 6.4, zoom: 1.14, x: 80, y: -10 }]}>
      <Layer depth={0.4}>
        <AbsoluteFill style={{ background: "#0E1114" }} />
      </Layer>
      <Layer depth={1}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${(1 - s1) * -500}px, 0)`, opacity: s1 }}>
          <Newspaper x={620} y={540} w={720} h={940} rot={-6} head="五卅" sub="反帝爱国 浪潮奔涌" seed={2} />
        </div>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${(1 - s2) * 500}px, ${(1 - s2) * 80}px)`, opacity: s2 }}>
          <Newspaper x={1240} y={560} w={680} h={900} rot={4} head="声援" sub="各地工人 学生 商民" seed={5} />
        </div>
        <div style={{ position: "absolute", inset: 0, transform: `translate(0, ${(1 - s3) * 600}px)`, opacity: s3 }}>
          <Newspaper x={930} y={640} w={640} h={820} rot={-1.5} head="罢工" sub="团结起来" seed={8} />
        </div>
      </Layer>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)" }} />
    </CinematicCamera>
  );
};

const CrowdShot: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = ramp(frame, [0, 4.2], [0, 1]);
  return (
    <CinematicCamera keys={[{ t: 0, zoom: 1.08, y: 40 }, { t: 5.2, zoom: 1.18, y: -10 }]}>
      <Layer depth={0.2}>
        <OvercastSky tone={0.9} warm={0.15} />
      </Layer>
      <Layer depth={0.6}>
        <IndustrialFog opacity={0.25} speed={10} top={360} height={500} />
      </Layer>
      <Layer depth={1}>
        <CrowdSilhouette
          seed={301}
          count={90}
          motion="gather"
          appear={appear}
          horizon={640}
          nearY={1240}
          hNear={560}
          hFar={60}
          zRange={[0.05, 0.92]}
          roles={{ miner: 4, student: 2, merchant: 1, citizen: 2 }}
          colorFar="#5D636A"
          colorNear="#07090B"
          spreadX={2400}
          lampGlow={0.7}
        />
      </Layer>
      <Layer depth={1.3}>
        <IndustrialFog opacity={0.18} speed={18} top={700} height={500} seedOffset={3} />
      </Layer>
      <ReenactmentLabel />
    </CinematicCamera>
  );
};

const SilenceShot: React.FC = () => {
  const frame = useCurrentFrame();
  const lit = ramp(frame, [0.2, 2]);
  return (
    <AbsoluteFill style={{ background: "#050607" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Glow id="sil" x={960} y={330} r={520} opacity={0.35 * lit} core={0.05} />
        <MineLamp x={960} y={330} scale={0.34} lit={lit} halo={0.8} seed={31} />
      </svg>
      <CoalParticles count={90} seed={77} light={{ x: 960, y: 330, r: 520 }} base={0} intensity={lit} />
      <CenterLine text="沉默，不再是唯一的选择。" inAt={0.6} size={70} y={640} />
    </AbsoluteFill>
  );
};
