import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { DemoCursor } from "@/components/DemoCursor";
import { ArrowRight, ChevronLeft, ChevronRight, ChevronRight as ChevronRightSm } from "lucide-react";
import cloverEmptySvg from "@/assets/icons/clover-empty.svg";
import cloverSpecialSvg from "@/assets/icons/clover-special.svg";
import cloverActiveSvg from "@/assets/icons/clover-active.svg";
import logoSvg from "@/assets/icons/logo.svg";
import bgShapeLargeSvg from "@/assets/icons/bg-shape-large.svg";
import bgShapeSmallSvg from "@/assets/icons/bg-shape-small.svg";
import { BottomNav } from "@/components/BottomNav";

// record 페이지에서 쓰일 무드 이미지 URL — 메인 진입 직후 백그라운드 프리로드
import bgBest from "@/assets/moods/bg-best.webp?url";
import bgGood from "@/assets/moods/bg-good.webp?url";
import bgOkay from "@/assets/moods/bg-okay.webp?url";
import bgBad from "@/assets/moods/bg-bad.webp?url";
import bgWorst from "@/assets/moods/bg-worst.webp?url";
import bigBest from "@/assets/moods/mood-best-big.webp?url";
import bigGood from "@/assets/moods/mood-good-big.webp?url";
import bigOkay from "@/assets/moods/mood-okay-big.webp?url";
import bigBad from "@/assets/moods/mood-bad-big.webp?url";
import bigWorst from "@/assets/moods/mood-worst-big.webp?url";
import moodEmptyUrl from "@/assets/moods/mood-empty.webp?url";

const RECORD_PRELOAD_URLS = [
  moodEmptyUrl,
  bigBest, bigGood, bigOkay, bigBad, bigWorst,
  bgBest, bgGood, bgOkay, bgBad, bgWorst,
];

function preloadRecordAssets() {
  RECORD_PRELOAD_URLS.forEach((u) => {
    const img = new Image();
    img.decoding = "async";
    img.src = u;
  });
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "안다미로 — 오늘의 감정 일기" },
      { name: "description", content: "매일의 마음을 클로버로 기록하는 감정 일기 앱, 안다미로." },
      { property: "og:title", content: "안다미로 — 오늘의 감정 일기" },
      { property: "og:description", content: "매일의 마음을 클로버로 기록하는 감정 일기 앱." },
      { name: "theme-color", content: "#5b8def" },
    ],
  }),
  component: Index,
});

/** 클로버 모양 SVG (4잎 하트 클로버) */
function Clover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 38" className={className} aria-hidden="true">
      <path
        d="M19 4c-2.5 0-4.5 2-4.5 4.5 0 1 .3 1.9.8 2.6-.7-.5-1.6-.8-2.6-.8C10.2 10.3 8.2 12.3 8.2 14.8s2 4.5 4.5 4.5c1 0 1.9-.3 2.6-.8-.5.7-.8 1.6-.8 2.6 0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5c0-1-.3-1.9-.8-2.6.7.5 1.6.8 2.6.8 2.5 0 4.5-2 4.5-4.5s-2-4.5-4.5-4.5c-1 0-1.9.3-2.6.8.5-.7.8-1.6.8-2.6C23.5 6 21.5 4 19 4z"
        fill="currentColor"
      />
      <rect x="17.5" y="22" width="3" height="10" rx="1.5" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

// active=노랑(작성됨), today=초록(오늘), empty=회색(미작성), out=달력 외 빈칸
type DayState = "active" | "today" | "empty" | "out";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** 2026년 4월 — 1일이 수요일 기준. 작성된 날(노랑) / 오늘(초록=21일) */
const ACTIVE_DAYS = new Set([1, 4, 5, 8, 10, 14, 16, 18]);
const TODAY_DAY = 21;

