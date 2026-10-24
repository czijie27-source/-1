import React from "react";
import { rand } from "../lib/anim";

/**
 * 1920 年代煤矿工业构件：钢结构井架（天轮可转动）、绞车房、烟囱与烟雾、矿车、飞轮与连杆、锅炉、巷道支架。
 * 均为 SVG 片段（需放在 <svg> 内），按真实工业结构比例绘制。
 */

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export const Smoke: React.FC<{ x: number; y: number; t: number; scale?: number; seed?: number; opacity?: number; color?: string; wind?: number }> = ({
  x, y, t, scale = 1, seed = 1, opacity = 0.5, color = "#6E747A", wind = 1,
}) => {
  const n = 16;
  const P = 9;
  const r = rand(seed);
  const ps = range(n).map((i) => ({ off: (i / n) * P, jx: r() * 40 - 20, rs: 0.7 + r() * 0.6 }));
  const id = `smoke-${seed}`;
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={0.55} />
          <stop offset="0.6" stopColor={color} stopOpacity={0.2} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      {ps.map((p, i) => {
        const age = ((t + p.off) % P) / P;
        const px = x + (age * 260 * wind + Math.sin(age * 5 + i) * 18 + p.jx * age) * scale;
        const py = y - age * 420 * scale;
        const rad = (18 + age * 150) * p.rs * scale;
        return <circle key={i} cx={px} cy={py} r={rad} fill={`url(#${id})`} opacity={Math.sin(Math.PI * Math.min(1, age * 1.15)) * 0.9} />;
      })}
    </g>
  );
};

export const Headframe: React.FC<{
  x: number;
  y: number;
  scale?: number;
  color?: string;
  wheelAngle?: number;
  windowGlow?: number;
  engineHouse?: boolean;
  chimney?: boolean;
  t?: number;
  smoke?: number;
  snow?: number; // 积雪（0..1）
}> = ({ x, y, scale = 1, color = "#0C0E10", wheelAngle = 0, windowGlow = 0, engineHouse = true, chimney = true, t = 0, smoke = 0, snow = 0 }) => {
  const girts = range(8).map((i) => -i * 70);
  const legX = (yy: number) => 70 - (45 * -yy) / 560;
  const st = { stroke: color, fill: "none" } as const;
  const snowC = "#C9CDD1";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {chimney && smoke > 0 && <Smoke x={835} y={-520} t={t} scale={0.9} opacity={smoke} seed={11} />}
      {/* 主塔架：四柱桁架 */}
      <line x1={-70} y1={0} x2={-25} y2={-560} {...st} strokeWidth={12} />
      <line x1={70} y1={0} x2={25} y2={-560} {...st} strokeWidth={12} />
      {girts.map((g, i) => (
        <g key={i}>
          <line x1={-legX(g)} y1={g} x2={legX(g)} y2={g} {...st} strokeWidth={5} />
          {i < 7 && (
            <>
              <line x1={-legX(g)} y1={g} x2={legX(g - 70)} y2={g - 70} {...st} strokeWidth={3} />
              <line x1={legX(g)} y1={g} x2={-legX(g - 70)} y2={g - 70} {...st} strokeWidth={3} />
            </>
          )}
        </g>
      ))}
      {/* 斜撑（背架），朝向绞车房 */}
      <line x1={22} y1={-545} x2={330} y2={0} {...st} strokeWidth={13} />
      <line x1={10} y1={-480} x2={260} y2={0} {...st} strokeWidth={7} />
      {range(7).map((i) => {
        const k0 = i / 7;
        const k1 = (i + 1) / 7;
        const a = [22 + (330 - 22) * k0, -545 + 545 * k0];
        const b = [10 + (260 - 10) * k1, -480 + 480 * k1];
        return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} {...st} strokeWidth={3} />;
      })}
      {/* 顶部平台与栏杆 */}
      <rect x={-48} y={-572} width={96} height={14} fill={color} />
      {range(7).map((i) => (
        <line key={i} x1={-46 + i * 15} y1={-572} x2={-46 + i * 15} y2={-596} {...st} strokeWidth={2} />
      ))}
      <line x1={-48} y1={-596} x2={48} y2={-596} {...st} strokeWidth={3} />
      {/* 天轮 */}
      <g transform={`translate(0 -612) rotate(${wheelAngle})`}>
        <circle r={64} {...st} strokeWidth={8} />
        <circle r={10} fill={color} />
        {range(8).map((i) => (
          <line key={i} x1={0} y1={0} x2={Math.cos((i * Math.PI) / 4) * 62} y2={Math.sin((i * Math.PI) / 4) * 62} {...st} strokeWidth={3.5} />
        ))}
      </g>
      {/* 钢丝绳：一端入井，一端通向绞车房 */}
      <line x1={-62} y1={-612} x2={-62} y2={-140} {...st} strokeWidth={2} />
      {engineHouse && <line x1={58} y1={-640} x2={520} y2={-150} {...st} strokeWidth={2} />}
      {/* 罐笼 */}
      <rect x={-84} y={-140} width={44} height={60} fill={color} />
      {/* 井口房 */}
      <path d="M -140 0 L -140 -70 L -40 -110 L 60 -70 L 60 0 Z" fill={color} />
      {engineHouse && (
        <g>
          <path d="M 400 0 L 400 -210 L 580 -300 L 760 -210 L 760 0 Z" fill={color} />
          {[440, 540, 640].map((wx, i) => (
            <g key={i}>
              <path d={`M ${wx} -40 L ${wx} -140 Q ${wx + 35} -180 ${wx + 70} -140 L ${wx + 70} -40 Z`} fill={windowGlow > 0 ? "#D6AC66" : "#1A1E22"} opacity={windowGlow > 0 ? 0.25 + 0.6 * windowGlow : 0.9} />
              <line x1={wx + 35} y1={-40} x2={wx + 35} y2={-160} stroke={color} strokeWidth={4} />
              <line x1={wx} y1={-95} x2={wx + 70} y2={-95} stroke={color} strokeWidth={4} />
            </g>
          ))}
          {snow > 0 && <path d="M 392 -212 L 580 -306 L 768 -212 L 760 -204 L 580 -292 L 400 -204 Z" fill={snowC} opacity={snow} />}
        </g>
      )}
      {chimney && (
        <g>
          <path d="M 810 0 L 822 -520 L 852 -520 L 864 0 Z" fill={color} />
          <rect x={816} y={-536} width={42} height={16} fill={color} />
          {[-120, -260, -400].map((yy) => (
            <rect key={yy} x={812 + (-yy / 520) * 10} y={yy} width={50 - (-yy / 520) * 20} height={6} fill="#000" opacity={0.25} />
          ))}
        </g>
      )}
      {snow > 0 && (
        <g fill={snowC} opacity={snow}>
          <path d="M -150 -66 L -40 -114 L 70 -66 L 60 -60 L -40 -102 L -140 -60 Z" />
          <rect x={-50} y={-576} width={100} height={5} />
          {girts.slice(1).map((g, i) => (
            <rect key={i} x={-legX(g)} y={g - 3} width={legX(g) * 2} height={3} />
          ))}
        </g>
      )}
    </g>
  );
};

