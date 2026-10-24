import script from "./script.json";
import beatsJson from "./beats.json";

export const FPS = script.fps;
export const TOTAL_FRAMES = Math.round(script.durationSeconds * FPS);

export type SceneId =
  | "opening" | "mining-life" | "awakening" | "strike"
  | "solidarity" | "persistence" | "spirit" | "ending";

export interface SceneInfo {
  id: SceneId;
  title: string;
  start: number; // 秒
  duration: number; // 秒
  from: number; // 帧
  frames: number; // 帧
}

export const SCENES: SceneInfo[] = script.scenes.map((s) => ({
  id: s.id as SceneId,
  title: s.title,
  start: s.start,
  duration: s.duration,
  from: Math.round(s.start * FPS),
  frames: Math.round(s.duration * FPS),
}));

export const sceneById = (id: SceneId): SceneInfo => {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown scene ${id}`);
  return s;
};

/** 关键节点（绝对秒），与音乐 / 音效脚本共用 src/data/beats.json */
export const BEATS = beatsJson as unknown as {
  opening: Record<"lightPoint" | "lampClink" | "beamSweep" | "tunnelReveal" | "titleIn" | "titleOut", number>;
  miningLife: Record<"headframe" | "infoCardIn" | "infoCardOut" | "cart" | "workers" | "details" | "crosscut", number>;
  awakening: Record<"dateCard" | "bell1" | "bell2" | "map" | "newspapers" | "crowd" | "silenceText", number>;
  strike: Record<"blackout" | "date" | "whistle" | "boiler" | "flywheel" | "flywheelStop" | "cart" | "cartStop" | "lamps" | "walkout" | "crowd" | "title", number>;
  solidarity: Record<"street" | "procession" | "document" | "river", number>;
  persistence: Record<"nightSchool" | "mutualAid" | "winter" | "contract" | "resumption" | "victory", number>;
  spirit: Record<"archive" | "beams" | "slogan" | "unity" | "struggle" | "patriotism", number>;
  ending: Record<"lamp" | "modern" | "youth" | "finalLamp" | "finalTitle" | "finalSlogan" | "credit" | "fadeOut", number>;
};

export const sec = (s: number) => Math.round(s * FPS);
