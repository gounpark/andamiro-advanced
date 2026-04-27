import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, FF_KO } from "../theme";

const moods = [
  { src: "images/mood-best-big.webp", label: "최고" },
  { src: "images/mood-good-big.webp", label: "좋음" },
  { src: "images/mood-okay-big.webp", label: "보통" },
  { src: "images/mood-bad-big.webp", label: "별로" },
  { src: "images/mood-worst-big.webp", label: "최악" },
];

const SELECTED = 1; // 좋음

export const Scene3Record: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame, fps, config: { damping: 20 } });
  const selectS = spring({ frame: frame - 35, fps, config: { damping: 12 } });

  const text = "오늘은 산책하면서 마음이 한결 가벼워졌어. 작은 행복이 모이는 하루.";
  const charsToShow = Math.floor(interpolate(frame, [45, 88], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill style={{ background: COLORS.bg, padding: "120px 60px 80px" }}>
      <div style={{ fontFamily: FF_KO, fontSize: 38, color: COLORS.subtext, opacity: titleS }}>오늘의 기분</div>
      <div style={{ fontFamily: FF_KO, fontSize: 64, color: COLORS.text, marginTop: 12, opacity: titleS, transform: `translateY(${interpolate(titleS, [0, 1], [20, 0])}px)`, letterSpacing: -2 }}>
        오늘 하루 어땠나요?
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 80, gap: 16 }}>
        {moods.map((m, i) => {
          const itemS = spring({ frame: frame - (15 + i * 4), fps, config: { damping: 14 } });
          const selected = i === SELECTED;
          const selScale = selected ? interpolate(selectS, [0, 1], [1, 1.18]) : 1;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: itemS, transform: `translateY(${interpolate(itemS, [0, 1], [20, 0])}px) scale(${selScale})` }}>
              <div style={{ width: 150, height: 150, borderRadius: 80, background: selected ? "#EAF1FF" : "transparent", display: "grid", placeItems: "center", border: selected ? `4px solid ${COLORS.primary}` : "none" }}>
                <Img src={staticFile(m.src)} style={{ width: 130, height: 130 }} />
              </div>
              <div style={{ fontFamily: FF_KO, fontSize: 28, color: selected ? COLORS.primary : COLORS.subtext, fontWeight: selected ? 700 : 400 }}>{m.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 90, background: "#F7F7F9", borderRadius: 28, padding: "44px 36px", minHeight: 360 }}>
        <div style={{ fontFamily: FF_KO, fontSize: 30, color: COLORS.subtext, marginBottom: 22 }}>오늘의 기록</div>
        <div style={{ fontFamily: FF_KO, fontSize: 44, color: COLORS.text, lineHeight: 1.55, letterSpacing: -1 }}>
          {text.slice(0, charsToShow)}
          <span style={{ opacity: Math.floor(frame / 4) % 2 === 0 ? 1 : 0, color: COLORS.primary }}>|</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
