import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, FF_KO, FF_LATIN } from "../theme";

const TAGS = ["산책", "감사", "휴식", "회복"];

export const Scene6Advice: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleS = spring({ frame, fps, config: { damping: 20 } });
  const scoreS = spring({ frame: frame - 12, fps, config: { damping: 16 } });
  const score = Math.round(interpolate(scoreS, [0, 1], [0, 80]));
  const bubbleS = spring({ frame: frame - 50, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, padding: "120px 60px 80px" }}>
      <div style={{ fontFamily: FF_KO, fontSize: 38, color: COLORS.subtext, opacity: titleS }}>
        오늘의 조언
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
        당신을 위한 한마디
      </div>

      {/* 점수 + 태그 */}
      <div
        style={{
          marginTop: 60,
          background: "#F7F7F9",
          borderRadius: 32,
          padding: "44px 40px",
          opacity: scoreS,
          transform: `translateY(${interpolate(scoreS, [0, 1], [30, 0])}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <div
            style={{
              fontFamily: FF_LATIN,
              fontSize: 120,
              fontWeight: 700,
              color: COLORS.primary,
              lineHeight: 1,
              letterSpacing: -4,
            }}
          >
            {score}
          </div>
          <div style={{ fontFamily: FF_LATIN, fontSize: 40, color: COLORS.subtext }}>점</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 26 }}>
          {TAGS.map((t, i) => {
            const ts = spring({ frame: frame - (24 + i * 5), fps, config: { damping: 14 } });
            return (
              <div
                key={t}
                style={{
                  fontFamily: FF_KO,
                  fontSize: 28,
                  color: COLORS.primary,
                  background: "#EAF1FF",
                  padding: "14px 28px",
                  borderRadius: 100,
                  opacity: ts,
                  transform: `scale(${interpolate(ts, [0, 1], [0.6, 1])})`,
                }}
              >
                #{t}
              </div>
            );
          })}
        </div>
      </div>

      {/* 채팅 말풍선 */}
      <div
        style={{
          marginTop: 40,
          opacity: bubbleS,
          transform: `translateY(${interpolate(bubbleS, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            background: COLORS.primary,
            color: "white",
            borderRadius: "32px 32px 8px 32px",
            padding: "36px 36px",
            fontFamily: FF_KO,
            fontSize: 40,
            lineHeight: 1.5,
            letterSpacing: -1,
            maxWidth: 820,
            marginLeft: "auto",
            boxShadow: "0 12px 40px -16px rgba(59,111,255,0.45)",
          }}
        >
          오늘의 산책 좋았어요. 내일도 10분만 걸어볼까요? 작은 루틴이 마음을 단단하게 해줘요.
        </div>
      </div>
    </AbsoluteFill>
  );
};
