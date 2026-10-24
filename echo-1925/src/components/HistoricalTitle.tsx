import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE_OUT, clamp, ramp } from "../lib/anim";
import { C, FONT } from "../theme";

/**
 * 电影片头式标题：逐字由模糊到清晰、字距由宽收拢，缓慢淡入，不跳动。
 * in/out 为局部秒。
 */
export const HistoricalTitle: React.FC<{
  text: string;
  inAt: number;
  outAt?: number;
  size?: number;
  color?: string;
  weight?: number;
  spacingFrom?: number; // em
  spacingTo?: number;
  stagger?: number; // 秒
  dur?: number;
  y?: number; // 中心 y
  glow?: string;
  style?: React.CSSProperties;
  family?: string;
}> = ({
  text, inAt, outAt, size = 140, color = C.paper, weight = 900, spacingFrom = 0.5, spacingTo = 0.12,
  stagger = 0.09, dur = 1.6, y = 540, glow, style, family = FONT.serif,
}) => {
  const frame = useCurrentFrame();
  const chars = Array.from(text);
  const out = outAt !== undefined ? 1 - ramp(frame, [outAt, outAt + 1.0]) : 1;
  const spacing = spacingFrom + (spacingTo - spacingFrom) * ramp(frame, [inAt, inAt + dur + chars.length * stagger + 1.2], [0, 1], EASE_OUT);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        transform: "translateY(-50%)",
        textAlign: "center",
        fontFamily: family,
        fontWeight: weight,
        fontSize: size,
        color,
        letterSpacing: `${spacing}em`,
        paddingLeft: `${spacing}em`,
        whiteSpace: "nowrap",
        opacity: out,
        textShadow: glow ? `0 0 ${size * 0.25}px ${glow}, 0 0 ${size * 0.6}px ${glow}` : "0 6px 30px rgba(0,0,0,0.6)",
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        const k = ramp(frame, [inAt + i * stagger, inAt + i * stagger + dur], [0, 1], EASE_OUT);
        return (
          <span key={i} style={{ opacity: k, filter: `blur(${(1 - k) * 14}px)`, display: "inline-block", transform: `translateY(${(1 - k) * 8}px)` }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** 大号历史日期：年份数字醒目，下方暗红细线横向展开 */
export const DateDisplay: React.FC<{
  year: string;
  rest?: string;
  inAt: number;
  outAt?: number;
  size?: number;
  y?: number;
  accent?: string;
  caption?: string;
  align?: "center" | "left";
  x?: number;
}> = ({ year, rest = "", inAt, outAt, size = 200, y = 500, accent = C.red, caption, align = "center", x = 960 }) => {
  const frame = useCurrentFrame();
  const a = ramp(frame, [inAt, inAt + 1.2], [0, 1], EASE_OUT);
  const line = ramp(frame, [inAt + 0.4, inAt + 1.8], [0, 1], EASE_OUT);
  const cap = ramp(frame, [inAt + 1.0, inAt + 2.0]);
  const out = outAt !== undefined ? 1 - ramp(frame, [outAt, outAt + 0.8]) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? 0 : x,
        right: align === "center" ? 0 : undefined,
        top: y,
        transform: "translateY(-50%)",
        textAlign: align,
        opacity: out,
        fontFamily: FONT.serif,
        color: C.paper,
      }}
    >
      <div style={{ opacity: a, filter: `blur(${(1 - a) * 10}px)`, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
        <span style={{ fontSize: size, fontWeight: 900, lineHeight: 1 }}>{year}</span>
        {rest && <span style={{ fontSize: size * 0.42, fontWeight: 700, marginLeft: size * 0.08 }}>{rest}</span>}
      </div>
      <div
        style={{
          height: 4,
          background: accent,
          width: 560 * line,
          margin: align === "center" ? "26px auto 0" : "26px 0 0",
          opacity: 0.9,
          boxShadow: `0 0 18px ${accent}`,
        }}
      />
      {caption && (
        <div style={{ marginTop: 26, fontSize: size * 0.24, fontWeight: 700, letterSpacing: "0.3em", opacity: cap, color: C.paper }}>{caption}</div>
      )}
    </div>
  );
};

/** 纪录片式信息条：年份｜事件。出现后自动消失，不长期遮挡画面。 */
export const InfoCaption: React.FC<{
  year: string;
  text: string;
  inAt: number;
  outAt: number;
  x?: number;
  y?: number;
}> = ({ year, text, inAt, outAt, x = 140, y = 150 }) => {
  const frame = useCurrentFrame();
  const a = ramp(frame, [inAt, inAt + 0.9], [0, 1], EASE_OUT) * (1 - ramp(frame, [outAt - 0.7, outAt]));
  const wipe = ramp(frame, [inAt, inAt + 1.3], [0, 100], EASE_OUT);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "22px 40px 22px 30px",
        background: "linear-gradient(90deg, rgba(232,224,210,0.14), rgba(232,224,210,0.03))",
        borderLeft: `4px solid ${C.gold}`,
        opacity: a,
        clipPath: `inset(0 ${100 - wipe}% 0 0)`,
        fontFamily: FONT.serif,
        color: C.paper,
        backdropFilter: "blur(2px)",
      }}
    >
      <span style={{ fontSize: 64, fontWeight: 900, color: C.gold, letterSpacing: "0.02em" }}>{year}</span>
      <span style={{ width: 2, height: 52, background: "rgba(232,224,210,0.5)" }} />
      <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: "0.12em" }}>{text}</span>
    </div>
  );
};

/** 场景角落的“历史情景再现”标注：艺术化重现不冒充真实影像 */
export const ReenactmentLabel: React.FC<{ text?: string; opacity?: number }> = ({ text = "历史情景再现", opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      right: 70,
      top: 56,
      fontFamily: FONT.sans,
      fontWeight: 500,
      fontSize: 22,
      letterSpacing: "0.3em",
      color: "rgba(232,224,210,0.62)",
      padding: "6px 6px 6px 14px",
      borderLeft: "2px solid rgba(214,172,102,0.6)",
      opacity,
    }}
  >
    {text}
  </div>
);

/** 中心主题句（如“沉默，不再是唯一的选择。”） */
export const CenterLine: React.FC<{ text: string; inAt: number; outAt?: number; size?: number; y?: number; color?: string }> = ({
  text, inAt, outAt, size = 76, y = 520, color = C.paper,
}) => {
  const frame = useCurrentFrame();
  const a = ramp(frame, [inAt, inAt + 1.6], [0, 1], EASE_OUT) * (outAt !== undefined ? 1 - ramp(frame, [outAt, outAt + 0.8]) : 1);
  const sp = 0.32 - 0.14 * ramp(frame, [inAt, inAt + 3.5], [0, 1], EASE_OUT);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        transform: "translateY(-50%)",
        textAlign: "center",
        fontFamily: FONT.serif,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: `${sp}em`,
        color,
        opacity: clamp(a),
        filter: `blur(${(1 - a) * 6}px)`,
        textShadow: "0 4px 30px rgba(0,0,0,0.8)",
      }}
    >
      {text}
    </div>
  );
};