export const MineCart: React.FC<{ x: number; y: number; scale?: number; color?: string; wheel?: number; coal?: boolean; light?: string; lightAmt?: number }> = ({
  x, y, scale = 1, color = "#15181B", wheel = 0, coal = true, light = "#D6AC66", lightAmt = 0,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {coal && (
      <path d="M -105 -118 Q -80 -160 -40 -150 Q -10 -175 25 -152 Q 60 -170 95 -130 L 100 -118 Z" fill="#0A0B0C" />
    )}
    <path d="M -118 -120 L 118 -120 L 100 -30 L -100 -30 Z" fill={color} />
    <path d="M -118 -120 L 118 -120" stroke={light} strokeOpacity={lightAmt} strokeWidth={3} />
    {[-80, -25, 30, 85].map((rx) => (
      <circle key={rx} cx={rx} cy={-75} r={4} fill="#000" opacity={0.5} />
    ))}
    <rect x={-110} y={-82} width={220} height={6} fill="#000" opacity={0.35} />
    <rect x={-88} y={-34} width={176} height={10} fill={color} />
    {[-62, 62].map((wx) => (
      <g key={wx} transform={`translate(${wx} -12) rotate(${wheel})`}>
        <circle r={22} fill={color} stroke="#2C3136" strokeWidth={3} />
        {[0, 60, 120].map((a) => (
          <line key={a} x1={-20 * Math.cos((a * Math.PI) / 180)} y1={-20 * Math.sin((a * Math.PI) / 180)} x2={20 * Math.cos((a * Math.PI) / 180)} y2={20 * Math.sin((a * Math.PI) / 180)} stroke="#3A4046" strokeWidth={3} />
        ))}
        <circle r={5} fill="#3A4046" />
      </g>
    ))}
  </g>
);

/** 蒸汽机飞轮与曲柄连杆：angle 为飞轮转角（度） */
export const Flywheel: React.FC<{ cx: number; cy: number; R: number; angle: number; light?: number }> = ({ cx, cy, R, angle, light = 0.5 }) => {
  const a = (angle * Math.PI) / 180;
  const crank = [cx + Math.cos(a) * R * 0.42, cy + Math.sin(a) * R * 0.42];
  const rodLen = R * 1.9;
  const crossX = crank[0] - Math.sqrt(Math.max(0, rodLen * rodLen - (crank[1] - cy) ** 2));
  const metal = `rgb(${40 + 50 * light},${42 + 46 * light},${46 + 40 * light})`;
  return (
    <g>
      <defs>
        <linearGradient id="fw-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8C8F92" stopOpacity={light} />
          <stop offset="0.5" stopColor={metal} />
          <stop offset="1" stopColor="#0B0C0D" />
        </linearGradient>
      </defs>
      {/* 气缸与滑道 */}
      <rect x={cx - R * 3.3} y={cy - R * 0.28} width={R * 1.1} height={R * 0.56} rx={8} fill={metal} stroke="#000" strokeWidth={3} />
      <rect x={cx - R * 2.2} y={cy - R * 0.08} width={R * 1.3} height={R * 0.16} fill="#0E0F10" />
      <rect x={crossX - R * 0.12} y={cy - R * 0.12} width={R * 0.24} height={R * 0.24} fill={metal} stroke="#000" strokeWidth={2} />
      <line x1={cx - R * 2.2} y1={cy} x2={crossX} y2={cy} stroke={metal} strokeWidth={R * 0.06} />
      <line x1={crossX} y1={cy} x2={crank[0]} y2={crank[1]} stroke={metal} strokeWidth={R * 0.09} strokeLinecap="round" />
      {/* 飞轮 */}
      <g transform={`translate(${cx} ${cy}) rotate(${angle})`}>
        <circle r={R} fill="none" stroke="url(#fw-rim)" strokeWidth={R * 0.13} />
        <circle r={R * 0.88} fill="none" stroke="#000" strokeWidth={2} opacity={0.6} />
        {range(6).map((i) => {
          const b = (i * Math.PI) / 3;
          return (
            <path
              key={i}
              d={`M ${Math.cos(b - 0.06) * R * 0.15} ${Math.sin(b - 0.06) * R * 0.15} L ${Math.cos(b - 0.025) * R * 0.9} ${Math.sin(b - 0.025) * R * 0.9} L ${Math.cos(b + 0.025) * R * 0.9} ${Math.sin(b + 0.025) * R * 0.9} L ${Math.cos(b + 0.06) * R * 0.15} ${Math.sin(b + 0.06) * R * 0.15} Z`}
              fill={metal}
            />
          );
        })}
        <circle r={R * 0.17} fill={metal} stroke="#000" strokeWidth={3} />
        <rect x={R * 0.12} y={-R * 0.05} width={R * 0.35} height={R * 0.1} fill={metal} />
      </g>
      <circle cx={crank[0]} cy={crank[1]} r={R * 0.05} fill="#111" />
      {/* 机座 */}
      <path d={`M ${cx - R * 0.5} ${cy} L ${cx - R * 0.8} ${cy + R * 1.2} L ${cx + R * 0.8} ${cy + R * 1.2} L ${cx + R * 0.5} ${cy} Z`} fill="#0D0E0F" />
    </g>
  );
};

/** 锅炉炉膛：fire 0..1 为炉火强度 */
export const Boiler: React.FC<{ x: number; y: number; w: number; fire: number; t: number }> = ({ x, y, w, fire, t }) => {
  const h = w * 0.62;
  const flick = 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 4.3);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id="fire" cx="0.5" cy="0.8" r="0.8">
          <stop offset="0" stopColor="#FFE7A8" stopOpacity={fire} />
          <stop offset="0.35" stopColor="#E7882E" stopOpacity={fire * 0.95} />
          <stop offset="0.75" stopColor="#8A2A10" stopOpacity={fire * 0.8} />
          <stop offset="1" stopColor="#1A0805" stopOpacity={1} />
        </radialGradient>
        <radialGradient id="fireSpill" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#E7A04E" stopOpacity={0.55 * fire * flick} />
          <stop offset="1" stopColor="#E7A04E" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={h * 0.15} rx={w * 1.6} ry={h * 1.2} fill="url(#fireSpill)" style={{ mixBlendMode: "screen" }} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.08} fill="#16191C" stroke="#2E3338" strokeWidth={6} />
      {range(10).map((i) => (
        <circle key={i} cx={-w / 2 + w * 0.05 + (i * w * 0.9) / 9} cy={-h / 2 + w * 0.04} r={w * 0.012} fill="#3A4046" />
      ))}
      <path d={`M ${-w * 0.3} ${h * 0.35} L ${-w * 0.3} ${-h * 0.05} Q 0 ${-h * 0.32} ${w * 0.3} ${-h * 0.05} L ${w * 0.3} ${h * 0.35} Z`} fill="url(#fire)" />
      {range(9).map((i) => (
        <line key={i} x1={-w * 0.28 + i * w * 0.07} y1={h * 0.35} x2={-w * 0.28 + i * w * 0.07} y2={-h * 0.05 - Math.sin((i / 8) * Math.PI) * h * 0.2} stroke="#0B0C0D" strokeWidth={w * 0.012} />
      ))}
      <rect x={w * 0.32} y={-h * 0.15} width={w * 0.1} height={h * 0.5} fill="#2A2F34" />
    </g>
  );
};

