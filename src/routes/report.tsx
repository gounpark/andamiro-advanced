import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { EmptyDiaryState } from "@/components/EmptyDiaryState";
import { BottomNav } from "@/components/BottomNav";
import fortuneClover from "@/assets/report/fortune-clover.png";
import insightIcon1 from "@/assets/report/insight-icon-1.svg";
import insightIcon2 from "@/assets/report/insight-icon-2.svg";
import insightIcon3 from "@/assets/report/insight-icon-3.svg";
import insightHeaderIcon from "@/assets/report/insight-header-icon.svg";

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
  const hasData = demo;
  if (!hasData) return <EmptyDiaryState title="리포트" activeTab="report" />;
  return <ReportWithData />;
}

// ── 요일별 에너지 바 데이터 (Figma 색상 그대로) ─────────────────────────────
const WEEK_BARS = [
  { label: "일", height: 69,  color: "#79aaff" },
  { label: "월", height: 102, color: "#a2c4ff" },
  { label: "화", height: 105, color: "#c8dcff" },
  { label: "수", height: 108, color: "#c8dcff" },
  { label: "목", height: 137, color: "#e6efff" },
  { label: "금", height: 126, color: "#c8dcff" },
  { label: "토", height: 98,  color: "#a2c4ff" },
];

// ── 버블 데이터 (Figma 303px 기준) ──────────────────────────────────────────
type BubbleData = {
  label: string;
  days: number;
  size: number;
  left: number;
  top: number;
  bg: string;
  labelColor: string;
  daysColor: string;
  labelSize: number;
  daysSize: number;
  fontWeight: "bold" | "semibold";
};
const BUBBLES: BubbleData[] = [
  { label: "설렘",   days: 9, size: 140, left: 0,   top: 0,   bg: "#79aaff", labelColor: "#fff",    daysColor: "#e6efff", labelSize: 18, daysSize: 14, fontWeight: "bold" },
  { label: "평온함", days: 8, size: 120, left: 143, top: 1,   bg: "#e6efff", labelColor: "#79aaff", daysColor: "#999",    labelSize: 16, daysSize: 14, fontWeight: "bold" },
  { label: "활기참", days: 5, size: 120, left: 102, top: 116, bg: "#f1f6ff", labelColor: "#79aaff", daysColor: "#999",    labelSize: 16, daysSize: 14, fontWeight: "bold" },
  { label: "무기력", days: 3, size: 80,  left: 19,  top: 144, bg: "#e7eaee", labelColor: "#999",    daysColor: "#999",    labelSize: 14, daysSize: 12, fontWeight: "semibold" },
  { label: "불안한", days: 3, size: 80,  left: 223, top: 107, bg: "#f7f8f9", labelColor: "#999",    daysColor: "#999",    labelSize: 14, daysSize: 12, fontWeight: "semibold" },
];
const DESIGN_W = 303;
const DESIGN_H = 236;

// ── 패턴 인사이트 데이터 ──────────────────────────────────────────────────────
const INSIGHTS = [
  { icon: insightIcon1, text: "주초(월·화)에 에너지가 높고 주 중반 이후 낮아지는 패턴이 보여요." },
  { icon: insightIcon2, text: "평온함이 베이스 감정으로, 안정적인 흐름을 유지하고 있어요." },
  { icon: insightIcon3, text: "불쾌지수가 높은 날 무기력·불안이 동반되는 경향이 있어요." },
];

