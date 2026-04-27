import { useEffect, useState } from "react";
import logoSvg from "@/assets/icons/logo.svg";
import cloverActiveSvg from "@/assets/icons/clover-active.svg";
import cloverSpecialSvg from "@/assets/icons/clover-special.svg";
import cloverEmptySvg from "@/assets/icons/clover-empty.svg";
import bgShapeLargeSvg from "@/assets/icons/bg-shape-large.svg";
import tabHomeActiveSvg from "@/assets/icons/tab-home-active.svg";
import tabReportSvg from "@/assets/icons/tab-report.svg";
import tabAdviceSvg from "@/assets/icons/tab-advice.svg";
import tabMySvg from "@/assets/icons/tab-my.svg";
import splashWebp from "@/assets/splash.webp";
import moodGoodWebp from "@/assets/moods/mood-good.webp";

interface Props {
  isActive: boolean;
}

// April 2026 starts on Wednesday (index 3 in Sun-based week)
const APRIL_START_DOW = 3;
const APRIL_DAYS = 30;
const TODAY = 21;
const RECORDED = new Set([3, 5, 8, 11, 14, 17, 19, 21]);

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export function HomeScene({ isActive }: Props) {
  const [step, setStep] = useState(0);
  const [activeClovers, setActiveClovers] = useState<Set<number>>(new Set());
  const [showTap, setShowTap] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setStep(0);
      setActiveClovers(new Set());
      setShowTap(false);
      setShowCard(false);
      return;
    }

    // Step 0 → splash visible
    // Step 1 (800ms): calendar slides in
    const t1 = setTimeout(() => setStep(1), 800);

    // Step 2 (2000ms): clovers pop in sequentially
    const t2 = setTimeout(() => {
      setStep(2);
      const recordedArr = [...RECORDED];
      recordedArr.forEach((day, i) => {
        setTimeout(() => {
          setActiveClovers((prev) => new Set([...prev, day]));
        }, i * 100);
      });
    }, 2000);

    // Step 3 (4000ms): tap indicator on day 14
    const t3 = setTimeout(() => {
      setStep(3);
      setShowTap(true);
    }, 4000);

    // Step 4 (5000ms): card slides up
    const t4 = setTimeout(() => {
      setShowTap(false);
      setShowCard(true);
      setStep(4);
    }, 5000);

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [isActive]);

  // Tap indicator position: day 14 is in the calendar
  // April starts on Wed (DOW 3). Day 14 is at index 3+13=16 (0-based)
  // Row = floor(16/7) = 2, col = 16%7 = 2
  const tapCellIndex = APRIL_START_DOW + 13; // day 14 → 0-based index 16
  const tapRow = Math.floor(tapCellIndex / 7);
  const tapCol = tapCellIndex % 7;

  return (
    <div className="w-full h-full bg-white relative overflow-hidden">
      {/* ── Splash Screen ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-700"
        style={{
          zIndex: step < 1 ? 20 : -1,
          opacity: step < 1 ? 1 : 0,
          pointerEvents: "none",
        }}
      >
        <img src={splashWebp} alt="" style={{ width: 140, height: 140, objectFit: "contain" }} />
        <img
          src={logoSvg}
          alt="안다미로"
          style={{ height: 28, marginTop: 16, opacity: 0.7 }}
        />
      </div>

      {/* ── Main Home Screen ── */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.7s ease",
        }}
      >
        {/* Blue header */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            height: 190,
            background: "linear-gradient(180deg, #4B82F5 0%, #7BA7FF 100%)",
          }}
        >
          <img
            src={bgShapeLargeSvg}
            alt=""
            className="absolute opacity-25"
            style={{ right: -20, top: -20, width: 200 }}
          />
          {/* Status bar */}
          <div
            className="absolute top-0 inset-x-0 flex items-center justify-between px-5"
            style={{ height: 44, paddingTop: 4 }}
          >
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 600 }}>
              9:41
            </span>
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    height: 4 + i * 2,
                    background: "rgba(255,255,255,0.9)",
                    borderRadius: 2,
                  }}
                />
              ))}
              <div style={{ width: 16, height: 8, background: "rgba(255,255,255,0.7)", borderRadius: 3, marginLeft: 4 }} />
            </div>
          </div>

          <div className="absolute px-5" style={{ top: 52 }}>
            <div className="flex items-center gap-2 mb-2">
              <img
                src={logoSvg}
                alt=""
                style={{ height: 20, filter: "invert(1) brightness(10)" }}
              />
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 600 }}>
                안다미로
              </span>
            </div>
            <p style={{ color: "white", fontSize: 22, fontWeight: 700 }}>4월의 기록</p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }}>
              2026년 4월 · 기록 {RECORDED.size}일
            </p>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 bg-white px-4 pt-4 overflow-hidden relative">
          {/* Weekday header */}
          <div
            className="grid gap-0 mb-2"
            style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
          >
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#aaa", fontWeight: 500 }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div
            className="grid gap-y-2"
            style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
          >
            {/* Leading empty cells */}
            {[...Array(APRIL_START_DOW)].map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {[...Array(APRIL_DAYS)].map((_, i) => {
              const day = i + 1;
              const isToday = day === TODAY;
              const isRecorded = RECORDED.has(day);
              const cloverVisible = activeClovers.has(day) || (isRecorded && step >= 2);
              const isPast = day < TODAY;

              const cellIndex = APRIL_START_DOW + i;
              const isSelected = step >= 3 && day === 14;

              return (
                <div
                  key={day}
                  className="flex flex-col items-center"
                  style={{ gap: 2 }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? "#11A858" : isPast ? "#666" : "#bbb",
                    }}
                  >
                    {day}
                  </span>
                  {isRecorded || isToday ? (
                    <img
                      src={isToday ? cloverSpecialSvg : cloverActiveSvg}
                      alt=""
                      style={{
                        width: 22,
                        height: 22,
                        opacity: cloverVisible ? 1 : 0,
                        transform: cloverVisible ? "scale(1)" : "scale(0.3)",
                        transition: `all 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 50}ms`,
                        outline: isSelected ? "2px solid #4B82F5" : "none",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <img
                      src={cloverEmptySvg}
                      alt=""
                      style={{ width: 22, height: 22, opacity: isPast ? 0.2 : 0.08 }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Tap indicator */}
          {showTap && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `calc(${(tapCol / 7) * 100}% + ${(1 / 14) * 100}% - 20px)`,
                top: `calc(32px + ${tapRow * 38}px + 14px)`,
                zIndex: 10,
              }}
            >
              <div
                className="rounded-full animate-ping"
                style={{
                  width: 36,
                  height: 36,
                  background: "rgba(75,130,245,0.4)",
                }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: "rgba(75,130,245,0.2)" }}
              />
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div
          className="shrink-0 flex items-center justify-around"
          style={{
            height: 64,
            borderTop: "1px solid #f0f0f0",
            background: "white",
            paddingBottom: 8,
          }}
        >
          <img src={tabHomeActiveSvg} alt="" style={{ height: 24 }} />
          <img src={tabReportSvg} alt="" style={{ height: 24, opacity: 0.35 }} />
          <img src={tabAdviceSvg} alt="" style={{ height: 24, opacity: 0.35 }} />
          <img src={tabMySvg} alt="" style={{ height: 24, opacity: 0.35 }} />
        </div>
      </div>

      {/* ── Entry card overlay ── */}
      <div
        className="absolute inset-x-0 bg-white rounded-t-3xl"
        style={{
          bottom: 64,
          padding: "20px 20px 16px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          transform: showCard ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.5s cubic-bezier(0.32,0.72,0,1)",
          zIndex: 15,
        }}
      >
        {/* Handle */}
        <div
          className="mx-auto mb-3"
          style={{ width: 36, height: 4, background: "#e0e0e0", borderRadius: 2 }}
        />
        <div className="flex items-center gap-3 mb-3">
          <img src={moodGoodWebp} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>4월 14일 화요일</div>
            <div style={{ fontSize: 12, color: "#11A858", fontWeight: 500 }}>좋아요 · 82점</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#555",
            lineHeight: 1.65,
            background: "#f8f9ff",
            borderRadius: 12,
            padding: "10px 12px",
          }}
        >
          오늘 오랜만에 친구를 만났어요. 밥도 먹고 카페도 갔는데 정말 좋은 시간이었어요 🍀
        </div>
      </div>
    </div>
  );
}
