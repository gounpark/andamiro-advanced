import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FF_KO } from "../theme";

export const Scene1Splash: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18 } });
  const scale = interpolate(s, [0, 1], [0.85, 1]);
  const opacity = interpolate(frame, [0, 12, 60, 75], [0, 1, 1, 0.95]);
  return (
    <AbsoluteFill style={{ background: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <Img src={staticFile("images/logo.svg")} style={{ width: 360, height: 360 }} />
        <div style={{ fontFamily: FF_KO, fontSize: 96, color: COLORS.primary, letterSpacing: -2 }}>
          안다미로
        </div>
        <div style={{ fontFamily: FF_KO, fontSize: 36, color: COLORS.subtext, marginTop: -10 }}>
          마음에 가득, 넘치도록
        </div>
      </div>
    </AbsoluteFill>
  );
};