function ReportWithData() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const energyRef = useRef<HTMLElement>(null);
  const bubbleRef = useRef<HTMLElement>(null);
  const insightsRef = useRef<HTMLElement>(null);
  const fortuneRef = useRef<HTMLElement>(null);

  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setRevealed(1), 200),
      setTimeout(() => setRevealed(2), 1000),
      setTimeout(() => setRevealed(3), 2000),
      setTimeout(() => setRevealed(4), 3100),
      setTimeout(() => setRevealed(5), 4100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

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
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide pb-32">

          {/* ── 상단 블루 헤더 ── */}
          <div
            className="relative bg-[#3d78f3] text-white px-6 pt-[52px] pb-8"
            style={fadeIn(1)}
          >
            <header className="relative flex items-center justify-center pb-5">
              <Link
                to="/"
                aria-label="뒤로"
                className="absolute left-0 grid h-9 w-9 place-items-center rounded-full text-white/90"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
              </Link>
              <h1 className="font-semibold text-[18px] tracking-[-0.45px]">리포트</h1>
            </header>
            <p className="text-[#f8f8f8] text-[20px] tracking-[-0.6px] leading-[1.5]">
              4월의 감정은 어땠을까요?
            </p>
            <p className="font-semibold text-white text-[22px] tracking-[-0.66px] leading-[1.5]">
              한 달의 마음 흐름을 돌아보세요!
            </p>
          </div>

          {/* ── 요일별 에너지 ── */}
          <section ref={energyRef} className="mx-4 mt-5 rounded-2xl bg-white px-5 pt-5 pb-5 shadow-sm" style={fadeIn(2)}>
            <p className="text-[14px] text-[#a3a7ad] tracking-tight">한 주의 흐름</p>
            <h3 className="mt-1 font-bold text-[#222] text-[20px] tracking-tight">요일별 에너지</h3>
            <div className="mt-5 flex items-end justify-between gap-1.5" style={{ height: 153 }}>
              {WEEK_BARS.map((b) => (
                <div key={b.label} className="flex flex-1 flex-col items-center gap-3">
                  <div
                    className="w-full rounded-[4px]"
                    style={{ height: b.height, background: b.color }}
                  />
                  <span className="text-[14px] text-[#999]">{b.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── 이번 달 감정 순위 ── */}
          <section ref={bubbleRef} className="mx-4 mt-5 rounded-2xl bg-white px-5 pt-5 pb-5 shadow-sm" style={fadeIn(3)}>
            <p className="text-[14px] text-[#a3a7ad] tracking-tight">감정 리포트</p>
            <h3 className="mt-1 font-bold text-[#222] text-[20px] tracking-tight">이번 달 감정 순위</h3>
            <BubbleCluster />
          </section>

          {/* ── 패턴 인사이트 ── */}
          <section
            ref={insightsRef}
            className="mx-4 mt-5 rounded-[20px] bg-white shadow-sm"
            style={{ ...fadeIn(4), padding: 20 }}
          >
            {/* 헤더 */}
            <div className="flex flex-col items-center gap-2.5">
              {/* SVG 자체에 #E9F5FE 배경 + 스파클 포함 */}
              <img src={insightHeaderIcon} alt="" className="w-[50px] h-[50px]" />
              <p className="font-bold text-[#222] text-[20px] tracking-tight">패턴 인사이트</p>
            </div>

            {/* 인사이트 목록 */}
            <div className="mt-6 flex flex-col gap-[20px]">
              {INSIGHTS.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-start rounded-[20px] border border-dashed border-[#eee] bg-white"
                  style={{
                    padding: 16,
                    opacity: revealed >= 4 ? 1 : 0,
                    transform: revealed >= 4 ? "translateY(0)" : "translateY(10px)",
                    transition: `opacity 0.5s ease ${i * 0.18 + 0.1}s, transform 0.5s ease ${i * 0.18 + 0.1}s`,
                  }}
                >
                  <div
                    className="shrink-0 overflow-hidden rounded-full"
                    style={{ width: 40, height: 40, background: "#f8f8f8", position: "relative" }}
                  >
                    <img
                      src={item.icon}
                      alt=""
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                  <p
                    className="flex-1 text-[14px] text-[#645955] min-w-0"
                    style={{ lineHeight: 1.6 }}
                  >
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 포춘쿠키 카드 ── */}
          <section ref={fortuneRef} className="mx-4 mt-5 mb-6 rounded-2xl overflow-hidden shadow-sm" style={fadeIn(5)}>
            <div
              className="flex items-center gap-4 px-5 py-4"
              style={{ background: "linear-gradient(135deg, #FFF8EC 0%, #FFF3D6 100%)" }}
            >
              <img src={fortuneClover} alt="포춘쿠키" className="w-[72px] h-[72px] object-contain shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#C49A3A] tracking-tight uppercase">오늘의 운세</p>
                <h3 className="mt-0.5 font-bold text-foreground text-[14px] tracking-tight leading-tight">
                  포춘쿠키가 기다리고 있어요!
                </h3>
                <p className="mt-1 text-[12px] text-foreground/60 tracking-tight">하루를 마무리하는 작은 선물</p>
              </div>
            </div>
          </section>

        </div>
        <BottomNav active="report" />
      </div>
    </div>
  );
}

function BubbleCluster() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const update = () => setScale(el.clientWidth / DESIGN_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      ref={ref}
      className="relative mt-4 w-full overflow-visible"
      style={{ height: DESIGN_H * scale }}
    >
      {BUBBLES.map((b) => (
        <div
          key={b.label}
          className={`bubble-anim absolute flex flex-col items-center justify-center rounded-full select-none ${animated ? "is-animated" : ""}`}
          style={{
            width: b.size * scale,
            height: b.size * scale,
            left: b.left * scale,
            top: b.top * scale,
            background: b.bg,
            ["--bubble-delay" as string]: `${BUBBLES.indexOf(b) * 0.18}s`,
          }}
        >
          <strong
            className="leading-tight tracking-tight"
            style={{
              fontSize: b.labelSize * scale,
              color: b.labelColor,
              fontWeight: b.fontWeight === "bold" ? 700 : 600,
            }}
          >
            {b.label}
          </strong>
          <span style={{ fontSize: b.daysSize * scale, color: b.daysColor, marginTop: 2 * scale }}>
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
          filter: brightness(1.08) drop-shadow(0 4px 16px rgba(0,0,0,0.18));
          transform: scale(1.08);
          z-index: 99 !important;
        }
      `}</style>
    </div>
  );
}
