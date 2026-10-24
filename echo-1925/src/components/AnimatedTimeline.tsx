import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, ramp } from "../lib/anim";
import { C, FONT } from "../theme";

/**
 * 历史时间推进：贴近画面上缘的一条细刻度尺，节点依次点亮，游标连续前进。
 * marks 中的 at 为局部秒（游标到达并点亮该节点的时间）。
 */
export const AnimatedTimeline: React.FC<{
  marks: { label: string; at: number }[];
  from: number;
  to: number;
  y?: number;
  opacity?: number;
}> = ({ marks, from, to, y = 96, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const x0 = 360;
  const x1 = 1560;
  const xs = marks.map((_, i) => x0 + ((x1 - x0) * i) / (marks.length - 1));
  // 游标位置：在相邻节点之间平滑插值
  let cx = xs[0];
  for (let i = 0; i < marks.length - 1; i++) {
    const k = ramp(frame, [marks[i].at, marks[i + 1].at], [0, 1], EASE);
    if (k > 0) cx = xs[i] + (xs[i + 1] - xs[i]) * k;
  }
  const vis = ramp(frame, [from, from + 0.8]) * (1 - ramp(frame, [to - 0.8, to]));
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: 1920, height: 120, opacity: vis * opacity, fontFamily: FONT.serif }}>
      <svg width={1920} height={120} style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} x2={x1} y1={40} y2={40} stroke={C.paper} strokeOpacity={0.25} strokeWidth={2} />
        {Array.from({ length: 49 }, (_, i) => (
          <line key={i} x1={x0 + ((x1 - x0) * i) / 48} x2={x0 + ((x1 - x0) * i) / 48} y1={i % 6 === 0 ? 30 : 35} y2={40} stroke={C.paper} strokeOpacity={0.25} strokeWidth={1.5} />
        ))}
        <line x1={x0} x2={cx} y1={40} y2={40} stroke={C.gold} strokeWidth={3} />
        {xs.map((x, i) => {
          const on = ramp(frame, [marks[i].at - 0.2, marks[i].at + 0.4]);
          return <circle key={i} cx={x} cy={40} r={6 + 3 * on} fill={on > 0.5 ? C.gold : "#3A3F44"} stroke={C.paper} strokeOpacity={0.5} />;
        })}
        <circle cx={cx} cy={40} r={14} fill="none" stroke={C.gold} strokeOpacity={0.7} strokeWidth={2} />
      </svg>
      {marks.map((m, i) => {
        const on = ramp(frame, [m.at - 0.2, m.at + 0.5]);
        return (
          <div key={i} style={{ position: "absolute", left: xs[i] - 200, width: 400, top: 62, textAlign: "center", fontSize: 30, fontWeight: 700, letterSpacing: "0.12em", color: on > 0.5 ? C.paper : "rgba(232,224,210,0.4)" }}>
            {m.label}
          </div>
        );
      })}
    </div>
  );
};
