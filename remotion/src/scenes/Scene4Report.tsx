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
import { COLORS, FF_KO, FF_LATIN } from "../theme";

export const Scene4Report: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame, fps, config: { damping: 20 } });
  const cardS = spring({ frame: frame - 18, fps, config: { damping: 18 } });
  const score = Math.round(
    interpolate(frame, [25, 70], [0, 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );

  const ctaS = spring({ frame: frame - 70, fps, config: { damping: 14 } });
  const pulse = 1 + Math.sin(frame / 4) * 0.025;

  return (
    <AbsoluteFill style={{ background: COLORS.bg, padding: "120px 60px 80px" }}>
      <div style={{ fontFamily: FF_KO, fontSize: 38, color: COLORS.subtext, opacity: titleS }}>
        오늘의 리포트
      </div>
      <div
        style={{
          fontFamily: FF_KO,
          fontSize: 64,
          color: COLORS.text,
          marginTop: 8,
          opacity: titleS,
          letterSpacing: -2,
        }}
      >
        마음 점수
      </div>

      {/* 점수 카드 */}
      <div
        style={{
          marginTop: 60,
          background: COLORS.skyGradient,
          borderRadius: 40,
          padding: "70px 50px",
          color: "white",
          opacity: cardS,
          transform: `translateY(${interpolate(cardS, [0, 1], [40, 0])}px)`,
          boxShadow: "0 20px 60px -20px rgba(59,111,255,0.4)",
        }}
      >
        <div style={{ fontFamily: FF_KO, fontSize: 32, opacity: 0.9 }}>오늘의 점수</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 16 }}>
          <div
            style={{
              fontFamily: FF_LATIN,
              fontSize: 220,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -8,
            }}
          >
            {score}
          </div>
          <div style={{ fontFamily: FF_LATIN, fontSize: 60, opacity: 0.8 }}>/ 100</div>
        </div>
        <div style={{ fontFamily: FF_KO, fontSize: 32, marginTop: 24, opacity: 0.95 }}>
          오늘 하루 잘 보내셨네요
        </div>
      </div>

      {/* 포춘쿠키 CTA */}
      <div
        style={{
          marginTop: 80,
          background: "#FFF8E1",
          borderRadius: 36,
          padding: "50px 40px",
          display: "flex",
          alignItems: "center",
          gap: 36,
          opacity: ctaS,
          transform: `translateY(${interpolate(ctaS, [0, 1], [30, 0])}px) scale(${pulse})`,
          border: `3px solid ${COLORS.cloverYellow}`,
        }}
      >
        <Img
          src={staticFile("images/fortune-cookie-closed.png")}
          style={{ width: 180, height: 180, objectFit: "contain" }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FF_KO, fontSize: 32, color: "#A07A1F" }}>오늘의 포춘쿠키</div>
          <div
            style={{
              fontFamily: FF_KO,
              fontSize: 44,
              color: COLORS.text,
              marginTop: 8,
              letterSpacing: -1,
            }}
          >
            탭해서 열어보세요 ›
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
