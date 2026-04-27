import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 시퀀스 합 750f - 트랜지션 7×19=133f 겹침 = 617f
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={617}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
