import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, FF_KO, FF_LATIN } from "../theme";

export const Scene7Analysis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleS = spring({ frame, fps, config: { damping: 20 } });
  // 게이지 0 -> 80%
  const pct = interpolate(frame, [10, 50], [0, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 반원 게이지: SVG arc
  const R = 380;
  const C = Math.PI * R; // 반원 둘레
  const dash = C * pct;

  return (
    <AbsoluteFill style={{ background: COLORS.bg, padding: "140px 60px 80px" }}>
      <div style={{ fontFamily: FF_KO, fontSize: 38, color: COLORS.subtext, opacity: titleS }}>이번 주 분석</div>
      <div style={{ fontFamily: FF_KO, fontSize: 64, color: COLORS.text, marginTop: 8, opacity: titleS, letterSpacing: -2 }}>마음 회복력</div>

      <div style={{ marginTop: 100, display: "grid", placeItems: "center" }}>
        <svg width={900} height={500} viewBox="0 0 900 500">
          {/* 트랙 */}
          <path d={`M 70 450 A ${R} ${R} 0 0 1 830 450`} stroke="#F0F0F0" strokeWidth={50} fill="none" strokeLinecap="round" />
          {/* 채워진 게이지 */}
          <path
            d={`M 70 450 A ${R} ${R} 0 0 1 830 450`}
            stroke={COLORS.primary}
            strokeWidth={50}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
          />
          <text x={450} y={400} textAnchor="middle" fontFamily={FF_LATIN} fontSize={180} fontWeight={700} fill={COLORS.text} letterSpacing={-4}>
            {Math.round(pct * 100)}
          </text>
          <text x={450} y={460} textAnchor="middle" fontFamily={FF_KO} fontSize={36} fill={COLORS.subtext}>
            매우 좋음
          </text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};
