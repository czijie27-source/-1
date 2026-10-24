import React from "react";

/**
 * 参数化人物剪影：用简化骨骼（髋、肩、肘、膝）驱动，支持行走、伫立、挥镐、弯腰、坐姿、举灯等姿态，
 * 以及 1920 年代的服饰与道具（毛巾包头、毡帽、学生帽、礼帽；短褂、长衫；矿镐、矿灯、扁担）。
 * 所有人物由参数随机组合而成，避免“复制粘贴”式的重复感。
 */
export type Pose = "walk" | "stand" | "swing" | "bend" | "sit" | "raise" | "push";
export type Hat = "towel" | "cap" | "student" | "fedora" | "none";
export type Garment = "jacket" | "gown" | "coat";
export type Tool = "pick" | "lamp" | "pole" | "none" | "shovel";

export interface FigureSpec {
  x: number;
  y: number; // 脚底基线
  h: number; // 身高（像素）
  pose?: Pose;
  phase?: number; // 动作周期相位（弧度）
  view?: "side" | "front";
  facing?: 1 | -1;
  hat?: Hat;
  garment?: Garment;
  tool?: Tool;
  build?: number; // 体型 0.85~1.15
  color?: string;
  lean?: number; // 额外前倾角（度）
  rim?: number; // 轮廓光强度（来自身后矿灯的暖光描边）
}

type P = [number, number];
const rot = ([x, y]: P, deg: number): P => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];

export interface FigureOut {
  el: React.ReactNode;
  lamp?: P; // 矿灯在画面中的位置（用于额外光晕）
}

const Hats: Record<Hat, (head: P, r: number, f: number, c: string) => React.ReactNode> = {
  none: () => null,
  towel: ([hx, hy], r, f, c) => (
    <>
      <ellipse cx={hx} cy={hy - r * 0.35} rx={r * 1.12} ry={r * 0.62} fill={c} />
      <path d={`M ${hx - f * r * 0.85} ${hy - r * 0.35} q ${-f * r * 0.35} ${r * 0.1} ${-f * r * 0.4} ${r * 0.45}`} stroke={c} strokeWidth={r * 0.28} fill="none" strokeLinecap="round" />
    </>
  ),
  cap: ([hx, hy], r, f, c) => (
    <>
      <ellipse cx={hx} cy={hy - r * 0.55} rx={r * 1.05} ry={r * 0.6} fill={c} />
      <ellipse cx={hx + f * r * 0.35} cy={hy - r * 0.3} rx={r * 1.15} ry={r * 0.2} fill={c} />
    </>
  ),
  student: ([hx, hy], r, f, c) => (
    <>
      <rect x={hx - r * 1.05} y={hy - r * 1.25} width={r * 2.1} height={r * 0.85} rx={r * 0.15} fill={c} />
      <path d={`M ${hx} ${hy - r * 0.45} L ${hx + f * r * 1.7} ${hy - r * 0.25} L ${hx} ${hy - r * 0.2} Z`} fill={c} />
    </>
  ),
  fedora: ([hx, hy], r, _f, c) => (
    <>
      <ellipse cx={hx} cy={hy - r * 0.45} rx={r * 1.7} ry={r * 0.28} fill={c} />
      <path d={`M ${hx - r * 0.9} ${hy - r * 0.45} L ${hx - r * 0.8} ${hy - r * 1.4} Q ${hx} ${hy - r * 1.2} ${hx + r * 0.8} ${hy - r * 1.4} L ${hx + r * 0.9} ${hy - r * 0.45} Z`} fill={c} />
    </>
  ),
};

