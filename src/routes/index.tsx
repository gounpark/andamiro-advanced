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
import { getDiaryEntries, type DiaryEntry } from "@/lib/diaryStore";
import type { MoodKey } from "@/lib/videoStore";

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
  validateSearch: (search: Record<string, unknown>): { demo?: string } => ({
    demo: typeof search.demo === "string" ? search.demo : undefined,
  }),
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

/** 클로버 모양 SVG */
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

type DayState = "active" | "today" | "empty" | "out";
const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// ── 데모 모드 전용 하드코딩 데이터 ──────────────────────────────────────────
const DEMO_ACTIVE_DAYS = new Set([1, 4, 5, 8, 10, 14, 16, 18]);
const DEMO_TODAY_DAY = 21;
type DemoEntry = { time: string; title: string; description: string };
const DEMO_ENTRIES: Record<number, DemoEntry[]> = {
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
function weekdayOf(year: number, month: number, day: number): string {
  return WEEKDAY_KO[new Date(year, month - 1, day).getDay()];
}

// ── 캘린더 빌더 (범용) ────────────────────────────────────────────────────────
function buildCalendar(
  year: number,
  month: number,
  activeDays: Set<number>,
  todayDay: number | null
): { day: number; state: DayState }[][] {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: { day: number; state: DayState }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: 0, state: "out" });
  for (let d = 1; d <= daysInMonth; d++) {
    let state: DayState = "empty";
    if (d === todayDay) state = "today";
    else if (activeDays.has(d)) state = "active";
    cells.push({ day: d, state });
  }
  while (cells.length % 7 !== 0) cells.push({ day: 0, state: "out" });
  const weeks: { day: number; state: DayState }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// ── 무드 메타 ────────────────────────────────────────────────────────────────
const MOOD_EMOJI: Record<MoodKey, string> = {
  best: "🤩", good: "😊", okay: "😐", bad: "😔", worst: "😭",
};

function formatEntryTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ── DayCell ─────────────────────────────────────────────────────────────────
function DayCell({ day, state, selected, onClick }: {
  day: number; state: DayState; selected?: boolean; onClick?: () => void;
}) {
  if (state === "out") return <div className="h-[38px] w-[38px]" />;
  const labelColor = state === "empty" ? "text-[#9395a1]" : "text-white";
  const cloverSrc =
    state === "active" ? cloverActiveSvg : state === "today" ? cloverSpecialSvg : cloverEmptySvg;
  return (
    <button type="button" onClick={onClick} aria-label={`${day}일`} aria-pressed={selected}
      className="relative h-[38px] w-[38px] rounded-full transition-all"
    >
      <img src={cloverSrc} alt="" className="absolute inset-0 h-full w-full" />
      <span className={`absolute inset-0 flex items-center justify-center text-[12px] font-semibold ${labelColor}`}>
        {day}
      </span>
      {selected && (
        <span aria-hidden
          className="absolute left-1/2 -translate-x-1/2 -bottom-2 block h-[5px] w-[5px] rounded-full bg-[#11a757]"
        />
      )}
    </button>
  );
}

