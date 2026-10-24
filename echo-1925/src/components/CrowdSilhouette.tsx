import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { lerp, mixColor, rand } from "../lib/anim";
import { buildFigure, FigureSpec, Garment, Hat, Pose, Tool } from "./WorkerSilhouette";

export type Role = "miner" | "student" | "merchant" | "citizen";

const ROLE_LOOK: Record<Role, { hats: Hat[]; garments: Garment[]; tools: Tool[] }> = {
  miner: { hats: ["towel", "towel", "cap", "none"], garments: ["jacket", "jacket", "coat"], tools: ["none", "pick", "lamp", "lamp", "none"] },
  student: { hats: ["student", "student", "none"], garments: ["gown", "jacket"], tools: ["none"] },
  merchant: { hats: ["fedora", "cap"], garments: ["gown", "gown", "coat"], tools: ["none"] },
  citizen: { hats: ["cap", "none", "towel"], garments: ["jacket", "coat", "gown"], tools: ["none", "pole", "none", "none"] },
};

export interface CrowdProps {
  seed: number;
  count: number;
  /** 'toward'：朝镜头走来；'lateral'：横向行进；'gather'：汇聚后伫立 */
  motion: "toward" | "lateral" | "gather" | "still";
  horizon: number; // 地平线 y
  vanishX?: number;
  nearY?: number; // 最近一排的脚底 y
  hNear?: number;
  hFar?: number;
  zRange?: [number, number];
  speed?: number; // toward: z/秒；lateral: 像素/秒（近景）
  roles?: Partial<Record<Role, number>>;
  colorNear?: string;
  colorFar?: string;
  spreadX?: number; // 近景横向分布宽度
  direction?: 1 | -1;
  lampGlow?: number;
  pose?: Pose;
  appear?: number; // 0..1 由远到近逐渐出现（集结）
  raiseFraction?: number;
}

interface Person {
  z: number;
  xr: number; // -1..1
  phase0: number;
  rate: number;
  role: Role;
  hat: Hat;
  garment: Garment;
  tool: Tool;
  build: number;
  hScale: number;
  raise: boolean;
  delay: number;
}

const pick = <T,>(arr: T[], r: number) => arr[Math.floor(r * arr.length) % arr.length];

/** 群体人物剪影：透视纵深 + 空气透视（远处偏灰）+ 步态差异，营造真实的人群汇聚感。 */
export const CrowdSilhouette: React.FC<CrowdProps> = ({
  seed, count, motion, horizon, vanishX = 960, nearY = 1180, hNear = 520, hFar = 40, zRange = [0, 1],
  speed = 0.03, roles = { miner: 1 }, colorNear = "#07090B", colorFar = "#5A6066", spreadX = 2600,
  direction = 1, lampGlow = 0, pose, appear = 1, raiseFraction = 0,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const people = useMemo<Person[]>(() => {
    const r = rand(seed);
    const roleList = Object.entries(roles) as [Role, number][];
    const totalW = roleList.reduce((a, [, w]) => a + w, 0);
    return Array.from({ length: count }, () => {
      let q = r() * totalW;
      let role: Role = roleList[0][0];
      for (const [k, w] of roleList) {
        if ((q -= w) <= 0) {
          role = k;
          break;
        }
      }
      const look = ROLE_LOOK[role];
      return {
        z: lerp(zRange[0], zRange[1], r()),
        xr: r() * 2 - 1,
        phase0: r() * Math.PI * 2,
        rate: 0.85 + r() * 0.3,
        role,
        hat: pick(look.hats, r()),
        garment: pick(look.garments, r()),
        tool: pick(look.tools, r()),
        build: 0.88 + r() * 0.26,
        hScale: 0.92 + r() * 0.14,
        raise: r() < raiseFraction,
        delay: r(),
      };
    });
  }, [seed, count, roles, zRange, raiseFraction]);

  const items = people
    .map((p, i) => {
      let z = p.z;
      let xr = p.xr;
      if (motion === "toward") z = p.z + speed * t;
      const zz = ((z % 1) + 1) % 1; // 循环：走出画面的人从远处重新进入
      const zp = motion === "toward" ? zz : z;
      const persp = Math.pow(zp, 1.6);
      const yFeet = lerp(horizon + 6, nearY, persp);
      const h = lerp(hFar, hNear, persp) * p.hScale;
      const half = lerp(spreadX * 0.06, spreadX / 2, persp);
      let x = vanishX + xr * half;
      if (motion === "lateral") {
        const span = 1920 + 600;
        x = (((p.xr + 1) / 2) * span + direction * speed * t * lerp(0.25, 1, persp)) % span;
        x = ((x % span) + span) % span - 300;
      }
      if (motion === "gather") {
        // 从两侧向中心汇聚
        const k = Math.min(1, Math.max(0, appear * 1.4 - p.delay * 0.4));
        x = lerp(vanishX + xr * half * 2.6, x, k);
      }
      const visible = motion === "gather" || motion === "still" ? Math.min(1, Math.max(0, appear * 1.5 - p.delay * 0.5) * 3) : 1;
      // 远景淡入，近景出画前淡出
      const edge = motion === "toward" ? Math.min(1, zz * 8, (1 - zz) * 10) : 1;
      const walking = motion === "toward" || motion === "lateral" || (motion === "gather" && appear < 0.98);
      const spec: FigureSpec = {
        x,
        y: yFeet,
        h,
        view: motion === "lateral" ? "side" : "front",
        facing: direction,
        pose: pose ?? (p.raise && appear > 0.6 ? "raise" : walking ? "walk" : "stand"),
        phase: p.phase0 + t * 5.2 * p.rate * (walking ? 1 : 0.15),
        hat: p.hat,
        garment: p.garment,
        tool: p.tool === "lamp" || p.raise ? "lamp" : motion === "lateral" ? p.tool : "none",
        build: p.build,
        color: mixColor(colorFar, colorNear, Math.pow(zp, 0.7)),
      };
      return { z: zp, spec, op: visible * edge, i };
    })
    .filter((it) => it.op > 0.01 && it.spec.x > -300 && it.spec.x < 2220)
    .sort((a, b) => a.z - b.z);

  const lamps: { x: number; y: number; s: number; o: number }[] = [];
  const figs = items.map((it) => {
    const out = buildFigure(it.spec, it.i);
    if (out.lamp && lampGlow > 0) lamps.push({ x: out.lamp[0], y: out.lamp[1], s: it.spec.h, o: it.op });
    return (
      <g key={it.i} opacity={it.op}>
        {out.el}
      </g>
    );
  });

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id={`crowdlamp-${seed}`}>
          <stop offset="0" stopColor="#FFF1CC" stopOpacity={1} />
          <stop offset="0.12" stopColor="#E9BE73" stopOpacity={0.7} />
          <stop offset="0.45" stopColor="#D6AC66" stopOpacity={0.14} />
          <stop offset="1" stopColor="#D6AC66" stopOpacity={0} />
        </radialGradient>
      </defs>
      {figs}
      <g style={{ mixBlendMode: "screen" }}>
        {lamps.map((l, i) => (
          <circle key={i} cx={l.x} cy={l.y} r={l.s * 0.32} fill={`url(#crowdlamp-${seed})`} opacity={l.o * lampGlow} />
        ))}
      </g>
    </svg>
  );
};
