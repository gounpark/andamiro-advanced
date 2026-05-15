import { useEffect, useState } from "react";
import logoSvg from "@/assets/icons/logo.svg";
import tabHomeActiveSvg from "@/assets/icons/tab-home-active.svg";
import tabReportActiveSvg from "@/assets/icons/tab-report-active.svg";
import tabAdviceSvg from "@/assets/icons/tab-advice.svg";
import tabMySvg from "@/assets/icons/tab-my.svg";
import aiBookOpenSvg from "@/assets/report/ai-book-open.svg";

interface Props {
  isActive: boolean;
}

const BAR_DATA = [
  { day: "월", value: 72, color: "#4B82F5" },
  { day: "화", value: 85, color: "#4B82F5" },
  { day: "수", value: 68, color: "#4B82F5" },
  { day: "목", value: 90, color: "#4B82F5" },
  { day: "금", value: 82, color: "#4B82F5" },
  { day: "토", value: 78, color: "#4B82F5" },
  { day: "일", value: 65, color: "#4B82F5" },
];

const BUBBLES = [
  { label: "설렘", size: 72, color: "#4B82F5", x: 30, y: 25 },
  { label: "평온함", size: 64, color: "#11A858", x: 62, y: 15 },
  { label: "활기참", size: 56, color: "#FFCA2D", x: 20, y: 55 },
  { label: "집중", size: 48, color: "#FF7A50", x: 58, y: 52 },
  { label: "감사", size: 44, color: "#9B59B6", x: 80, y: 32 },
];

export function ReportScene({ isActive }: Props) {
  const [step, setStep] = useState(0);
  const [barHeights, setBarHeights] = useState(BAR_DATA.map(() => 0));

  useEffect(() => {
    if (!isActive) {
      setStep(0);
      setBarHeights(BAR_DATA.map(() => 0));
      return;
    }
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => {
      setStep(2);
      BAR_DATA.forEach((_, i) => {
        setTimeout(() => {
          setBarHeights((prev) => {
            const next = [...prev];
            next[i] = BAR_DATA[i].value;
            return next;
          });
        }, i * 80);
      });
    }, 1000);
    const t3 = setTimeout(() => setStep(3), 3000);
    const t4 = setTimeout(() => setStep(4), 4200);

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [isActive]);

  const maxBar = Math.max(...BAR_DATA.map((b) => b.value));

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#f5f6f8" }}>
      {/* Blue header */}
      <div
        style={{
          background: "linear-gradient(180deg, #4B82F5 0%, #5e91f8 100%)",
          padding: "44px 20px 20px",
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-2">
          <img src={logoSvg} alt="" style={{ height: 18, filter: "invert(1) brightness(10)" }} />
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 600 }}>
            리포트
          </span>
        </div>
        <p style={{ color: "white", fontSize: 20, fontWeight: 700, marginTop: 8 }}>
          이번 주 감정 흐름
        </p>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>Apr 7 – Apr 13</p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col gap-3 px-4 py-4">
        {/* Bar chart */}
        <div
          className="bg-white rounded-2xl p-4"
          style={{
            opacity: step >= 1 ? 1 : 0,
            transform: step >= 1 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.5s ease",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16 }}>
            에너지 지수
          </p>
          <div className="flex items-end gap-2 justify-between" style={{ height: 80 }}>
            {BAR_DATA.map((bar, i) => (
              <div key={bar.day} className="flex flex-col items-center gap-1 flex-1">
                <div
                  style={{
                    height: (barHeights[i] / maxBar) * 60,
                    background: `linear-gradient(180deg, ${bar.color} 0%, ${bar.color}99 100%)`,
                    borderRadius: "4px 4px 2px 2px",
                    width: "100%",
                    transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1) ${i * 80}ms`,
                    minHeight: barHeights[i] > 0 ? 4 : 0,
                  }}
                />
                <span style={{ fontSize: 10, color: "#999" }}>{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bubble cluster */}
        <div
          className="bg-white rounded-2xl p-4"
          style={{
            opacity: step >= 3 ? 1 : 0,
            transform: step >= 3 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.5s ease 0.1s",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 12 }}>
            자주 느낀 감정
          </p>
          <div className="relative" style={{ height: 120 }}>
            {BUBBLES.map((b, i) => (
              <div
                key={b.label}
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  width: b.size,
                  height: b.size,
                  background: `${b.color}22`,
                  border: `2px solid ${b.color}55`,
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: step >= 3 ? 1 : 0,
                  scale: step >= 3 ? "1" : "0.3",
                  transition: `all 0.6s cubic-bezier(0.34,1.56,0.64,1) ${i * 100}ms`,
                }}
              >
                <span
                  style={{ fontSize: 11, color: b.color, fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Insight */}
        <div
          className="bg-white rounded-2xl p-4"
          style={{
            opacity: step >= 4 ? 1 : 0,
            transform: step >= 4 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.5s ease 0.2s",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <img src={aiBookOpenSvg} alt="" style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>AI 인사이트</span>
          </div>
          <p style={{ fontSize: 12, color: "#666", lineHeight: 1.65 }}>
            이번 주 목요일 에너지가 가장 높았어요. 긍정적인 감정이 전체의 73%를 차지했습니다. 설렘과
            평온함이 주 감정이네요 🌿
          </p>
        </div>
      </div>

      {/* Bottom nav */}
      <div
        className="shrink-0 flex items-center justify-around bg-white"
        style={{ height: 64, borderTop: "1px solid #f0f0f0", paddingBottom: 8 }}
      >
        <img src={tabHomeActiveSvg} alt="" style={{ height: 24, opacity: 0.35 }} />
        <img src={tabReportActiveSvg} alt="" style={{ height: 24 }} />
        <img src={tabAdviceSvg} alt="" style={{ height: 24, opacity: 0.35 }} />
        <img src={tabMySvg} alt="" style={{ height: 24, opacity: 0.35 }} />
      </div>
    </div>
  );
}
