import timing from "./narration.timing.json";
import { FPS } from "./timeline";

/** 旁白 / 字幕的唯一数据源：由 scripts/narration.py 根据实际配音时长生成。 */
export interface Cue {
  id: string;
  scene: string;
  start: number;
  end: number;
  lines: string[];
}

export const CUES: Cue[] = timing.cues;
export const NARRATION_SOURCE: string = timing.source;

// 与 scripts/generate_subtitles.py 保持一致
const LEAD = 0.08;
const TAIL = 0.35;
const GAP = 0.06;

export interface SubtitleSpan {
  id: string;
  from: number; // 帧
  to: number; // 帧（不含）
  lines: string[];
}

export const SUBTITLES: SubtitleSpan[] = CUES.map((c, i) => {
  const start = Math.max(0, c.start - LEAD);
  let end = c.end + TAIL;
  if (i + 1 < CUES.length) end = Math.min(end, CUES[i + 1].start - LEAD - GAP);
  return { id: c.id, from: Math.round(start * FPS), to: Math.round(end * FPS), lines: c.lines };
});

export const cue = (id: string): Cue => {
  const c = CUES.find((x) => x.id === id);
  if (!c) throw new Error(`unknown cue ${id}`);
  return c;
};

/** 旁白是否正在进行（用于音乐自动避让），返回 0..1 的平滑值 */
export const narrationPresence = (frame: number): number => {
  const t = frame / FPS;
  let v = 0;
  for (const c of CUES) {
    const a = c.start - 0.35;
    const b = c.end + 0.45;
    if (t >= a && t <= b) {
      const fin = Math.min(1, (t - a) / 0.35);
      const fout = Math.min(1, (b - t) / 0.45);
      v = Math.max(v, Math.min(fin, fout));
    }
  }
  // 句间短停顿不回弹，避免音乐“抽动”
  for (let i = 0; i + 1 < CUES.length; i++) {
    const g0 = CUES[i].end;
    const g1 = CUES[i + 1].start;
    if (g1 - g0 < 1.4 && t > g0 && t < g1) v = 1;
  }
  return v;
};
