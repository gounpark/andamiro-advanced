import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, FF_KO } from "../theme";

export const Scene5Fortune: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 0-50: 닫힌 쿠키 흔들림 (점점 강해짐)
  // 50-65: 깨짐 (cracked로 전환)
  // 65-100: 결과 등장 + 광선 회전
  // 100-150: 메시지 카드 등장

  const shakeIntensity = interpolate(frame, [0, 50], [0, 30], { extrapolateRight: "clamp" });
  const shakeX = Math.sin(frame * 1.4) * shakeIntensity;
  const shakeR = Math.sin(frame * 1.4) * (shakeIntensity / 3);

  const showCracked = frame >= 50;
  const showResult = frame >= 65;

  const cookieScale = interpolate(frame, [0, 30], [0.5, 1], { extrapolateRight: "clamp" });
  const cookieY = interpolate(frame, [50, 65], [0, -40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const rayRotate = (frame - 65) * 1.5;
  const rayOpacity = interpolate(frame, [65, 90], [0, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rayScale = interpolate(frame, [65, 95], [0.6, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const msgS = spring({ frame: frame - 100, fps, config: { damping: 16 } });

  const titleS = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #FFF8E1 0%, #FFFFFF 100%)", padding: "100px 60px 80px", overflow: "hidden" }}>
      <div style={{ textAlign: "center", opacity: titleS }}>
        <div style={{ fontFamily: FF_KO, fontSize: 36, color: "#A07A1F" }}>오늘의 포춘쿠키</div>
        <div style={{ fontFamily: FF_KO, fontSize: 60, color: COLORS.text, marginTop: 8, letterSpacing: -2 }}>마음을 담은 한마디</div>
      </div>

      {/* 쿠키 영역 */}
      <div style={{ position: "relative", marginTop: 80, height: 600, display: "grid", placeItems: "center" }}>
        {/* 광선 */}
        {showResult && (
          <Img
            src={staticFile("images/fortune-rays.png")}
            style={{
              position: "absolute",
              width: 900,
              height: 900,
              opacity: rayOpacity,
              transform: `rotate(${rayRotate}deg) scale(${rayScale})`,
            }}
          />
        )}
        {/* 쿠키 */}
        {!showCracked && (
          <Img
            src={staticFile("images/fortune-cookie-closed.png")}
            style={{
              position: "absolute",
              width: 480,
              height: 480,
              objectFit: "contain",
              transform: `translate(${shakeX}px, 0) rotate(${shakeR}deg) scale(${cookieScale})`,
            }}
          />
        )}
        {showCracked && !showResult && (
          <Img
            src={staticFile("images/fortune-cookie-cracked.png")}
            style={{
              position: "absolute",
              width: 520,
              height: 520,
              objectFit: "contain",
              transform: `translateY(${cookieY}px)`,
            }}
          />
        )}
        {showResult && (
          <Img
            src={staticFile("images/fortune-cookie-result.png")}
            style={{
              position: "absolute",
              width: 540,
              height: 540,
              objectFit: "contain",
              transform: `translateY(${cookieY}px)`,
            }}
          />
        )}
      </div>

      {/* 메시지 */}
      <div style={{
        marginTop: 40,
        background: "white",
        borderRadius: 32,
        padding: "44px 40px",
        opacity: msgS,
        transform: `translateY(${interpolate(msgS, [0, 1], [40, 0])}px)`,
        boxShadow: "0 12px 40px -12px rgba(0,0,0,0.1)",
        border: `2px solid ${COLORS.cloverYellow}`,
      }}>
        <div style={{ fontFamily: FF_KO, fontSize: 30, color: COLORS.cloverYellow, textAlign: "center" }}>✦ 오늘의 메시지 ✦</div>
        <div style={{ fontFamily: FF_KO, fontSize: 44, color: COLORS.text, marginTop: 18, lineHeight: 1.5, textAlign: "center", letterSpacing: -1 }}>
          작은 발걸음이 모여<br/>큰 행복으로 이어집니다.
        </div>
      </div>
    </AbsoluteFill>
  );
};
