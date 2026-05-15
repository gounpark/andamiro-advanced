import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { DemoCursor } from "@/components/DemoCursor";
import { ChevronLeft } from "lucide-react";
import cookieClosed from "@/assets/report/fortune-cookie-closed.png";
import rays from "@/assets/report/fortune-rays.png";
import title from "@/assets/report/fortune-title.png";
import paper from "@/assets/report/fortune-paper.png";
import fortuneMessageTitle from "@/assets/report/fortune-message-title.svg";
import cookieResult from "@/assets/report/fortune-cookie-result.png";
import cookieCracked from "@/assets/report/fortune-cookie-cracked.png";

// ===== 버전 토글 =====
// true  → 새 디자인 (쪼개짐 중간단계 + 어두운 결과화면)
// false → 기존 디자인 (종이 팝업)
// 언제든 false로 바꾸면 즉시 원래 화면으로 복구됩니다.
const USE_V2 = true;

export const Route = createFileRoute("/fortune")({
  validateSearch: (s: Record<string, unknown>): { demo?: string } => ({
    demo: s.demo != null ? String(s.demo) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "오늘의 운세 — 안다미로" },
      { name: "description", content: "포춘쿠키 속에 숨겨진 당신의 행운을 확인해보세요." },
      { name: "theme-color", content: "#fff7e0" },
    ],
  }),
  component: FortuneRoute,
});

const FORTUNE_TEXT = "오후 3시, 달콤한 커피 한 잔이\n당신의 운을 깨워줄 거예요.";
const FORTUNE_DATE = "목요일, 오전 10:48";
const FORTUNE_CHIPS = ["오후 3시", "커피 타임", "여유 한 잔"];

function FortuneRoute() {
  const { demo: demoParam } = Route.useSearch();
  const demo = demoParam === "1";
  return USE_V2 ? <FortunePageV2 demo={demo} /> : <FortunePageLegacy />;
}

/* =========================================================
 * V2 — Figma 308:3789 → 308:3851 → 308:3869
 * idle (닫힌 쿠키) → cracked (쪼개짐) → revealed (어두운 결과)
 * ========================================================= */
