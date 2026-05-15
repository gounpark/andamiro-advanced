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

export const Scene8Ending: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = spring({ frame, fps, config: { damping: 16 } });
  const textS = spring({ frame: frame - 18, fps, config: { damping: 18 } });
  const subS = spring({ frame: frame - 30, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill
      style={{ background: COLORS.skyGradient, alignItems: "center", justifyContent: "center" }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        <Img
          src={staticFile("images/logo.svg")}
          style={{
            width: 280,
            height: 280,
            opacity: logoS,
            transform: `scale(${interpolate(logoS, [0, 1], [0.7, 1])})`,
            filter: "brightness(0) invert(1)",
          }}
        />
        <div
          style={{
            fontFamily: FF_KO,
            fontSize: 110,
            color: "white",
            letterSpacing: -3,
            opacity: textS,
            transform: `translateY(${interpolate(textS, [0, 1], [20, 0])}px)`,
          }}
        >
          안다미로
        </div>
        <div
          style={{
            fontFamily: FF_KO,
            fontSize: 44,
            color: "white",
            opacity: subS * 0.95,
            transform: `translateY(${interpolate(subS, [0, 1], [20, 0])}px)`,
            marginTop: -10,
          }}
        >
          오늘도 안다미로
        </div>
      </div>
    </AbsoluteFill>
  );
};
