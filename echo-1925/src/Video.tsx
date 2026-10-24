import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { DocumentarySubtitle } from "./components/DocumentarySubtitle";
import { FilmGrain } from "./components/FilmGrain";
import { narrationPresence } from "./data/narration";
import { SCENES, SceneId, TOTAL_FRAMES } from "./data/timeline";
import { ensureFonts } from "./fonts";
import { AwakeningScene } from "./scenes/AwakeningScene";
import { EndingScene } from "./scenes/EndingScene";
import { MiningLifeScene } from "./scenes/MiningLifeScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { PersistenceScene } from "./scenes/PersistenceScene";
import { SolidarityScene } from "./scenes/SolidarityScene";
import { SpiritScene } from "./scenes/SpiritScene";
import { StrikeScene } from "./scenes/StrikeScene";

ensureFonts();

export const SCENE_COMPONENTS: Record<SceneId, React.FC> = {
  opening: OpeningScene,
  "mining-life": MiningLifeScene,
  awakening: AwakeningScene,
  strike: StrikeScene,
  solidarity: SolidarityScene,
  persistence: PersistenceScene,
  spirit: SpiritScene,
  ending: EndingScene,
};

export type VideoProps = {
  subtitles: boolean;
  audio: boolean;
};

/** 音乐音量包络：旁白出现时自动降低（ducking），首尾淡入淡出 */
const musicVolume = (f: number) => {
  const duck = narrationPresence(f);
  const base = 0.95 - duck * 0.55;
  const fadeIn = Math.min(1, f / 45);
  const fadeOut = Math.min(1, (TOTAL_FRAMES - f) / 75);
  return base * fadeIn * fadeOut;
};

const sfxVolume = (f: number) => {
  const duck = narrationPresence(f);
  return (0.9 - duck * 0.3) * Math.min(1, (TOTAL_FRAMES - f) / 60);
};

export const Echo1925: React.FC<VideoProps> = ({ subtitles, audio }) => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SCENES.map((s) => {
        const Comp = SCENE_COMPONENTS[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.frames} name={s.title}>
            <Comp />
          </Sequence>
        );
      })}
      <FilmGrain intensity={0.9} />
      {subtitles && <DocumentarySubtitle />}
      {audio && (
        <>
          <Audio src={staticFile("audio/narration.wav")} volume={1} name="旁白" />
          <Audio src={staticFile("audio/music.wav")} volume={musicVolume} name="配乐" />
          <Audio src={staticFile("audio/sfx.wav")} volume={sfxVolume} name="音效" />
        </>
      )}
    </AbsoluteFill>
  );
};

/** 单独预览某一场景（带胶片质感与字幕），便于在 Studio 中逐场检查 */
export type ScenePreviewProps = { scene: SceneId; subtitles: boolean };

export const ScenePreview: React.FC<ScenePreviewProps> = ({ scene, subtitles }) => {
  const s = SCENES.find((x) => x.id === scene)!;
  const Comp = SCENE_COMPONENTS[scene];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Comp />
      <FilmGrain intensity={0.9} />
      {subtitles && (
        <Sequence from={-s.from} layout="none">
          <SubtitleAt />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const SubtitleAt: React.FC = () => {
  useCurrentFrame();
  return <DocumentarySubtitle />;
};
