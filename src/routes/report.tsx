import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, MessageSquareText, Sparkles } from "lucide-react";
import { EmptyDiaryState } from "@/components/EmptyDiaryState";
import { BottomNav } from "@/components/BottomNav";
import fortuneClover from "@/assets/report/fortune-clover.png";

export const Route = createFileRoute("/report")({
  validateSearch: (s: Record<string, unknown>) => ({
    demo: s.demo === "1" || s.demo === 1 || s.demo === true ? true : false,
  }),
  head: () => ({
    meta: [
      { title: "리포트 — 안다미로" },
      { name: "description", content: "당신의 감정 기록을 모아 보여주는 리포트." },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { demo } = Route.useSearch();
  // 데모 토글 — 추후 실제 데이터 유무로 교체
  const hasData = demo;
  if (!hasData) return <EmptyDiaryState title="리포트" activeTab="report" />;
  return <ReportWithData />;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const WEEK_VALUES = [40, 55, 50, 60, 95, 75, 60];

type BubbleVariant = "main" | "soft" | "soft-2" | "muted" | "muted-2";
type BubbleData = {
  label: string;
  days: number;
  size: number;
  left: number;
  top: number;
  variant: BubbleVariant;
  z: number;
  delay: number;
};
/** Figma/HTML 예시와 동일한 좌표·크기·딜레이 (380px 폭 기준) */
const BUBBLES: BubbleData[] = [
  { label: "설렘",   days: 9, size: 114, left: 110.97, top: 75.75,  variant: "main",    z: 14, delay: 0.0 },
  { label: "평온함", days: 8, size: 92,  left: 229.07, top: 61.19,  variant: "soft",    z: 13, delay: 0.23 },
  { label: "활기참", days: 5, size: 90,  left: 192.0,  top: 161.56, variant: "soft-2",  z: 12, delay: 0.46 },
  { label: "무기력", days: 3, size: 70,  left: 98.47,  top: 183.04, variant: "muted",   z: 10, delay: 0.69 },
  { label: "불안함", days: 3, size: 64,  left: 282.17, top: 138.77, variant: "muted-2", z: 11, delay: 0.92 },
];
const BUBBLE_GRADIENTS: Record<BubbleVariant, string> = {
  "main":    "linear-gradient(135deg, #5B82F0, #4268DC)",   // 진한 파랑 (설렘)
  "soft":    "linear-gradient(135deg, #85AADC, #6D92CA)",   // 중간 파랑 (평온함)
  "soft-2":  "linear-gradient(135deg, #96BCDE, #7EA4CC)",   // 연한 파랑 (활기참)
  "muted":   "linear-gradient(135deg, #C0CADA, #AABACA)",   // 회색 (무기력)
  "muted-2": "linear-gradient(135deg, #ABBBD8, #92A8C8)",   // 연한 회청 (불안함)
};

const INSIGHTS = [
  "주초(월·화)에 에너지가 높고 주 중반 이후 낮아지는 패턴이 보여요.",
  "평온함이 베이스 감정으로, 안정적인 흐름을 유지하고 있어요.",
  "불쾌지수가 높은 날 무기력·불안이 동반되는 경향이 있어요.",
];

function ReportWithData() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const energyRef = useRef<HTMLElement>(null);
  const bubbleRef = useRef<HTMLElement>(null);
  const insightsRef = useRef<HTMLElement>(null);
  const fortuneRef = useRef<HTMLElement>(null);

  // 순차 reveal 애니메이션
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setRevealed(1), 200),   // 블루 헤더
      setTimeout(() => setRevealed(2), 1000),  // 에너지 차트
      setTimeout(() => setRevealed(3), 2000),  // 버블 감정 순위
      setTimeout(() => setRevealed(4), 3100),  // 패턴 인사이트
      setTimeout(() => setRevealed(5), 4100),  // 포춘쿠키 카드
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // reveal 될 때마다 해당 섹션이 뷰에 들어오도록 부드럽게 스크롤
  useEffect(() => {
    const targets: Record<number, React.RefObject<HTMLElement | null>> = {
      2: energyRef,
      3: bubbleRef,
      4: insightsRef,
      5: fortuneRef,
    };
    const el = targets[revealed]?.current;
    const container = scrollRef.current;
    if (!el || !container) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const overflow = elRect.bottom - containerRect.bottom + 28;
    if (overflow > 0) {
      container.scrollTo({ top: container.scrollTop + overflow, behavior: "smooth" });
    }
  }, [revealed]);

  const fadeIn = (n: number): React.CSSProperties => ({
    opacity: revealed >= n ? 1 : 0,
    transform: revealed >= n ? "translateY(0)" : "translateY(18px)",
    transition: "opacity 0.65s ease, transform 0.65s ease",
  });

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col" style={{ background: "#f5f6f8" }}>
        {/* 스크롤 전체 (헤더 포함) */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide pb-32">
          {/* 상단 블루 헤더 — 스크롤과 함께 흐름 */}
          <div
            className="relative bg-[var(--primary)] text-white px-5 pt-[52px] pb-8 rounded-b-[24px]"
            style={fadeIn(1)}
          >
            <header className="relative flex items-center justify-center pb-4">
              <Link
                to="/"
                aria-label="뒤로"
                className="absolute left-0 grid h-9 w-9 place-items-center rounded-full text-white/90 hover:text-white"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
              </Link>
              <h1 className="font-semibold text-[16px] tracking-tight">리포트</h1>
            </header>
            <p className="text-[13px] text-white/80 tracking-tight">4월의 감정은 어땠을까요?</p>
            <h2 className="mt-1 font-bold text-[20px] leading-[1.35] tracking-tight">
              한 달의 마음 흐름을 돌아보세요!
            </h2>
          </div>

          {/* 요일별 에너지 */}
          <section ref={energyRef} className="mx-4 mt-5 rounded-2xl bg-white p-5 shadow-sm" style={fadeIn(2)}>
            <p className="text-[11px] text-[#9a9aa3] tracking-tight">한 주의 흐름</p>
            <h3 className="mt-1 font-bold text-foreground text-[16px] tracking-tight">요일별 에너지</h3>
            <div className="mt-5 flex h-[140px] items-end justify-between gap-2">
              {WEEK_VALUES.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-[var(--primary)]/25"
                    style={{ height: `${(v / 100) * 110}px` }}
                  />
                  <span className="text-[11px] text-[#9a9aa3]">{WEEKDAYS[i]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 이번 달 감정 순위 (버블) */}
          <section ref={bubbleRef} className="mx-4 mt-5 rounded-2xl bg-white p-5 shadow-sm" style={fadeIn(3)}>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999]">감정 리포트</p>
            <h3 className="mt-1 font-bold text-[#1a1a1a] text-[17px] tracking-tight">이번 달 감정 순위</h3>
            <BubbleCluster />
          </section>

          {/* 패턴 인사이트 */}
          <section ref={insightsRef} className="mx-4 mt-5 rounded-2xl bg-white p-5 shadow-sm" style={fadeIn(4)}>
            <div className="flex flex-col items-center">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="mt-2 font-bold text-foreground text-[15px] tracking-tight">패턴 인사이트</h3>
            </div>
            <ul className="mt-4 flex flex-col gap-3">
              {INSIGHTS.map((t, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-dashed border-[#d9dbe1] bg-white px-3 py-3"
                  style={{
                    opacity: revealed >= 4 ? 1 : 0,
                    transform: revealed >= 4 ? "translateY(0)" : "translateY(10px)",
                    transition: `opacity 0.5s ease ${i * 0.2 + 0.1}s, transform 0.5s ease ${i * 0.2 + 0.1}s`,
                  }}
                >
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f1f3f6] text-[var(--primary)]">
                    <MessageSquareText className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-foreground/85 tracking-tight">{t}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* 포춘쿠키 연결 카드 */}
          <section ref={fortuneRef} className="mx-4 mt-5 mb-6 rounded-2xl overflow-hidden shadow-sm" style={fadeIn(5)}>
            <div
              className="flex items-center gap-4 px-5 py-4"
              style={{ background: "linear-gradient(135deg, #FFF8EC 0%, #FFF3D6 100%)" }}
            >
              <img
                src={fortuneClover}
                alt="포춘쿠키"
                className="w-[72px] h-[72px] object-contain shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#C49A3A] tracking-tight uppercase">
                  오늘의 운세
                </p>
                <h3 className="mt-0.5 font-bold text-foreground text-[14px] tracking-tight leading-tight">
                  포춘쿠키가 기다리고 있어요!
                </h3>
                <p className="mt-1 text-[12px] text-foreground/60 tracking-tight">
                  하루를 마무리하는 작은 선물
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* 하단 탭 */}
        <BottomNav active="report" />
      </div>
    </div>
  );
}

/** Figma/HTML 예시와 동일한 진입(spring) + 숨쉬기(breathe) 애니메이션 */
function BubbleCluster() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [animated, setAnimated] = useState(false);

  // 패널 폭에 맞춰 380px 디자인 좌표를 비율 스케일
  const DESIGN_WIDTH = 380;
  const DESIGN_HEIGHT = 280;
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const update = () => setScale(el.clientWidth / DESIGN_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 마운트 후 짧은 딜레이 후 애니메이션 시작 (폰 목업 내 IntersectionObserver 미동작 대응)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      ref={ref}
      className="relative mt-3 w-full overflow-visible"
      style={{ height: DESIGN_HEIGHT * scale }}
    >
      {BUBBLES.map((b) => (
        <div
          key={b.label}
          className={`bubble-anim absolute flex flex-col items-center justify-center rounded-full select-none ${
            animated ? "is-animated" : ""
          }`}
          style={{
            width: b.size * scale,
            height: b.size * scale,
            left: b.left * scale,
            top: b.top * scale,
            zIndex: b.z,
            background: BUBBLE_GRADIENTS[b.variant],
            ["--bubble-delay" as string]: `${b.delay}s`,
          }}
        >
          <strong
            className="font-bold text-white leading-tight tracking-tight"
            style={{ fontSize: 13 * scale }}
          >
            {b.label}
          </strong>
          <span
            className="text-white/80"
            style={{ fontSize: 11 * scale, marginTop: 2 * scale }}
          >
            {b.days}일
          </span>
        </div>
      ))}

      <style>{`
        .bubble-anim { opacity: 0; transform: scale(0); transform-origin: center center; cursor: pointer; transition: filter 0.2s, transform 0.2s; }
        @keyframes bubbleIn {
          0%   { opacity: 0; transform: scale(0); }
          65%  { opacity: 1; transform: scale(1.08); }
          82%  { transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bubbleBreathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        .bubble-anim.is-animated {
          animation:
            bubbleIn 0.72s cubic-bezier(0.34, 1.56, 0.64, 1) var(--bubble-delay) both,
            bubbleBreathe 3.2s ease-in-out calc(0.72s + var(--bubble-delay) * 4) infinite;
        }
        .bubble-anim.is-animated:hover {
          filter: brightness(1.12) drop-shadow(0 4px 16px rgba(0,0,0,0.22));
          transform: scale(1.1);
          z-index: 99 !important;
        }
      `}</style>
    </div>
  );
}