function Index() {
  const { demo: demoParam } = Route.useSearch();
  const demo = demoParam === "1" || demoParam === "2" || demoParam === "4" || demoParam === "5";
  const demoToRecord = demoParam === "2";
  const demoToReport = demoParam === "4";
  const demoToAdvice = demoParam === "5";
  const navigate = useNavigate();

  // ── 실제 데이터 상태 ────────────────────────────────────────────────────────
  const nowInit = new Date();
  const [viewYear, setViewYear] = useState(nowInit.getFullYear());
  const [viewMonth, setViewMonth] = useState(nowInit.getMonth() + 1);
  const [allEntries, setAllEntries] = useState<DiaryEntry[]>(() => getDiaryEntries());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // 화면 포커스 시 최신 일기 데이터 다시 로드 (녹화 후 돌아올 때)
  useEffect(() => {
    const reload = () => setAllEntries(getDiaryEntries());
    const onVisibility = () => { if (document.visibilityState === "visible") reload(); };
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // 월 변경 시 선택 날짜 초기화
  useEffect(() => { setSelectedDay(null); }, [viewYear, viewMonth]);

  // 실제 데이터 계산
  const now = new Date();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1;
  const realTodayDay = isCurrentMonth ? now.getDate() : null;

  const monthEntries = allEntries.filter((e) => {
    const [y, m] = e.date.split("-").map(Number);
    return y === viewYear && m === viewMonth;
  });
  const realActiveDays = new Set(monthEntries.map((e) => parseInt(e.date.split("-")[2])));

  const realEntriesForDay: DiaryEntry[] = selectedDay !== null
    ? monthEntries.filter((e) => parseInt(e.date.split("-")[2]) === selectedDay)
    : [];

  // ── 데모 vs 실제 데이터 선택 ────────────────────────────────────────────────
  const dispYear = demo ? 2026 : viewYear;
  const dispMonth = demo ? 4 : viewMonth;
  const dispActiveDays = demo ? DEMO_ACTIVE_DAYS : realActiveDays;
  const dispTodayDay = demo ? DEMO_TODAY_DAY : realTodayDay;
  const weeks = buildCalendar(dispYear, dispMonth, dispActiveDays, dispTodayDay);

  const demoEntries: DemoEntry[] = demo && selectedDay !== null ? (DEMO_ENTRIES[selectedDay] ?? []) : [];
  const entryCount = demo ? demoEntries.length : realEntriesForDay.length;

  // 월 이동 (실제 모드)
  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  };
  const monthLabel = `${dispYear}. ${String(dispMonth).padStart(2, "0")}`;

  // ── 데모 커서 상태 ────────────────────────────────────────────────────────
  const [cursor, setCursor] = useState({ x: 195, y: 300, tapping: false, visible: false });
  const frameRef = useRef<HTMLDivElement>(null);
  const ctaBtnRef = useRef<HTMLAnchorElement>(null);
  const day16Ref = useRef<HTMLDivElement>(null);
  const day21Ref = useRef<HTMLDivElement>(null);

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
        track(() => setCursor((c) => ({ ...c, tapping: true })), 1100);
        track(() => setCursor((c) => ({ ...c, tapping: false })), 1300);
        track(() => navigate({ to: "/record", search: { demo: "3" } }), 1500);
      });
      return () => { cancelled = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    } else if (demoToReport) {
      const raf = requestAnimationFrame(() => {
        const frame = frameRef.current;
        const tab = frame?.querySelector<HTMLElement>("#nav-tab-report");
        if (!tab || !frame) return;
        const tr = tab.getBoundingClientRect();
        const fr = frame.getBoundingClientRect();
        const cx = tr.left - fr.left + tr.width / 2;
        const cy = tr.top - fr.top + tr.height / 2;
        setCursor({ x: cx, y: cy + 80, tapping: false, visible: false });
        track(() => setCursor({ x: cx, y: cy + 80, tapping: false, visible: true }), 300);
        track(() => setCursor({ x: cx, y: cy, tapping: false, visible: true }), 700);
        track(() => setCursor((c) => ({ ...c, tapping: true })), 1100);
        track(() => setCursor((c) => ({ ...c, tapping: false })), 1300);
        track(() => navigate({ to: "/report", search: { demo: true } }), 1500);
      });
      return () => { cancelled = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    } else if (demoToAdvice) {
      const raf = requestAnimationFrame(() => {
        const frame = frameRef.current;
        const tab = frame?.querySelector<HTMLElement>("#nav-tab-advice");
        if (!tab || !frame) return;
        const tr = tab.getBoundingClientRect();
        const fr = frame.getBoundingClientRect();
        const cx = tr.left - fr.left + tr.width / 2;
        const cy = tr.top - fr.top + tr.height / 2;
        setCursor({ x: cx, y: cy + 80, tapping: false, visible: false });
        track(() => setCursor({ x: cx, y: cy + 80, tapping: false, visible: true }), 300);
        track(() => setCursor({ x: cx, y: cy, tapping: false, visible: true }), 700);
        track(() => setCursor((c) => ({ ...c, tapping: true })), 1100);
        track(() => setCursor((c) => ({ ...c, tapping: false })), 1300);
        track(() => navigate({ to: "/advice", search: { empty: false } }), 1500);
      });
      return () => { cancelled = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    } else {
      // demo=1: 날짜 셀 클릭 시연
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
          track(() => setCursor((c) => ({ ...c, tapping: true })), 1300);
          track(() => { setCursor((c) => ({ ...c, tapping: false })); setSelectedDay(16); }, 1500);
        }
        if (p21) {
          track(() => setCursor({ x: p21.x, y: p21.y, tapping: false, visible: true }), 3500);
          track(() => setCursor((c) => ({ ...c, tapping: true })), 3900);
          track(() => { setCursor((c) => ({ ...c, tapping: false })); setSelectedDay(21); }, 4100);
        }
        track(() => setCursor({ x: 195, y: 668, tapping: false, visible: true }), 5600);
        track(() => setCursor((c) => ({ ...c, tapping: true })), 6000);
        track(() => setCursor((c) => ({ ...c, tapping: false })), 6200);
        track(() => navigate({ to: "/analysis", search: { day: 21 } }), 6300);
      });
      return () => { cancelled = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, demoToRecord, demoToReport, demoToAdvice]);

  // 홈 진입 직후 idle 시간에 record 이미지 미리 캐시
  useEffect(() => {
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    const schedule = w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    const id = schedule(() => preloadRecordAssets());
    return () => { if (typeof id === "number") window.clearTimeout(id); };
  }, []);

  // 선택한 날 요일
  const selectedWeekday = selectedDay !== null ? weekdayOf(dispYear, dispMonth, selectedDay) : null;

  return (
    <div className="app-shell">
      <div ref={frameRef} className="app-frame" style={{ position: "relative" }}>
        {demo && <DemoCursor {...cursor} />}
        <div className="absolute inset-0 overflow-y-auto pb-[126px] bg-white">
          {/* 상단 그라디언트 헤더 */}
          <div className="relative overflow-hidden" style={{ background: "var(--gradient-sky)" }}>
            <img src={bgShapeLargeSvg} alt="" aria-hidden
              className="pointer-events-none absolute -top-2 -right-4 w-[260px] h-[275px] z-0" />
            <img src={bgShapeSmallSvg} alt="" aria-hidden
              className="pointer-events-none absolute top-[140px] -left-8 w-[142px] h-[196px] z-0" />

            <header className="relative z-10 flex items-center justify-start px-6 pt-[52px] pb-2">
              <h1 className="m-0 inline-flex">
                <img src={logoSvg} alt="안다미로" width={81} height={28}
                  className="block h-7 w-auto shrink-0" style={{ aspectRatio: "81 / 28" }} />
              </h1>
            </header>

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

          {/* 캘린더 */}
          <section className="relative z-10 -mt-3 rounded-t-[20px] bg-white px-6 pt-6 pb-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground text-[20px] tracking-tight">
                {monthLabel}
              </h2>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="이전 달"
                  onClick={demo ? undefined : prevMonth}
                  disabled={demo}
                  className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" aria-label="다음 달"
                  onClick={demo ? undefined : nextMonth}
                  disabled={demo}
                  className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-y-5">
              {WEEK_LABELS.map((d) => (
                <div key={d} className="text-center text-[12px] font-medium text-[#999] tracking-tight">
                  {d}
                </div>
              ))}
              {weeks.flat().map((cell, i) => (
                <div
                  key={i}
                  className="flex justify-center"
                  ref={
                    demo
                      ? cell.day === 16 ? day16Ref : cell.day === 21 ? day21Ref : undefined
                      : undefined
                  }
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

          {/* 선택한 날짜 기록 패널 */}
          {selectedDay !== null && (
            <section className="relative z-10 border-t border-[#f0f0f0] bg-white px-6 pt-5 pb-6">
              <div className="flex items-baseline gap-2">
                <h3 className="font-semibold text-foreground text-[15px] tracking-tight">
                  {dispMonth}월 {selectedDay}일 {selectedWeekday}요일
                </h3>
                <span className="text-[12px] text-[#999]">
                  · {entryCount === 0 ? "미작성" : `${entryCount}개의 기록`}
                </span>
              </div>

              <div className="mt-4">
                {demo ? (
                  // ── 데모 모드: 기존 하드코딩 표시 ──
                  demoEntries.length === 0 ? (
                    <DemoEmptyEntry />
                  ) : demoEntries.length === 1 ? (
                    <DemoSingleEntry entry={demoEntries[0]} day={selectedDay} />
                  ) : (
                    <DemoEntryList entries={demoEntries} day={selectedDay} />
                  )
                ) : (
                  // ── 실제 모드: localStorage 데이터 표시 ──
                  realEntriesForDay.length === 0 ? (
                    <EmptyEntry />
                  ) : realEntriesForDay.length === 1 ? (
                    <RealSingleEntry entry={realEntriesForDay[0]} />
                  ) : (
                    <RealEntryList entries={realEntriesForDay} />
                  )
                )}
              </div>
            </section>
          )}
        </div>

        <BottomNav active="home" />
      </div>
    </div>
  );
}

// ── 데모 전용 엔트리 컴포넌트 ─────────────────────────────────────────────────
function DemoEmptyEntry() {
  return (
    <div className="rounded-xl bg-[#f7f7f9] px-4 py-5 text-center">
      <p className="text-[13px] text-[#888]">아직 작성한 일기가 없어요.</p>
      <button type="button"
        className="mt-3 inline-flex items-center gap-1 font-semibold text-foreground text-[14px] tracking-tight">
        일기쓰러 가기
        <ChevronRightSm className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

function DemoSingleEntry({ entry, day }: { entry: DemoEntry; day: number }) {
  return (
    <Link to="/analysis" search={{ day }}
      className="flex w-full items-start justify-between gap-3 rounded-xl bg-[#f7f7f9] px-4 py-4 text-left transition-colors hover:bg-[#f0f0f3]">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground text-[14px] tracking-tight">{entry.title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#888]">{entry.description}</p>
      </div>
      <ChevronRightSm className="mt-1 h-4 w-4 shrink-0 text-[#bbb]" strokeWidth={2.2} />
    </Link>
  );
}

function DemoEntryList({ entries, day }: { entries: DemoEntry[]; day: number }) {
  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => (
        <Link key={i} to="/analysis" search={{ day }}
          className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f7f9] px-4 py-3.5 text-left transition-colors hover:bg-[#f0f0f3]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[12px] tabular-nums text-[#888]">{entry.time}</span>
            <span className="font-semibold text-foreground text-[14px] tracking-tight">{entry.title}</span>
          </div>
          <ChevronRightSm className="h-4 w-4 shrink-0 text-[#bbb]" strokeWidth={2.2} />
        </Link>
      ))}
    </div>
  );
}

// ── 실제 데이터 엔트리 컴포넌트 ───────────────────────────────────────────────
function EmptyEntry() {
  return (
    <div className="rounded-xl bg-[#f7f7f9] px-4 py-5 text-center">
      <p className="text-[13px] text-[#888]">아직 작성한 일기가 없어요.</p>
      <Link to="/record"
        className="mt-3 inline-flex items-center gap-1 font-semibold text-[var(--primary)] text-[14px] tracking-tight">
        기록하러 가기
        <ChevronRightSm className="h-4 w-4" strokeWidth={2.2} />
      </Link>
    </div>
  );
}

function RealSingleEntry({ entry }: { entry: DiaryEntry }) {
  const emoji = MOOD_EMOJI[entry.userMood as MoodKey] ?? "😐";
  const excerpt = entry.transcript
    ? entry.transcript.slice(0, 70) + (entry.transcript.length > 70 ? "..." : "")
    : entry.aiMoodLabel
    ? `AI 분석: ${entry.aiMoodLabel}`
    : "기록이 저장되었어요.";

  return (
    <Link to="/diary"
      className="flex w-full items-start justify-between gap-3 rounded-xl bg-[#f7f7f9] px-4 py-4 text-left transition-colors hover:bg-[#f0f0f3]">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground text-[14px] tracking-tight">
          {emoji} {entry.userMoodLabel}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#888]">{excerpt}</p>
      </div>
      <ChevronRightSm className="mt-1 h-4 w-4 shrink-0 text-[#bbb]" strokeWidth={2.2} />
    </Link>
  );
}

function RealEntryList({ entries }: { entries: DiaryEntry[] }) {
  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => {
        const emoji = MOOD_EMOJI[entry.userMood as MoodKey] ?? "😐";
        return (
          <Link key={entry.id} to="/diary"
            className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f7f9] px-4 py-3.5 text-left transition-colors hover:bg-[#f0f0f3]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[12px] tabular-nums text-[#888]">
                {formatEntryTime(entry.createdAt)}
              </span>
              <span className="font-semibold text-foreground text-[14px] tracking-tight">
                {emoji} {entry.userMoodLabel}
              </span>
            </div>
            <ChevronRightSm className="h-4 w-4 shrink-0 text-[#bbb]" strokeWidth={2.2} />
          </Link>
        );
      })}
    </div>
  );
}
