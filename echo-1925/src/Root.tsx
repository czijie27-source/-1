import React from "react";
import { Composition, Still } from "remotion";
import { Cover } from "./scenes/Cover";
import { FPS, SCENES, TOTAL_FRAMES } from "./data/timeline";
import { Echo1925, ScenePreview } from "./Video";
import { H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Echo1925" component={Echo1925} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{ subtitles: true, audio: true }} />
    {SCENES.map((s, i) => (
      <Composition
        key={s.id}
        id={`Scene${i + 1}-${s.id}`}
        component={ScenePreview}
        durationInFrames={s.frames}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ scene: s.id, subtitles: true }}
      />
    ))}
    <Still id="Cover" component={Cover} width={W} height={H} />
  </>
);