function FortunePageV2({ demo }: { demo?: boolean }) {
  const navigate = useNavigate();
  const frameRef = useRef<HTMLDivElement>(null);
  const cookieRef = useRef<HTMLButtonElement>(null);
  // idle → shaking(0.7s) → cracked(1.1s) → revealed
  const [stage, setStage] = useState<"idle" | "shaking" | "cracked" | "revealed">("idle");
  const [cursor, setCursor] = useState({ x: 195, y: 430, tapping: false, visible: false });

  const handleTap = () => {
    if (stage !== "idle") return;
    setStage("shaking");
    // 흔들림(1.2s) → 깨진 쿠키 노출(0.9s) → 결과 화면
    window.setTimeout(() => setStage("cracked"), 1200);
    window.setTimeout(() => setStage("revealed"), 1200 + 900);
  };

  // 데모 모드: 정적 화면으로 시작 → 커서 바로 등장 → 탭
  useEffect(() => {
    if (!demo) return;
    // rAF로 실제 쿠키 버튼 위치를 읽어 커서 정확히 맞춤
    const raf = requestAnimationFrame(() => {
      const cookie = cookieRef.current;
      const frame = frameRef.current;
      if (cookie && frame) {
        const cr = cookie.getBoundingClientRect();
        const fr = frame.getBoundingClientRect();
        setCursor((c) => ({
          ...c,
          x: cr.left - fr.left + cr.width / 2,
          y: cr.top - fr.top + cr.height / 2,
        }));
      }
    });
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setCursor((c) => ({ ...c, visible: true })), 1200));
    timers.push(setTimeout(() => setCursor((c) => ({ ...c, tapping: true })), 2000));
    timers.push(
      setTimeout(() => {
        setCursor((c) => ({ ...c, tapping: false, visible: false })); // 탭 후 즉시 숨김
        handleTap();
      }, 2250),
    );
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  const goBack = () => navigate({ to: "/advice", search: { empty: false } });

  // ===== Revealed: 어두운 배경 결과 화면 =====
  if (stage === "revealed") {
    return (
      <div className="app-shell">
        <div className="app-frame relative flex flex-col bg-[#0d0d0d] overflow-hidden">
          {/* 은은한 광선 — 매우 약하게 + 강한 딤 오버레이로 가독성 확보 */}
          <img
            src={rays}
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] max-w-none opacity-[0.05] select-none"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/85" />

          <button
            type="button"
            aria-label="뒤로"
            onClick={goBack}
            className="absolute left-3 top-[52px] z-40 grid h-9 w-9 place-items-center rounded-full text-white/80 hover:text-white"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
          </button>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-28 fortune-fade-in">
            <img
              src={fortuneMessageTitle}
              alt="FORTUNE MESSAGE"
              className="w-[241px] h-auto select-none"
              draggable={false}
            />

            <img
              src={cookieResult}
              alt=""
              className="mt-8 w-[180px] h-auto select-none drop-shadow-[0_18px_30px_rgba(0,0,0,0.4)] fortune-pop"
              draggable={false}
            />

            <p className="mt-6 text-[14px] text-white/65 tracking-tight">{FORTUNE_DATE}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {FORTUNE_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="rounded-md bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white/85 tracking-tight"
                >
                  {chip}
                </span>
              ))}
            </div>

            <p className="mt-6 whitespace-pre-line text-center text-[15px] leading-[1.7] text-white tracking-tight">
              {FORTUNE_TEXT}
            </p>
          </div>

          {/* 확인 버튼 */}
          <div className="absolute inset-x-0 bottom-6 z-10 px-6">
            <button
              type="button"
              onClick={goBack}
              className="w-full rounded-2xl bg-white py-4 text-[15px] font-semibold text-foreground tracking-tight shadow-[0_8px_24px_rgba(0,0,0,0.3)] active:scale-[0.99] transition"
            >
              확인
            </button>
          </div>
        </div>
        <FortuneStyles />
      </div>
    );
  }

  // ===== Idle / Cracked: 밝은 배경 =====
  return (
    <div className="app-shell">
      <div ref={frameRef} className="app-frame relative flex flex-col bg-white overflow-hidden">
        {demo && <DemoCursor {...cursor} />}
        <img
          src={cookieCracked}
          alt=""
          aria-hidden
          className="hidden"
          loading="eager"
          decoding="async"
        />
        <img
          src={cookieResult}
          alt=""
          aria-hidden
          className="hidden"
          loading="eager"
          decoding="async"
        />
        <img
          src={fortuneMessageTitle}
          alt=""
          aria-hidden
          className="hidden"
          loading="eager"
          decoding="async"
        />

        <button
          type="button"
          aria-label="뒤로"
          onClick={goBack}
          className="absolute left-3 top-[52px] z-40 grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:text-foreground"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
        </button>

        <img
          src={rays}
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] max-w-none opacity-95 select-none"
        />
        <div
          className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-500 ${
            stage === "cracked" ? "opacity-45" : "opacity-0"
          }`}
        />

        {stage === "idle" && (
          <div className="relative z-10 mt-24 flex flex-col items-center px-6">
            <img
              src={title}
              alt="오늘의 운세"
              className="w-[78%] max-w-[300px] h-auto select-none"
              draggable={false}
            />
            <p className="mt-5 text-foreground/70 tracking-tight text-base">
              바삭한 쿠키속에 숨겨진{" "}
              <span className="text-[var(--primary)] font-semibold">당신의 행운</span>을
              확인해보세요!
            </p>
          </div>
        )}

        <div className="relative z-10 flex-1 flex items-center justify-center px-8">
          {stage === "idle" ? (
            <button
              ref={cookieRef}
              type="button"
              onClick={handleTap}
              aria-label="포춘쿠키 열기"
              className="relative outline-none"
            >
              <img
                src={cookieClosed}
                alt="포춘쿠키"
                className="w-[260px] h-auto select-none drop-shadow-xl fortune-float"
                draggable={false}
              />
            </button>
          ) : stage === "shaking" ? (
            <img
              src={cookieClosed}
              alt=""
              className="w-[260px] h-auto select-none drop-shadow-xl fortune-shake-long"
              draggable={false}
            />
          ) : (
            // cracked — 자연스럽게 갈라진 이미지로 전환 + 살짝 벌어지는 모션
            <img
              src={cookieCracked}
              alt=""
              className="w-[292px] h-auto select-none drop-shadow-xl fortune-cracked-in"
              draggable={false}
            />
          )}
        </div>

        {stage === "idle" && (
          <div className="relative z-10 mx-5 mb-24 rounded-2xl bg-white px-6 py-6 text-center shadow-[0_6px_24px_-10px_rgba(0,0,0,0.12)]">
            <p className="text-foreground/70 tracking-tight text-base">
              쿠키를 눌러 오늘의
              <br />
              운세를 확인하세요
            </p>
          </div>
        )}
      </div>
      <FortuneStyles />
    </div>
  );
}

function FortuneStyles() {
  return (
    <style>{`
      @keyframes fortune-float {
        0%, 100% { transform: translateY(0) rotate(-2deg); }
        50% { transform: translateY(-8px) rotate(2deg); }
      }
      .fortune-float { animation: fortune-float 2.4s ease-in-out infinite; }

      @keyframes fortune-shake-strong {
        0% { transform: translateX(0) rotate(0); }
        10% { transform: translateX(-14px) rotate(-10deg) scale(1.01); }
        20% { transform: translateX(14px) rotate(10deg) scale(1.02); }
        30% { transform: translateX(-16px) rotate(-12deg) scale(1.01); }
        45% { transform: translateX(16px) rotate(12deg) scale(1.02); }
        60% { transform: translateX(-12px) rotate(-8deg) scale(1.01); }
        75% { transform: translateX(12px) rotate(8deg) scale(1.01); }
        90% { transform: translateX(-6px) rotate(-4deg); }
        100% { transform: translateX(0) rotate(0); }
      }
      .fortune-shake-strong { animation: fortune-shake-strong 700ms ease-in-out both; }
      .fortune-shake-long { animation: fortune-shake-strong 1200ms ease-in-out both; }

      @keyframes fortune-cracked-in {
        0%   { transform: scale(0.82) rotate(-7deg); opacity: 0; }
        60%  { transform: scale(1.06) rotate(2deg); opacity: 1; }
        100% { transform: scale(1) rotate(0); opacity: 1; }
      }
      .fortune-cracked-in { animation: fortune-cracked-in 650ms cubic-bezier(0.18, 0.88, 0.26, 1.08) both; }

      @keyframes fortune-pop {
        0% { transform: scale(0.7) rotate(-6deg); opacity: 0; }
        60% { transform: scale(1.04) rotate(1deg); opacity: 1; }
        100% { transform: scale(1) rotate(0); opacity: 1; }
      }
      .fortune-pop { animation: fortune-pop 520ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both; }

      @keyframes fortune-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .fortune-fade-in { animation: fortune-fade-in 350ms ease-out both; }
    `}</style>
  );
}

/* =========================================================
 * Legacy — 기존 종이 팝업 디자인 (보존)
 * USE_V2 = false 로 바꾸면 즉시 사용됨
 * ========================================================= */
function FortunePageLegacy() {
  const navigate = useNavigate();
  // 'idle' → 'shaking' → 'revealed'
  const [stage, setStage] = useState<"idle" | "shaking" | "revealed">("idle");

  const handleTap = () => {
    if (stage !== "idle") return;
    setStage("shaking");
    window.setTimeout(() => setStage("revealed"), 850);
  };

  return (
    <div className="app-shell">
      <div className="app-frame relative flex flex-col bg-white overflow-hidden">
        {/* 종이 이미지 프리로드 (보이지 않게) */}
        <img src={paper} alt="" aria-hidden className="hidden" decoding="async" />

        {/* 뒤로가기 */}
        <button
          type="button"
          aria-label="뒤로"
          onClick={() => navigate({ to: "/advice", search: { empty: false } })}
          className="absolute left-3 top-[52px] z-40 grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:text-foreground"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
        </button>

        {/* 화면 어디든 탭하면 닫힘 (revealed 상태) */}
        {stage === "revealed" && (
          <button
            type="button"
            aria-label="닫기"
            onClick={() => navigate({ to: "/advice", search: { empty: false } })}
            className="absolute inset-0 z-30"
          />
        )}

        {/* 노란 광선 배경 */}
        <img
          src={rays}
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] max-w-none opacity-95 select-none"
        />

        {/* 헤더 타이틀 */}
        {stage === "idle" && (
          <div className="relative z-10 mt-14 flex flex-col items-center px-6">
            <img
              src={title}
              alt="오늘의 운세"
              className="w-[78%] max-w-[300px] h-auto select-none"
              draggable={false}
            />
            <p className="mt-5 text-foreground/70 tracking-tight text-base">
              바삭한 쿠키속에 숨겨진{" "}
              <span className="text-[var(--primary)] font-semibold">당신의 행운</span>을
              확인해보세요!
            </p>
          </div>
        )}

        {/* 중앙 인터랙션 영역 */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-8 pb-10">
          {stage !== "revealed" ? (
            <button
              type="button"
              onClick={handleTap}
              aria-label="포춘쿠키 열기"
              className="relative outline-none"
            >
              <img
                src={cookieClosed}
                alt="포춘쿠키"
                className={`w-[260px] h-auto select-none drop-shadow-xl ${
                  stage === "shaking" ? "fortune-shake" : "fortune-float"
                }`}
                draggable={false}
              />
            </button>
          ) : (
            <div className="fortune-pop relative w-[88%] max-w-[340px]">
              <img
                src={paper}
                alt=""
                className="w-full h-auto select-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)]"
                draggable={false}
              />
              <p className="absolute inset-0 flex items-center justify-center px-10 text-center whitespace-pre-line text-[15px] leading-[1.75] text-foreground tracking-tight">
                {FORTUNE_TEXT}
              </p>
            </div>
          )}
        </div>

        {/* 하단 안내 카드 (idle만) */}
        {stage === "idle" && (
          <div className="relative z-10 mx-5 mb-10 rounded-2xl bg-white px-6 py-6 text-center shadow-[0_6px_24px_-10px_rgba(0,0,0,0.12)]">
            <p className="mt-5 text-foreground/70 tracking-tight text-base">
              쿠키를 눌러 오늘의
              <br />
              운세를 확인하세요
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fortune-float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        .fortune-float { animation: fortune-float 2.4s ease-in-out infinite; }
        @keyframes fortune-shake {
          0% { transform: translateX(0) rotate(0); }
          15% { transform: translateX(-12px) rotate(-8deg); }
          30% { transform: translateX(12px) rotate(8deg); }
          45% { transform: translateX(-10px) rotate(-6deg); }
          60% { transform: translateX(10px) rotate(6deg); }
          75% { transform: translateX(-6px) rotate(-3deg); }
          100% { transform: translateX(0) rotate(0); opacity: 0; }
        }
        .fortune-shake { animation: fortune-shake 800ms ease-in-out forwards; }
        @keyframes fortune-pop {
          0% { transform: scale(0.6) rotate(-6deg); opacity: 0; }
          60% { transform: scale(1.04) rotate(1deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .fortune-pop { animation: fortune-pop 520ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both; }
      `}</style>
    </div>
  );
}
