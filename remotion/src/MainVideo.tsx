import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { COLORS } from "./theme";
import { Scene1Splash } from "./scenes/Scene1Splash";
import { Scene2Home } from "./scenes/Scene2Home";
import { Scene3Record } from "./scenes/Scene3Record";
import { Scene4Report } from "./scenes/Scene4Report";
import { Scene5Fortune } from "./scenes/Scene5Fortune";
import { Scene6Advice } from "./scenes/Scene6Advice";
import { Scene7Analysis } from "./scenes/Scene7Analysis";
import { Scene8Ending } from "./scenes/Scene8Ending";

const T = (frames: number) =>
  springTiming({ config: { damping: 200 }, durationInFrames: frames });

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.framePad }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={75}>
          <Scene1Splash />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T(18)} />

        <TransitionSeries.Sequence durationInFrames={105}>
          <Scene2Home />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={T(20)}
        />

        <TransitionSeries.Sequence durationInFrames={90}>
          <Scene3Record />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={T(20)}
        />

        <TransitionSeries.Sequence durationInFrames={120}>
          <Scene4Report />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T(20)} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene5Fortune />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={T(20)}
        />

        <TransitionSeries.Sequence durationInFrames={90}>
          <Scene6Advice />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T(18)} />

        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene7Analysis />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T(18)} />

        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene8Ending />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
