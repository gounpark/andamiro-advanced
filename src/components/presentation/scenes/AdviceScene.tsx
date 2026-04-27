import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import moodGoodWebp from "@/assets/moods/mood-good.webp";
import fortuneCookieIconSvg from "@/assets/advice/fortune-cookie-icon.svg";
import tabHomeActiveSvg from "@/assets/icons/tab-home-active.svg";
import tabReportSvg from "@/assets/icons/tab-report.svg";
import tabAdviceActiveSvg from "@/assets/icons/tab-advice-active.svg";
import tabMySvg from "@/assets/icons/tab-my.svg";

interface Props {
  isActive: boolean;
}

const TAGS = ["#안정", "#집중", "#균형", "#회복"];

export function AdviceScene({ isActive }: Props) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setStep(0);
      setScore(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => {
      setStep(2);
      let v = 0;
      const interval = setInterval(() => {
        v += 2;
        if (v >= 80) { v = 80; clearInterval(interval); }
        setScore(v);
      }, 18);
    }, 1000);
    const t3 = setTimeout(() => setStep(3), 2400);
    const t4 = setTimeout(() => setStep(4), 3600);

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [isActive]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5" style={{ height: 44 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>9:41</span>
      </div>

      {/* Header */}
      <div
        className="flex items-center px-4 pb-3 shrink-0"
        style={{ borderBottom: "1px solid #f0f0f0" }}
      >
        <button type="button" style={{ width: 32, height: 32, display: "flex", alignItems: "center" }}>
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
          오늘의 조언
        </span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col gap-4 px-5 py-5">
        {/* Score card */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, #eef4ff 0%, #f5f8ff 100%)",
            border: "1px solid #dde8ff",
            opacity: step >= 1 ? 1 : 0,
            transform: step >= 1 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.5s ease",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>오늘의 감정 점수</p>
              <div className="flex items-end gap-1">
                <span style={{ fontSize: 44, fontWeight: 800, color: "#4B82F5", lineHeight: 1 }}>
                  {score}
                </span>
                <span style={{ fontSize: 16, color: "#888", marginBottom: 4 }}>점</span>
              </div>
            </div>
            <img src={moodGoodWebp} alt="" style={{ width: 64, height: 64, objectFit: "contain" }} />
          </div>

          {/* Tags */}
          <div
            className="flex flex-wrap gap-2 mt-3"
            style={{
              opacity: step >= 3 ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
          >
            {TAGS.map((tag, i) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1"
                style={{
                  background: "white",
                  border: "1px solid #c8d9ff",
                  fontSize: 12,
                  color: "#4B82F5",
                  fontWeight: 500,
                  opacity: step >= 3 ? 1 : 0,
                  transform: step >= 3 ? "scale(1)" : "scale(0.8)",
                  transition: `all 0.4s ease ${i * 80}ms`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* AI advice */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#fff",
            border: "1px solid #f0f0f0",
            opacity: step >= 3 ? 1 : 0,
            transform: step >= 3 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.5s ease 0.15s",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 }}>AI의 한마디</p>
          <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
            오늘 좋은 에너지로 하루를 보냈네요. 소중한 관계에서 충전된 에너지가 내일도 이어지길 바랍니다. 오늘 하루 정말 수고하셨어요 🌿
          </p>
        </div>

        {/* Fortune cookie banner */}
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, #1a2f6e 0%, #2a4a9e 100%)",
            opacity: step >= 4 ? 1 : 0,
            transform: step >= 4 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.5s ease 0.2s",
          }}
        >
          <img src={fortuneCookieIconSvg} alt="" style={{ width: 40, height: 40, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "white" }}>오늘의 포춘쿠키</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              오늘 하루의 행운 메시지가 기다려요 →
            </p>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div
        className="shrink-0 flex items-center justify-around bg-white"
        style={{ height: 64, borderTop: "1px solid #f0f0f0", paddingBottom: 8 }}
      >
        <img src={tabHomeActiveSvg} alt="" style={{ height: 24, opacity: 0.35 }} />
        <img src={tabReportSvg} alt="" style={{ height: 24, opacity: 0.35 }} />
        <img src={tabAdviceActiveSvg} alt="" style={{ height: 24 }} />
        <img src={tabMySvg} alt="" style={{ height: 24, opacity: 0.35 }} />
      </div>
    </div>
  );
}
