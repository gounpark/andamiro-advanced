import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, FF_KO, FF_LATIN } from "../theme";

const Day: React.FC<{ n: number; filled: "active" | "special" | "empty"; delay: number }> = ({ n, filled, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  const src = filled === "active" ? "images/clover-active.svg" : filled === "special" ? "images/clover-special.svg" : "images/clover-empty.svg";
  return (
    <div style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, opacity: s }}>
      <Img src={staticFile(src)} style={{ width: 88, height: 88, transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})` }} />
      <div style={{ fontFamily: FF_LATIN, fontSize: 22, color: COLORS.subtext }}>{n}</div>
    </div>
  );
};

export const Scene2Home: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerS = spring({ frame, fps, config: { damping: 20 } });
  const headerY = interpolate(headerS, [0, 1], [-30, 0]);

  const days: Array<"active" | "special" | "empty"> = [
    "active", "active", "empty", "active", "special", "active", "empty",
    "active", "empty", "active", "active", "active", "special", "empty",
    "empty", "active", "active", "empty", "active", "active", "special",
    "active", "active", "empty", "active", "empty", "active", "active",
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* 헤더 그라데이션 */}
      <div style={{ background: COLORS.skyGradient, padding: "120px 60px 80px", color: "white", transform: `translateY(${headerY}px)`, opacity: headerS }}>
        <div style={{ fontFamily: FF_KO, fontSize: 36, opacity: 0.9 }}>오늘의 클로버</div>
        <div style={{ fontFamily: FF_KO, fontSize: 78, fontWeight: 400, marginTop: 12, letterSpacing: -2 }}>안다미로</div>
        <div style={{ fontFamily: FF_KO, fontSize: 32, opacity: 0.85, marginTop: 16 }}>11월 · 28개의 기록</div>
      </div>
      {/* 캘린더 카드 */}
      <div style={{ margin: "-40px 50px 0", background: "white", borderRadius: 36, padding: "50px 40px", boxShadow: "0 12px 40px -12px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
          {days.map((f, i) => (
            <Day key={i} n={i + 1} filled={f} delay={20 + i * 1.2} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
