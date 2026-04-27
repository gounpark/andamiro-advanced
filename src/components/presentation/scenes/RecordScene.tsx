import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import moodBestWebp from "@/assets/moods/mood-best.webp";
import moodGoodWebp from "@/assets/moods/mood-good.webp";
import moodOkayWebp from "@/assets/moods/mood-okay.webp";
import moodBadWebp from "@/assets/moods/mood-bad.webp";
import moodWorstWebp from "@/assets/moods/mood-worst.webp";
import moodGoodBigWebp from "@/assets/moods/mood-good-big.webp";
import bgGoodWebp from "@/assets/moods/bg-good.webp";
import logoSvg from "@/assets/icons/logo.svg";

interface Props {
  isActive: boolean;
}

const MOODS = [
  { key: "best", label: "최고예요", img: moodBestWebp, color: "#FFCA2D" },
  { key: "good", label: "좋아요", img: moodGoodWebp, color: "#4B82F5" },
  { key: "okay", label: "그냥요", img: moodOkayWebp, color: "#9DA3B4" },
  { key: "bad", label: "별로예요", img: moodBadWebp, color: "#FF7A50" },
  { key: "worst", label: "최악이에요", img: moodWorstWebp, color: "#E05C7A" },
];

export function RecordScene({ isActive }: Props) {
  const [step, setStep] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) {
      setStep(0);
      setSelectedMood(null);
      return;
    }
    // Step 1: screen appears
    const t1 = setTimeout(() => setStep(1), 400);
    // Step 2: moods appear
    const t2 = setTimeout(() => setStep(2), 1200);
    // Step 3: "good" selected
    const t3 = setTimeout(() => {
      setStep(3);
      setSelectedMood("good");
    }, 2800);
    // Step 4: CTA highlighted
    const t4 = setTimeout(() => setStep(4), 4000);

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [isActive]);

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: step >= 3 ? "#eef4ff" : "#f8faff",
        transition: "background 0.6s ease",
      }}
    >
      {/* Background character image */}
      {selectedMood && (
        <img
          src={bgGoodWebp}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: step >= 3 ? 0.25 : 0,
            transition: "opacity 0.6s ease",
          }}
        />
      )}

      {/* Big character */}
      <div
        className="absolute"
        style={{
          right: -20,
          bottom: 120,
          opacity: step >= 3 ? 1 : 0,
          transform: step >= 3 ? "translateX(0)" : "translateX(60px)",
          transition: "all 0.7s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <img
          src={moodGoodBigWebp}
          alt=""
          style={{ height: 280, objectFit: "contain" }}
        />
      </div>

      {/* Status bar */}
      <div
        className="absolute top-0 inset-x-0 flex items-center justify-between px-5"
        style={{ height: 44, zIndex: 10 }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>9:41</span>
      </div>

      {/* Header */}
      <div
        className="absolute inset-x-0 flex items-center px-4"
        style={{
          top: 44,
          height: 52,
          zIndex: 10,
          opacity: step >= 1 ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        <button
          type="button"
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, background: "rgba(0,0,0,0.06)" }}
        >
          <ChevronLeft size={20} color="#333" />
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
          감정 선택
        </span>
      </div>

      {/* Title text */}
      <div
        className="absolute px-6"
        style={{
          top: 110,
          zIndex: 10,
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? "translateY(0)" : "translateY(10px)",
          transition: "all 0.5s ease 0.1s",
        }}
      >
        <p style={{ fontSize: 22, fontWeight: 700, color: "#111", lineHeight: 1.4 }}>
          오늘 기분이
          <br />
          어떠세요?
        </p>
        <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
          지금 가장 가까운 감정을 선택해주세요
        </p>
      </div>

      {/* Mood selector */}
      <div
        className="absolute inset-x-0"
        style={{
          top: 230,
          padding: "0 20px",
          zIndex: 10,
          opacity: step >= 2 ? 1 : 0,
          transform: step >= 2 ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.5s ease",
        }}
      >
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {MOODS.map((mood, i) => {
            const isSelected = selectedMood === mood.key;
            return (
              <div
                key={mood.key}
                className="flex flex-col items-center shrink-0"
                style={{
                  opacity: step >= 2 ? 1 : 0,
                  transform: step >= 2 ? "scale(1)" : "scale(0.5)",
                  transition: `all 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms`,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isSelected ? `${mood.color}22` : "#f2f3f7",
                    border: isSelected ? `2.5px solid ${mood.color}` : "2.5px solid transparent",
                    transition: "all 0.3s ease",
                    boxShadow: isSelected ? `0 0 0 4px ${mood.color}33` : "none",
                  }}
                >
                  <img src={mood.img} alt={mood.label} style={{ width: 40, height: 40, objectFit: "contain" }} />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    marginTop: 5,
                    color: isSelected ? mood.color : "#888",
                    fontWeight: isSelected ? 600 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {mood.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Bottom panel */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          padding: "20px 20px 36px",
          background: "white",
          borderRadius: "28px 28px 0 0",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
          zIndex: 10,
          opacity: step >= 2 ? 1 : 0,
          transform: step >= 2 ? "translateY(0)" : "translateY(40px)",
          transition: "all 0.5s ease 0.2s",
        }}
      >
        <p style={{ fontSize: 13, color: "#888", marginBottom: 12, textAlign: "center" }}>
          {selectedMood ? `'${MOODS.find((m) => m.key === selectedMood)?.label}' 감정으로 기록을 시작할게요` : "감정을 선택하면 기록이 시작됩니다"}
        </p>
        <button
          type="button"
          className="w-full flex items-center justify-center rounded-2xl"
          style={{
            height: 52,
            background: step >= 4 ? "#4B82F5" : selectedMood ? "#4B82F5" : "#e8eaf0",
            color: selectedMood ? "white" : "#bbb",
            fontSize: 16,
            fontWeight: 700,
            transition: "all 0.3s ease",
            boxShadow: step >= 4 ? "0 4px 16px rgba(75,130,245,0.4)" : "none",
            transform: step >= 4 ? "scale(1.02)" : "scale(1)",
          }}
        >
          기록 시작하기
        </button>
      </div>
    </div>
  );
}
