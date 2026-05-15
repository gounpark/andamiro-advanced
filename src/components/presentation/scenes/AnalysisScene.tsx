import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import iconAiBookSvg from "@/assets/analysis/icon-ai-book.svg";
import moodGoodWebp from "@/assets/moods/mood-good.webp";

interface Props {
  isActive: boolean;
}

const METRICS = [
  { label: "에너지", value: 87, color: "#4B82F5" },
  { label: "안정감", value: 78, color: "#11A858" },
  { label: "집중도", value: 81, color: "#FFCA2D" },
  { label: "긍정도", value: 74, color: "#FF7A50" },
];

const SCORE = 82;
const CIRCUMFERENCE = 2 * Math.PI * 60;

export function AnalysisScene({ isActive }: Props) {
  const [step, setStep] = useState(0);
  const [gaugeValue, setGaugeValue] = useState(0);
  const [barValues, setBarValues] = useState([0, 0, 0, 0]);

  useEffect(() => {
    if (!isActive) {
      setStep(0);
      setGaugeValue(0);
      setBarValues([0, 0, 0, 0]);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => {
      setStep(2);
      // Animate gauge
      let v = 0;
      const interval = setInterval(() => {
        v += 2;
        if (v >= SCORE) {
          v = SCORE;
          clearInterval(interval);
        }
        setGaugeValue(v);
      }, 16);
    }, 1000);
    const t3 = setTimeout(() => {
      setStep(3);
      setBarValues(METRICS.map((m) => m.value));
    }, 2200);
    const t4 = setTimeout(() => setStep(4), 3400);

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [isActive]);

  const dashOffset = CIRCUMFERENCE - (gaugeValue / 100) * CIRCUMFERENCE * 0.75;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#f5f6f8" }}>
      {/* Status bar */}
      <div
        className="flex items-center justify-between px-5"
        style={{ height: 44, background: "white" }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>9:41</span>
      </div>

      {/* Header */}
      <div
        className="flex items-center px-4 py-3 bg-white shrink-0"
        style={{ borderBottom: "1px solid #f0f0f0" }}
      >
        <button
          type="button"
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color="#444" />
        </button>
        <span
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 16,
            fontWeight: 700,
            color: "#111",
          }}
        >
          오늘의 분석
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-hidden flex flex-col gap-3 px-4 py-4">
        {/* Score card */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{
            opacity: step >= 1 ? 1 : 0,
            transform: step >= 1 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.5s ease",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <img
              src={moodGoodWebp}
              alt=""
              style={{ width: 28, height: 28, objectFit: "contain" }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>좋아요 · 4월 14일</span>
          </div>

          {/* Semi-circle gauge */}
          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: 160, height: 90 }}>
              <svg width="160" height="90" viewBox="0 0 160 90">
                {/* Background arc */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#f0f0f0"
                  strokeWidth="10"
                  strokeDasharray={`${CIRCUMFERENCE * 0.75} ${CIRCUMFERENCE * 0.25}`}
                  strokeDashoffset={CIRCUMFERENCE * 0.125}
                  transform="rotate(135 80 80)"
                  strokeLinecap="round"
                />
                {/* Foreground arc */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#4B82F5"
                  strokeWidth="10"
                  strokeDasharray={`${CIRCUMFERENCE * 0.75 - dashOffset + CIRCUMFERENCE - (gaugeValue / 100) * CIRCUMFERENCE * 0.75} 1000`}
                  strokeDashoffset={CIRCUMFERENCE * 0.125}
                  transform="rotate(135 80 80)"
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 0.05s linear" }}
                />
              </svg>
              <div
                className="absolute flex flex-col items-center"
                style={{ bottom: 0, left: "50%", transform: "translateX(-50%)" }}
              >
                <span style={{ fontSize: 32, fontWeight: 800, color: "#111", lineHeight: 1 }}>
                  {gaugeValue}
                </span>
                <span style={{ fontSize: 11, color: "#888", marginTop: 2 }}>/ 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{
            opacity: step >= 3 ? 1 : 0,
            transform: step >= 3 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.5s ease 0.1s",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 14 }}>
            세부 지표
          </p>
          <div className="flex flex-col gap-3">
            {METRICS.map((m, i) => (
              <div key={m.label}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 12, color: "#666" }}>{m.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>
                    {barValues[i]}
                  </span>
                </div>
                <div
                  style={{ height: 7, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barValues[i]}%`,
                      background: `linear-gradient(90deg, ${m.color}99, ${m.color})`,
                      borderRadius: 4,
                      transition: `width 0.8s cubic-bezier(0.34,1.56,0.64,1) ${i * 100}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Summary */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{
            opacity: step >= 4 ? 1 : 0,
            transform: step >= 4 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.5s ease 0.2s",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <img src={iconAiBookSvg} alt="" style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>AI 요약</span>
          </div>
          <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
            오늘은 소중한 사람과의 재회로 감정이 충전된 하루였어요. 에너지 지수가 높고 전반적으로
            긍정적인 상태입니다. 이런 날을 더 자주 만들어 보세요 🍀
          </p>
        </div>
      </div>
    </div>
  );
}