/** 巷道木支架（梯形棚）：一组透视排列的支架构成纵深 */
export const TunnelTimbers: React.FC<{ vx: number; vy: number; count?: number; offset?: number; color?: string; lightX?: number; light?: number }> = ({
  vx, vy, count = 9, offset = 0, color = "#1B1611", lightX = 960, light = 0.4,
}) => {
  const frames = range(count).map((i) => {
    const d = ((i + offset) % count + count) % count;
    const z = 1 / (1 + d * 0.55);
    return { z, i };
  }).sort((a, b) => a.z - b.z);
  return (
    <g>
      {frames.map(({ z, i }) => {
        const wTop = 1250 * z;
        const wBot = 1700 * z;
        const hgt = 1150 * z;
        const cx = vx;
        const top = vy - hgt * 0.5;
        const bot = vy + hgt * 0.5;
        const th = 60 * z;
        const shade = Math.min(1, z * 1.4);
        const near = Math.abs(cx - lightX) < 2000;
        const c = shade;
        return (
          <g key={i} opacity={Math.min(1, z * 2.4)}>
            <path d={`M ${cx - wBot / 2} ${bot} L ${cx - wTop / 2} ${top} L ${cx - wTop / 2 + th} ${top} L ${cx - wBot / 2 + th} ${bot} Z`} fill={color} />
            <path d={`M ${cx + wBot / 2} ${bot} L ${cx + wTop / 2} ${top} L ${cx + wTop / 2 - th} ${top} L ${cx + wBot / 2 - th} ${bot} Z`} fill={color} />
            <rect x={cx - wTop / 2 - th * 0.6} y={top - th * 0.2} width={wTop + th * 1.2} height={th * 1.1} fill={color} />
            {near && <rect x={cx - wTop / 2 - th * 0.6} y={top + th * 0.75} width={wTop + th * 1.2} height={th * 0.12} fill="#D6AC66" opacity={light * c * 0.5} />}
          </g>
        );
      })}
    </g>
  );
};