/** 날짜별 기록 더미 데이터 — 작성된 모든 날에 데이터가 있어야 리포트로 연결 가능 */
type DiaryEntry = { time: string; title: string; description: string };
const ENTRIES: Record<number, DiaryEntry[]> = {
  1: [{ time: "21:10", title: "설렘", description: "새로운 달의 시작, 작은 기대들로 가득했어요." }],
  4: [{ time: "11:24", title: "활기참", description: "산책하며 햇살을 듬뿍 받은 상쾌한 하루였어요." }],
  5: [
    { time: "08:40", title: "평온함", description: "여유로운 아침, 천천히 흘러간 시간." },
    { time: "20:02", title: "감사", description: "작은 친절에 마음이 따뜻해졌어요." },
  ],
  8: [{ time: "14:18", title: "집중", description: "몰입한 작업 후의 뿌듯함이 남는 하루." }],
  10: [{ time: "19:30", title: "기쁨", description: "오랜만에 만난 친구와 즐거운 저녁." }],
  14: [{ time: "13:05", title: "안정감", description: "잔잔한 하루, 마음이 고요했어요." }],
  16: [
    { time: "07:50", title: "설렘", description: "기대감으로 시작한 아침." },
    { time: "22:10", title: "성취", description: "마무리한 일을 돌아보며 만족스러운 마무리." },
  ],
  18: [{ time: "09:12", title: "평온함", description: "차분하고 안정적인 하루, 이날의 기록을 함께 돌아봐요." }],
  21: [
    { time: "06:56", title: "평온함", description: "차분하고 안정적인 하루, 이날의 기록을 함께 돌아봐요." },
    { time: "16:35", title: "설렘", description: "기대감으로 가득한 순간이었어요." },
  ],
};

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
/** 2026-04-DD 요일 계산 (4월 1일 = 수요일) */
function getWeekdayLabel(day: number): string {
  // 1일=수요일(index 3)
  const idx = (3 + (day - 1)) % 7;
  return WEEKDAY_KO[idx];
}