export const buildFigure = (s: FigureSpec, key: React.Key = 0): FigureOut => {
  const {
    x, y, h, pose = "stand", phase = 0, view = "side", facing = 1, hat = "towel",
    garment = "jacket", tool = "none", build = 1, color = "#0B0D0F", lean: extraLean = 0,
  } = s;
  const u = h;
  const f = facing;
  const c = color;
  const sw = (k: number) => u * k * build;

  if (view === "front") {
    // 正面（朝向镜头走来）
    const bob = Math.abs(Math.sin(phase)) * u * 0.012;
    const sway = Math.sin(phase) * u * 0.008;
    const hip: P = [x + sway, y - u * 0.5 - bob];
    const sh: P = [x + sway * 1.5, y - u * 0.82 - bob];
    const headC: P = [sh[0], sh[1] - u * 0.105];
    const r = u * 0.062;
    const liftL = Math.max(0, Math.sin(phase)) * u * 0.035;
    const liftR = Math.max(0, -Math.sin(phase)) * u * 0.035;
    const legW = sw(0.075);
    const shoulderW = u * 0.13 * build;
    const armSw = Math.sin(phase) * 6;
    const els: React.ReactNode[] = [];
    // 腿
    els.push(<line key="ll" x1={hip[0] - u * 0.045} y1={hip[1]} x2={x - u * 0.06} y2={y - liftL} stroke={c} strokeWidth={legW} strokeLinecap="round" />);
    els.push(<line key="lr" x1={hip[0] + u * 0.045} y1={hip[1]} x2={x + u * 0.06} y2={y - liftR} stroke={c} strokeWidth={legW} strokeLinecap="round" />);
    // 躯干
    const hem = garment === "gown" ? y - u * 0.1 : hip[1] + u * 0.07;
    const hemW = garment === "gown" ? u * 0.15 : u * 0.115 * build;
    els.push(
      <path key="t" d={`M ${sh[0] - shoulderW} ${sh[1] + u * 0.045} Q ${sh[0] - shoulderW * 0.9} ${sh[1] - u * 0.005} ${sh[0] - u * 0.03} ${sh[1] - u * 0.012} L ${sh[0] + u * 0.03} ${sh[1] - u * 0.012} Q ${sh[0] + shoulderW * 0.9} ${sh[1] - u * 0.005} ${sh[0] + shoulderW} ${sh[1] + u * 0.045} L ${sh[0] + shoulderW * 0.86} ${sh[1] + u * 0.2} L ${hip[0] + hemW} ${hem} L ${hip[0] - hemW} ${hem} L ${sh[0] - shoulderW * 0.86} ${sh[1] + u * 0.2} Z`} fill={c} />,
    );
    // 手臂
    let lamp: P | undefined;
    for (const side of [-1, 1]) {
      const s0: P = [sh[0] + side * shoulderW * 0.95, sh[1] + u * 0.05];
      const raise = pose === "raise" && side === 1;
      const el = add(s0, rot([0, u * 0.17], raise ? -side * 160 : -side * (10 + armSw * side)));
      const hd = add(el, rot([0, u * 0.16], raise ? -side * 170 : -side * (4 + armSw * side)));
      els.push(<polyline key={`a${side}`} points={`${s0[0]},${s0[1]} ${el[0]},${el[1]} ${hd[0]},${hd[1]}`} stroke={c} strokeWidth={sw(0.055)} fill="none" strokeLinecap="round" strokeLinejoin="round" />);
      if (tool === "lamp" && ((raise && side === 1) || (!raise && side === -1 && pose !== "raise"))) {
        lamp = [hd[0], hd[1] + (raise ? -u * 0.02 : u * 0.05)];
        els.push(<rect key="lmp" x={lamp[0] - u * 0.018} y={lamp[1] - u * 0.03} width={u * 0.036} height={u * 0.06} fill={c} />);
      }
    }
    // 颈与头
    els.push(<line key="n" x1={sh[0]} y1={sh[1]} x2={headC[0]} y2={headC[1]} stroke={c} strokeWidth={u * 0.05} />);
    els.push(<circle key="h" cx={headC[0]} cy={headC[1]} r={r} fill={c} />);
    els.push(<g key="hat">{Hats[hat](headC, r, 1, c)}</g>);
    return { el: <g key={key}>{els}</g>, lamp };
  }

  // ── 侧面 ──
  let lean = 3 + extraLean;
  let legSwing = 0;
  let armA = [0, 0];
  let armB = [0, 0];
  let hipY = 0.5;
  let thighA: [number, number] = [4, -4];
  let shinA: [number, number] = [4, -4];
  const ph = phase;

  switch (pose) {
    case "walk": {
      legSwing = 24;
      thighA = [legSwing * Math.sin(ph), legSwing * Math.sin(ph + Math.PI)];
      const flex = (p: number) => 6 + 38 * Math.max(0, Math.sin(p - 1.2));
      shinA = [thighA[0] - flex(ph), thighA[1] - flex(ph + Math.PI)];
      armA = [-20 * Math.sin(ph), -20 * Math.sin(ph) + 18];
      armB = [-20 * Math.sin(ph + Math.PI), -20 * Math.sin(ph + Math.PI) + 18];
      hipY = 0.5 - Math.abs(Math.cos(ph)) * 0.012;
      lean += 4;
      break;
    }
    case "push": {
      lean += 28;
      thighA = [30 * Math.sin(ph) + 10, 30 * Math.sin(ph + Math.PI) + 10];
      shinA = [thighA[0] - 25, thighA[1] - 25];
      armA = [80, 85];
      armB = [75, 80];
      hipY = 0.47;
      break;
    }
    case "swing": {
      lean += 22 + 10 * Math.sin(ph);
      thighA = [18, -14];
      shinA = [4, -10];
      const a = -150 + 175 * (0.5 + 0.5 * Math.sin(ph)); // 从高举到落下
      armA = [a, a + 20];
      armB = [a + 8, a + 28];
      hipY = 0.47;
      break;
    }
    case "bend": {
      lean += 55 + 6 * Math.sin(ph);
      thighA = [28, 8];
      shinA = [-8, -12];
      armA = [70 + 15 * Math.sin(ph), 85 + 15 * Math.sin(ph)];
      armB = [62 + 15 * Math.sin(ph), 80 + 15 * Math.sin(ph)];
      hipY = 0.44;
      break;
    }
    case "sit": {
      lean += 8;
      thighA = [88, 84];
      shinA = [2, -6];
      armA = [30, 75];
      armB = [35, 80];
      hipY = 0.28;
      break;
    }
    case "raise": {
      lean += 2;
      thighA = [8, -6];
      shinA = [6, -6];
      armA = [-165, -170];
      armB = [12, 22];
      break;
    }
    default: {
      thighA = [5 + 2 * Math.sin(ph), -5];
      shinA = [3, -5];
      armA = [6 + 2 * Math.sin(ph * 0.7), 10];
      armB = [-4, 4];
    }
  }

  const fp = (p: P): P => [x + p[0] * f, y + p[1]];
  const hipL: P = [0, -u * hipY];
  const shL = add(hipL, rot([0, -u * 0.31], lean));
  const headL = add(shL, rot([0, -u * 0.105], lean * 0.6));
  const r = u * 0.062;
  const els: React.ReactNode[] = [];
  const legW = sw(0.078);
  const shinW = sw(0.066);

  const leg = (ta: number, sa: number, k: string, back: boolean) => {
    const knee = add(hipL, rot([0, u * 0.26], -ta));
    const ankle = add(knee, rot([0, u * 0.25], -sa));
    const toe = add(ankle, rot([u * 0.065, 0], -sa * 0.3));
    const [h0, k0, a0, t0] = [hipL, knee, ankle, toe].map(fp);
    return (
      <g key={k} opacity={back ? 0.92 : 1}>
        <line x1={h0[0]} y1={h0[1]} x2={k0[0]} y2={k0[1]} stroke={c} strokeWidth={legW} strokeLinecap="round" />
        <line x1={k0[0]} y1={k0[1]} x2={a0[0]} y2={a0[1]} stroke={c} strokeWidth={shinW} strokeLinecap="round" />
        <line x1={a0[0]} y1={a0[1]} x2={t0[0]} y2={t0[1]} stroke={c} strokeWidth={u * 0.035} strokeLinecap="round" />
      </g>
    );
  };
  const arm = (a: [number, number] | number[], k: string): [React.ReactNode, P] => {
    const s0 = add(shL, rot([0, u * 0.02], lean));
    const el = add(s0, rot([0, u * 0.17], -a[0]));
    const hd = add(el, rot([0, u * 0.16], -a[1]));
    const [p0, p1, p2] = [s0, el, hd].map(fp);
    return [
      <polyline key={k} points={`${p0[0]},${p0[1]} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} stroke={c} strokeWidth={sw(0.052)} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
      hd,
    ];
  };

  els.push(leg(thighA[1], shinA[1], "lb", true));
  const [armBack, handBack] = arm(armB, "ab");
  els.push(armBack);

  // 躯干与服装
  const back = rot([-u * 0.07 * build, 0], lean);
  const front = rot([u * 0.065 * build, 0], lean);
  const hemDepth = garment === "gown" ? (pose === "sit" ? u * 0.2 : u * 0.4) : garment === "coat" ? u * 0.16 : u * 0.07;
  const hemSpread = garment === "gown" ? u * 0.05 : 0;
  const pts: P[] = [
    add(shL, add(back, rot([0, -u * 0.005], lean))),
    add(shL, front),
    add(hipL, add(front, [hemSpread * 0.4, 0])),
    add(hipL, add(rot([u * 0.07 * build + hemSpread, hemDepth], pose === "sit" ? 0 : lean * 0.3), [0, 0])),
    add(hipL, add(rot([-u * 0.075 * build - hemSpread, hemDepth], pose === "sit" ? 0 : lean * 0.3), [0, 0])),
    add(hipL, back),
  ];
  const tp = pts.map(fp);
  els.push(<path key="torso" d={`M ${tp.map((p) => `${p[0]} ${p[1]}`).join(" L ")} Z`} fill={c} strokeLinejoin="round" stroke={c} strokeWidth={u * 0.02} />);

  els.push(leg(thighA[0], shinA[0], "lf", false));
  // 颈与头
  const neck0 = fp(shL);
  const headP = fp(headL);
  els.push(<line key="neck" x1={neck0[0]} y1={neck0[1]} x2={headP[0]} y2={headP[1]} stroke={c} strokeWidth={u * 0.05} />);
  els.push(<circle key="head" cx={headP[0]} cy={headP[1]} r={r} fill={c} />);
  els.push(<g key="hat">{Hats[hat](headP, r, f, c)}</g>);

  const [armFront, handFront] = arm(armA, "af");
  let lamp: P | undefined;

  // 道具
  if (tool === "pick") {
    if (pose === "swing") {
      const hp = fp(handFront);
      const dir = rot([0, u * 0.36], -armA[1] + 180);
      const end: P = [hp[0] + dir[0] * f, hp[1] + dir[1]];
      const perp = rot([u * 0.12, 0], -armA[1] + 180);
      els.push(<line key="ph" x1={hp[0]} y1={hp[1]} x2={end[0]} y2={end[1]} stroke={c} strokeWidth={u * 0.022} strokeLinecap="round" />);
      els.push(<path key="pk" d={`M ${end[0] - perp[0] * f} ${end[1] - perp[1]} Q ${end[0]} ${end[1] - u * 0.02} ${end[0] + perp[0] * f} ${end[1] + perp[1]}`} stroke={c} strokeWidth={u * 0.025} fill="none" strokeLinecap="round" />);
    } else {
      // 扛在肩上
      const s = fp(add(shL, [0, -u * 0.01]));
      const b = [s[0] - f * u * 0.28, s[1] + u * 0.2];
      const e = [s[0] + f * u * 0.1, s[1] - u * 0.07];
      els.push(<line key="ph" x1={b[0]} y1={b[1]} x2={e[0]} y2={e[1]} stroke={c} strokeWidth={u * 0.022} strokeLinecap="round" />);
      els.push(<path key="pk" d={`M ${b[0] + f * u * 0.02} ${b[1] - u * 0.13} Q ${b[0] - f * u * 0.04} ${b[1]} ${b[0] + f * u * 0.06} ${b[1] + u * 0.1}`} stroke={c} strokeWidth={u * 0.026} fill="none" strokeLinecap="round" />);
    }
  }
  if (tool === "shovel" && (pose === "bend" || pose === "push")) {
    const hp = fp(handFront);
    const dir = rot([0, u * 0.3], -armA[1]);
    const end: P = [hp[0] + dir[0] * f, hp[1] + dir[1]];
    els.push(<line key="sh" x1={hp[0]} y1={hp[1]} x2={end[0]} y2={end[1]} stroke={c} strokeWidth={u * 0.02} />);
    els.push(<ellipse key="sb" cx={end[0]} cy={end[1]} rx={u * 0.05} ry={u * 0.03} fill={c} />);
  }
  if (tool === "pole") {
    const s = fp(add(shL, [0, -u * 0.02]));
    const L = u * 0.42;
    els.push(<line key="pole" x1={s[0] - L} y1={s[1] + u * 0.01} x2={s[0] + L} y2={s[1] - u * 0.01} stroke={c} strokeWidth={u * 0.018} />);
    for (const sx of [-1, 1]) {
      const px = s[0] + sx * L * 0.92;
      els.push(<line key={`r${sx}`} x1={px} y1={s[1]} x2={px} y2={s[1] + u * 0.3} stroke={c} strokeWidth={u * 0.006} />);
      els.push(<path key={`b${sx}`} d={`M ${px - u * 0.08} ${s[1] + u * 0.3} L ${px + u * 0.08} ${s[1] + u * 0.3} L ${px + u * 0.06} ${s[1] + u * 0.42} L ${px - u * 0.06} ${s[1] + u * 0.42} Z`} fill={c} />);
    }
  }
  if (tool === "lamp") {
    const hd = pose === "raise" ? fp(handFront) : fp(handBack);
    lamp = [hd[0], hd[1] + u * 0.045];
    els.push(<line key="lh" x1={hd[0]} y1={hd[1]} x2={lamp[0]} y2={lamp[1] - u * 0.02} stroke={c} strokeWidth={u * 0.006} />);
    els.push(<rect key="lb" x={lamp[0] - u * 0.017} y={lamp[1] - u * 0.025} width={u * 0.034} height={u * 0.055} rx={u * 0.005} fill={c} />);
  }
  els.push(armFront);

  return { el: <g key={key}>{els}</g>, lamp };
};

export const WorkerSilhouette: React.FC<FigureSpec> = (props) => <>{buildFigure(props).el}</>;

/** 带暖色轮廓光的人物（用于前景主体，使剪影在暗背景中仍可辨认） */
export const rimmed = (out: FigureOut, rim: number, dir: 1 | -1 = 1): FigureOut => ({
  ...out,
  el: (
    <g style={{ filter: `drop-shadow(${-dir * 2}px -2px 1.5px rgba(232,190,120,${0.75 * rim})) drop-shadow(0 0 10px rgba(214,172,102,${0.35 * rim}))` }}>{out.el}</g>
  ),
});