/** 巷道内部：地面、向远处汇聚的轨道与枕木、尽头的黑暗。offset 推动枕木表现前进运动。 */
export const TunnelInterior: React.FC<{ vx: number; vy: number; offset?: number; rails?: boolean; light?: number; endDark?: number }> = ({
  vx, vy, offset = 0, rails = true, light = 0.3, endDark = 1,
}) => {
  const bottom = 1300;
  const sleepers = range(22).map((i) => {
    const d = (((i + offset) % 22) + 22) % 22;
    const z = 1 / (1 + d * 0.35); // 1 近 → 0 远
    return z;
  });
  const rx = (k: number, z: number) => vx + k * 520 * z;
  const ry = (z: number) => vy + (bottom - vy) * z;
  return (
    <g>
      <defs>
        <linearGradient id="tun-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050607" />
          <stop offset="1" stopColor="#1A1714" />
        </linearGradient>
        <radialGradient id="tun-end">
          <stop offset="0" stopColor="#000" stopOpacity={0.98 * endDark} />
          <stop offset="0.5" stopColor="#000" stopOpacity={0.75 * endDark} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={`M -400 ${bottom} L 2320 ${bottom} L ${vx + 60} ${vy + 30} L ${vx - 60} ${vy + 30} Z`} fill="url(#tun-floor)" />
      {rails && (
        <g>
          {sleepers.map((z, i) => (
            <rect key={i} x={rx(-1.25, z)} y={ry(z) - 10 * z} width={520 * 2.5 * z} height={22 * z} fill="#16120E" opacity={Math.min(1, z * 3)} />
          ))}
          {[-0.75, 0.75].map((k) => (
            <g key={k}>
              <line x1={rx(k, 1.2)} y1={ry(1.2)} x2={rx(k, 0.02)} y2={ry(0.02)} stroke="#3B3833" strokeWidth={9} />
              <line x1={rx(k, 1.2)} y1={ry(1.2) - 4} x2={rx(k, 0.02)} y2={ry(0.02)} stroke="#D6AC66" strokeOpacity={light * 0.6} strokeWidth={2} />
            </g>
          ))}
        </g>
      )}
      <ellipse cx={vx} cy={vy} rx={620} ry={420} fill="url(#tun-end)" />
    </g>
  );
};