function buildCalendar(): { day: number; state: DayState }[][] {
  // 4월 1일 = 수요일 → 앞에 빈칸 3개 (일,월,화)
  const cells: { day: number; state: DayState }[] = [];
  for (let i = 0; i < 3; i++) cells.push({ day: 0, state: "out" });
  for (let d = 1; d <= 30; d++) {
    let state: DayState = "empty";
    if (d === TODAY_DAY) state = "today";
    else if (ACTIVE_DAYS.has(d)) state = "active";
    cells.push({ day: d, state });
  }
  while (cells.length % 7 !== 0) cells.push({ day: 0, state: "out" });
  const weeks: { day: number; state: DayState }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function DayCell({
  day,
  state,
  selected,
  onClick,
}: {
  day: number;
  state: DayState;
  selected?: boolean;
  onClick?: () => void;
}) {
  if (state === "out") return <div className="h-[38px] w-[38px]" />;

  const labelColor = state === "empty" ? "text-[#9395a1]" : "text-white";
  const cloverSrc =
    state === "active" ? cloverActiveSvg : state === "today" ? cloverSpecialSvg : cloverEmptySvg;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${day}일`}
      aria-pressed={selected}
      className="relative h-[38px] w-[38px] rounded-full transition-all"
    >
      <img src={cloverSrc} alt="" className="absolute inset-0 h-full w-full" />
      <span
        className={`absolute inset-0 flex items-center justify-center text-[12px] font-semibold ${labelColor}`}
      >
        {day}
      </span>
      {selected && (
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 -bottom-2 block h-[5px] w-[5px] rounded-full bg-[#11a757]"
        />
      )}
    </button>
  );
}

function Index() {
  const demoParam = new URLSearchParams(window.location.search).get("demo");
  // demo=1: 날짜 선택만 / demo=2: CTA 클릭 → /record / demo=4: 리포트탭 클릭 → /report / demo=5: 조언탭 클릭 → /advice
  const demo = demoParam === "1" || demoParam === "2" || demoParam === "4" || demoParam === "5";
  const demoToRecord = demoParam === "2";
  const demoToReport = demoParam === "4";
  const demoToAdvice = demoParam === "5";
  const navigate = useNavigate();
  const weeks = buildCalendar();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const entries = selectedDay !== null ? ENTRIES[selectedDay] ?? [] : [];

  // 커서 상태 (데모 모드)
  const [cursor, setCursor] = useState({ x: 195, y: 300, tapping: false, visible: false });
  const frameRef = useRef<HTMLDivElement>(null);
  const ctaBtnRef = useRef<HTMLAnchorElement>(null);
  // 캘린더 날짜 셀 ref (day 16 = 노란날, day 21 = 초록날)
  const day16Ref = useRef<HTMLDivElement>(null);
  const day21Ref = useRef<HTMLDivElement>(null);

  // 데모 모드
  useEffect(() => {
    if (!demo) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const track = (fn: () => void, delay: number) => {
      const t = setTimeout(() => { if (!cancelled) fn(); }, delay);
      timers.push(t);
      return t;
    };

    if (demoToRecord) {
      // demo=2 (주요기능01): "오늘 기록 남기러 가기" CTA 버튼 클릭
      const raf = requestAnimationFrame(() => {
        const btn = ctaBtnRef.current;
        const frame = frameRef.current;
        if (!btn || !frame) return;
        const br = btn.getBoundingClientRect();
        const fr = frame.getBoundingClientRect();
        const cx = br.left - fr.left + br.width / 2;
        const cy = br.top - fr.top + br.height / 2;
        setCursor({ x: cx, y: cy + 180, tapping: false, visible: false });
        track(() => setCursor({ x: cx, y: cy + 180, tapping: false, visible: true }), 300);
        track(() => setCursor({ x: cx, y: cy, tapping: false, visible: true }), 700);
        track(() => setCursor(c => ({ ...c, tapping: true })), 1100);
        track(() => setCursor(c => ({ ...c, tapping: false })), 1300);
        track(() => navigate({ to: "/record", search: { demo: "3" } }), 1500);
      });
      return () => { cancelled = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };

    } else if (demoToReport) {
      // demo=4 (주요기능04): 하단 리포트 탭 클릭
      const raf = requestAnimationFrame(() => {
        const frame = frameRef.current;
        const tab = frame?.querySelector<HTMLElement>('#nav-tab-report');
        if (!tab || !frame) return;
        const tr = tab.getBoundingClientRect();
        const fr = frame.getBoundingClientRect();
        const cx = tr.left - fr.left + tr.width / 2;
        const cy = tr.top - fr.top + tr.height / 2;
        setCursor({ x: cx, y: cy + 80, tapping: false, visible: false });
        track(() => setCursor({ x: cx, y: cy + 80, tapping: false, visible: true }), 300);
        track(() => setCursor({ x: cx, y: cy, tapping: false, visible: true }), 700);
        track(() => setCursor(c => ({ ...c, tapping: true })), 1100);
        track(() => setCursor(c => ({ ...c, tapping: false })), 1300);
        track(() => navigate({ to: "/report", search: { demo: true } }), 1500);
      });
      return () => { cancelled = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };

    } else if (demoToAdvice) {
      // demo=5 (주요기능05): 하단 조언 탭 클릭
      const raf = requestAnimationFrame(() => {
        const frame = frameRef.current;
        const tab = frame?.querySelector<HTMLElement>('#nav-tab-advice');
        if (!tab || !frame) return;
        const tr = tab.getBoundingClientRect();
        const fr = frame.getBoundingClientRect();
        const cx = tr.left - fr.left + tr.width / 2;
        const cy = tr.top - fr.top + tr.height / 2;
        setCursor({ x: cx, y: cy + 80, tapping: false, visible: false });
        track(() => setCursor({ x: cx, y: cy + 80, tapping: false, visible: true }), 300);
        track(() => setCursor({ x: cx, y: cy, tapping: false, visible: true }), 700);
        track(() => setCursor(c => ({ ...c, tapping: true })), 1100);
        track(() => setCursor(c => ({ ...c, tapping: false })), 1300);
        track(() => navigate({ to: "/advice", search: { empty: false } }), 1500);
      });
      return () => { cancelled = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };

    } else {
      // demo=1 (소개): 날짜 셀 클릭 → 분석 화면 이동
      const raf = requestAnimationFrame(() => {
        const frame = frameRef.current;
        if (!frame) return;
        const fr = frame.getBoundingClientRect();
        const getCenter = (el: HTMLElement | null) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left - fr.left + r.width / 2, y: r.top - fr.top + r.height / 2 };
        };
        const p16 = getCenter(day16Ref.current);
        const p21 = getCenter(day21Ref.current);

        if (p16) {
          track(() => setCursor({ x: p16.x, y: p16.y + 100, tapping: false, visible: true }), 500);
          track(() => setCursor({ x: p16.x, y: p16.y, tapping: false, visible: true }), 900);
          track(() => setCursor(c => ({ ...c, tapping: true })), 1300);
          track(() => { setCursor(c => ({ ...c, tapping: false })); setSelectedDay(16); }, 1500);
        }
        if (p21) {
          track(() => setCursor({ x: p21.x, y: p21.y, tapping: false, visible: true }), 3500);
          track(() => setCursor(c => ({ ...c, tapping: true })), 3900);
          track(() => { setCursor(c => ({ ...c, tapping: false })); setSelectedDay(21); }, 4100);
        }
        // 21일 기록 항목 클릭 → 분석 화면
        track(() => setCursor({ x: 195, y: 668, tapping: false, visible: true }), 5600);
        track(() => setCursor(c => ({ ...c, tapping: true })), 6000);
        track(() => setCursor(c => ({ ...c, tapping: false })), 6200);
        track(() => navigate({ to: "/analysis", search: { day: 21 } }), 6300);
      });
      return () => { cancelled = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, demoToRecord, demoToReport, demoToAdvice]);

  // 홈 진입 직후 idle 시간에 record 이미지들을 미리 캐시
  useEffect(() => {
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    const schedule = w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    const id = schedule(() => preloadRecordAssets());
    return () => {
      if (typeof id === "number") window.clearTimeout(id);
    };
  }, []);

  return (
    <div className="app-shell">
      <div ref={frameRef} className="app-frame" style={{ position: "relative" }}>
        {demo && <DemoCursor {...cursor} />}
        {/* 스크롤 영역 — 흰 배경이 스크롤 끝까지 이어지도록 내부에서 그라디언트→흰색 흐름 구성 */}
        <div className="absolute inset-0 overflow-y-auto pb-[126px] bg-white">
        {/* 상단 그라디언트 헤더 영역 (캘린더 시작 전까지) */}
        <div
          className="relative overflow-hidden"
          style={{ background: "var(--gradient-sky)" }}
        >
          {/* 배경 장식 — 우상단 큰 도형 + 좌측 작은 도형 */}
          <img
            src={bgShapeLargeSvg}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -top-2 -right-4 w-[260px] h-[275px] z-0"
          />
          <img
            src={bgShapeSmallSvg}
            alt=""
            aria-hidden
            className="pointer-events-none absolute top-[140px] -left-8 w-[142px] h-[196px] z-0"
          />

        {/* 상단 로고 */}
        <header className="relative z-10 flex items-center justify-start px-6 pt-[52px] pb-2">
          <h1 className="m-0 inline-flex">
            <img
              src={logoSvg}
              alt="안다미로"
              width={81}
              height={28}
              className="block h-7 w-auto shrink-0"
              style={{ aspectRatio: "81 / 28" }}
            />
          </h1>
        </header>

        {/* 인사 + CTA */}
        <section className="relative z-10 px-6 pt-2 pb-6">
          <p className="text-[#f8f8f8] text-[18px] leading-tight tracking-tight">
            오늘 하루는 어떠셨나요?
          </p>
          <p className="mt-1 font-semibold text-white text-[22px] leading-tight tracking-tight">
            지금 마음을 가볍게 남겨보세요!
          </p>

          <Link
            ref={ctaBtnRef}
            to="/record"
            onPointerEnter={preloadRecordAssets}
            onTouchStart={preloadRecordAssets}
            className="mt-4 flex w-full items-center justify-between rounded-lg bg-white px-4 py-2.5 shadow-sm transition-transform active:scale-[0.99]"
          >
            <span className="font-semibold text-[var(--primary)] text-[14px] tracking-tight">
              오늘 기록 남기러 가기
            </span>
            <ArrowRight className="h-5 w-5 text-[var(--primary)]" strokeWidth={2.2} />
          </Link>
        </section>
        </div>

        {/* 캘린더 컨테이너 */}
        <section className="relative z-10 -mt-3 rounded-t-[20px] bg-white px-6 pt-6 pb-6">
          {/* 월 헤더 */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-[20px] tracking-tight">
              2026. 04
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="이전 달"
                className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="다음 달"
                className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 요일 라벨 */}
          <div className="mt-5 grid grid-cols-7 gap-y-5">
            {WEEK_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-[12px] font-medium text-[#999] tracking-tight"
              >
                {d}
              </div>
            ))}

            {/* 날짜 셀 */}
            {weeks.flat().map((cell, i) => (
              <div
                key={i}
                className="flex justify-center"
                ref={cell.day === 16 ? day16Ref : cell.day === 21 ? day21Ref : undefined}
              >
                <DayCell
                  day={cell.day}
                  state={cell.state}
                  selected={cell.state !== "out" && selectedDay === cell.day}
                  onClick={() => setSelectedDay(cell.day)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 선택한 날짜의 기록 패널 */}
        {selectedDay !== null && (
          <section className="relative z-10 border-t border-[#f0f0f0] bg-white px-6 pt-5 pb-6">
            <div className="flex items-baseline gap-2">
              <h3 className="font-semibold text-foreground text-[15px] tracking-tight">
                4월 {selectedDay}일 {getWeekdayLabel(selectedDay)}요일
              </h3>
              <span className="text-[12px] text-[#999]">
                ·{entries.length === 0 ? "미작성" : `${entries.length}개의 기록`}
              </span>
            </div>

            <div className="mt-4">
              {entries.length === 0 ? (
                <EmptyEntry />
              ) : entries.length === 1 ? (
                <SingleEntry entry={entries[0]} day={selectedDay} />
              ) : (
                <EntryList entries={entries} day={selectedDay} />
              )}
            </div>
          </section>
        )}
        </div>

        {/* 하단 탭바 */}
        <BottomNav active="home" />
      </div>
    </div>
  );
}

function EmptyEntry() {
  return (
    <div className="rounded-xl bg-[#f7f7f9] px-4 py-5 text-center">
      <p className="text-[13px] text-[#888]">아직 작성한 일기가 없어요.</p>
      <button
        type="button"
        className="mt-3 inline-flex items-center gap-1 font-semibold text-foreground text-[14px] tracking-tight"
      >
        일기쓰러 가기
        <ChevronRightSm className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

function SingleEntry({ entry, day }: { entry: DiaryEntry; day: number }) {
  return (
    <Link
      to="/analysis"
      search={{ day }}
      className="flex w-full items-start justify-between gap-3 rounded-xl bg-[#f7f7f9] px-4 py-4 text-left transition-colors hover:bg-[#f0f0f3]"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground text-[14px] tracking-tight">
          {entry.title}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#888]">
          {entry.description}
        </p>
      </div>
      <ChevronRightSm className="mt-1 h-4 w-4 shrink-0 text-[#bbb]" strokeWidth={2.2} />
    </Link>
  );
}

function EntryList({ entries, day }: { entries: DiaryEntry[]; day: number }) {
  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => (
        <Link
          key={i}
          to="/analysis"
          search={{ day }}
          className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f7f9] px-4 py-3.5 text-left transition-colors hover:bg-[#f0f0f3]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[12px] tabular-nums text-[#888]">{entry.time}</span>
            <span className="font-semibold text-foreground text-[14px] tracking-tight">
              {entry.title}
            </span>
          </div>
          <ChevronRightSm className="h-4 w-4 shrink-0 text-[#bbb]" strokeWidth={2.2} />
        </Link>
      ))}
    </div>
  );
}
