import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { EmptyDiaryState } from "@/components/EmptyDiaryState";
import { BottomNav } from "@/components/BottomNav";
import { DemoCursor } from "@/components/DemoCursor";
import fortuneClover from "@/assets/report/fortune-clover.png";
import fortuneCookieIcon from "@/assets/advice/fortune-cookie-icon.svg";
import quoteRight from "@/assets/advice/quote-right.png";

export const Route = createFileRoute("/advice")({
  validateSearch: (s: Record<string, unknown>): { empty: boolean; demo?: string } => ({
    empty: s.empty === "1" || s.empty === 1 || s.empty === true ? true : false,
    demo: s.demo != null ? String(s.demo) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "조언 — 안다미로" },
      { name: "description", content: "오늘의 감정에 어울리는 작은 조언." },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  component: AdvicePage,
});

function AdvicePage() {
  const { empty } = Route.useSearch();
  if (empty) return <EmptyDiaryState title="조언" activeTab="advice" />;
  return <AdviceWithData />;
}

const TAGS = ["안정", "집중", "균형"];

function AdviceWithData() {
  const navigate = useNavigate();
  const { demo: demoParam } = Route.useSearch();
  const demo = demoParam === "1";
  const scrollRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLAnchorElement>(null);

  // demo 모드: 즉시 전체 표시 / 일반 모드: 순차 reveal
  const [revealed, setRevealed] = useState(demo ? 4 : 0);
  useEffect(() => {
    if (demo) return; // demo면 이미 4로 세팅됨
    const timers = [
      setTimeout(() => setRevealed(1), 200),
      setTimeout(() => setRevealed(2), 900),
      setTimeout(() => setRevealed(3), 1800),
      setTimeout(() => setRevealed(4), 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [demo]);

  // reveal 될 때마다 스크롤 (일반 모드만)
  useEffect(() => {
    if (demo) return;
    const targets: Record<number, React.RefObject<HTMLElement | null>> = {
      2: scoreRef,
      3: summaryRef,
      4: quoteRef,
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
  }, [revealed, demo]);

  // 데모: 정적 화면 → 커서 등장 → 포춘쿠키 배너 클릭 → fortune 이동
  const [cursor, setCursor] = useState({ x: 195, y: 150, tapping: false, visible: false });
  useEffect(() => {
    if (!demo) return;
    // rAF로 실제 배너 DOM 위치를 읽어 커서 정확히 맞춤
    const raf = requestAnimationFrame(() => {
      const banner = bannerRef.current;
      const frame = frameRef.current;
      if (banner && frame) {
        const br = banner.getBoundingClientRect();
        const fr = frame.getBoundingClientRect();
        setCursor(c => ({
          ...c,
          x: br.left - fr.left + br.width / 2,
          y: br.top - fr.top + br.height / 2,
        }));
      }
    });
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setCursor(c => ({ ...c, visible: true })), 600));
    timers.push(setTimeout(() => setCursor(c => ({ ...c, tapping: true })), 1200));
    timers.push(setTimeout(() => setCursor(c => ({ ...c, tapping: false })), 1450));
    timers.push(setTimeout(() => { navigate({ to: "/fortune", search: { demo: "1" } as { demo: string } }); }, 1650));
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, [demo]);

  const fadeIn = (n: number): React.CSSProperties => ({
    opacity: revealed >= n ? 1 : 0,
    transform: revealed >= n ? "translateY(0)" : "translateY(18px)",
    transition: "opacity 0.65s ease, transform 0.65s ease",
  });

  return (
    <div className="app-shell">
      <div ref={frameRef} className="app-frame flex flex-col bg-white" style={{ position: "relative" }}>
        {demo && <DemoCursor {...cursor} />}
        {/* 헤더 */}
        <header className="relative shrink-0 flex items-center justify-center px-4 pt-[52px] pb-4">
          <Link
            to="/"
            aria-label="뒤로"
            className="absolute left-3 top-[50px] grid h-9 w-9 place-items-center rounded-full text-foreground/70"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
          </Link>
          <h1 className="font-semibold text-foreground text-[16px] tracking-tight">조언</h1>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide pb-32 bg-white">
          {/* 포춘쿠키 알림 배너 */}
          <div style={fadeIn(1)}>
            <Link
              ref={bannerRef}
              to="/fortune"
              search={{}}
              className="mx-4 mt-4 flex items-center gap-3 rounded-2xl bg-[#f4f6fa] px-3 py-2.5 active:scale-[0.99] transition"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#3b6fff]">
                <img
                  src={fortuneCookieIcon}
                  alt=""
                  className="h-5 w-5 object-contain animate-cookie-wiggle"
                />
              </span>
              <span className="text-foreground/85 tracking-tight text-sm">
                포춘쿠키를 확인하세요!
              </span>
            </Link>
          </div>

          {/* 점수 카드 */}
          <section ref={scoreRef} className="pt-5 pb-6 py-[40px] px-[28px] mt-[12px] mb-[16px]" style={fadeIn(2)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] text-[#9a9aa3] tracking-tight">4월 20일 월요일</p>
                <h2 className="mt-1 font-bold text-foreground text-[18px] leading-tight tracking-tight">
                  안정적이고 균형 잡힌 날
                </h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-extrabold text-foreground text-[40px] leading-none tracking-tight">
                    80
                  </span>
                  <span className="text-[14px] font-medium text-foreground/70">점</span>
                </div>
              </div>
              <img
                src={fortuneClover}
                alt=""
                className="h-[90px] w-[90px] object-contain shrink-0"
              />
            </div>
          </section>

          {/* 회색 배경 영역 */}
          <div className="bg-[#f5f6f8] pt-6 pb-10 space-y-5">
            {/* 한줄 요약 + 태그 */}
            <section ref={summaryRef} className="mx-4 rounded-2xl bg-white p-5 shadow-sm" style={fadeIn(3)}>
              <p className="text-[13.5px] leading-[1.65] text-foreground/85 tracking-tight">
                오늘은 블루(파란색)이 당신에게 긍정적인 에너지를 가져다 줄 거예요!{" "}
                <span className="text-[var(--primary)]">💙</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {TAGS.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[#e6eefc] px-3 py-1 text-[12px] font-medium text-[#3b6fff] tracking-tight"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </section>

            {/* 인용 카드 + 채팅 말풍선 */}
            <section ref={quoteRef} className="mx-4 rounded-2xl bg-white p-5 shadow-sm" style={fadeIn(4)}>
              <div className="flex flex-col items-center">
                <img src={quoteRight} alt="" className="h-10 w-10 object-contain" />
                <h3 className="mt-1 font-bold text-foreground text-[15.5px] tracking-tight">
                  오늘은 이렇게 보내보세요!
                </h3>
              </div>
              <p className="mt-4 text-[13px] leading-[1.75] text-foreground/85 tracking-tight">
                평온한 마음으로 하루를 차분하게 보내신 점이 정말 좋습니다. 애정 운이 82점으로 높은
                만큼, 소중한 사람들과의 작은 순간들을 더 의식적으로 챙겨보세요. 습한 날씨 속에서도
                당신의 따뜻한 에너지가 주변을 밝혀주고 있으니, 내일도 그 평온함을 잃지 않으시길
                응원합니다.
              </p>
              <div className="mt-5 space-y-3">
                <ChatBubble tag="날씨 활용법" tone="green">
                  11°C 이슬비 날씨예요. 따뜻하게 입기를 챙겨보세요.
                </ChatBubble>
                <ChatBubble tag="감정 케어는" tone="green">
                  안정 루틴으로 내일도 좋은 흐름을 이어요.
                </ChatBubble>
              </div>
            </section>
          </div>
        </div>

        {/* 하단 탭 */}
        <BottomNav active="advice" />
      </div>
    </div>
  );
}

function ChatBubble({
  tag,
  tone,
  children,
}: {
  tag: string;
  tone: "green";
  children: React.ReactNode;
}) {
  const tagBg = tone === "green" ? "bg-[#7AC47D] text-white" : "";
  return (
    <div className="rounded-xl bg-[#eef7f0] px-4 py-3">
      <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${tagBg}`}>
        {tag}
      </span>
      <p className="mt-2 text-[12.5px] leading-[1.65] text-foreground/80 tracking-tight">
        {children}
      </p>
    </div>
  );
}
