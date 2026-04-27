import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { gotoPath } from "@/lib/navigate";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { DemoCursor } from "@/components/DemoCursor";

import moodBest from "@/assets/moods/mood-best.webp";
import moodGood from "@/assets/moods/mood-good.webp";
import moodOkay from "@/assets/moods/mood-okay.webp";
import moodBad from "@/assets/moods/mood-bad.webp";
import moodWorst from "@/assets/moods/mood-worst.webp";

import moodBestBig from "@/assets/moods/mood-best-big.webp";
import moodGoodBig from "@/assets/moods/mood-good-big.webp";
import moodOkayBig from "@/assets/moods/mood-okay-big.webp";
import moodBadBig from "@/assets/moods/mood-bad-big.webp";
import moodWorstBig from "@/assets/moods/mood-worst-big.webp";
import moodEmpty from "@/assets/moods/mood-empty.webp";

// 배경은 용량이 크므로 lazy하게 로드 (?url 로 URL만 가져옴)
import bgBest from "@/assets/moods/bg-best.webp?url";
import bgGood from "@/assets/moods/bg-good.webp?url";
import bgOkay from "@/assets/moods/bg-okay.webp?url";
import bgBad from "@/assets/moods/bg-bad.webp?url";
import bgWorst from "@/assets/moods/bg-worst.webp?url";

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "기분 선택 — 안다미로" },
      { name: "description", content: "지금 가장 가까운 감정을 골라 오늘의 일기를 시작하세요." },
      { name: "theme-color", content: "#eaf1ff" },
    ],
  }),
  component: RecordPage,
});

type MoodKey = "best" | "good" | "okay" | "bad" | "worst";

type Mood = {
  key: MoodKey;
  label: string;       // 라벨 (말풍선)
  cta: string;         // 하단 CTA 문구
  thumb: string;       // 작은 썸네일 (선택 바)
  big: string;         // 큰 캐릭터
  bg: string;          // 배경
};

const MOODS: Mood[] = [
  {
    key: "best",
    label: "최고예요!",
    cta: "지금 이 기분, 함께 이야기해볼까요?",
    thumb: moodBest,
    big: moodBestBig,
    bg: bgBest,
  },
  {
    key: "good",
    label: "좋아요!",
    cta: "지금 이 기분, 함께 이야기해볼까요?",
    thumb: moodGood,
    big: moodGoodBig,
    bg: bgGood,
  },
  {
    key: "okay",
    label: "보통이에요",
    cta: "지금 이 기분, 함께 이야기해볼까요?",
    thumb: moodOkay,
    big: moodOkayBig,
    bg: bgOkay,
  },
  {
    key: "bad",
    label: "별로예요",
    cta: "지금 이 기분, 함께 이야기해볼까요?",
    thumb: moodBad,
    big: moodBadBig,
    bg: bgBad,
  },
  {
    key: "worst",
    label: "최악이에요",
    cta: "지금 이 기분, 함께 이야기해볼까요?",
    thumb: moodWorst,
    big: moodWorstBig,
    bg: bgWorst,
  },
];

const BIG_CHARACTER_OFFSET_X: Partial<Record<MoodKey, number>> = {
  good: 20,
  bad: 20,
};

const EMPTY_CHARACTER_OFFSET_X = 20;

// 모듈 로드 즉시 무드 이미지 프리로드 (라우트가 import되는 순간 캐시 시작)
if (typeof window !== "undefined") {
  MOODS.forEach((m) => {
    [m.thumb, m.big, m.bg].forEach((u) => {
      const img = new Image();
      img.decoding = "async";
      img.src = u;
    });
  });
}

function RecordPage() {
  const demoParam = new URLSearchParams(window.location.search).get("demo");
  // demo=1: "good" 미리 선택 + 시작하기 클릭 → 채팅 이동 (주요기능 02)
  // demo=3: 감정 순환 선택만 (화면 전환 없음, 주요기능 01 마지막 장면)
  const demo1 = demoParam === "1";
  const demo3 = demoParam === "3";
  const navigate = useNavigate();
  const [selected, setSelected] = useState<MoodKey | null>(demo1 ? "good" : null);

  // 커서 상태 (데모 모드)
  const [cursor, setCursor] = useState({ x: 195, y: 690, tapping: false, visible: false });

  // demo=1: good 미리 선택 상태 → 커서가 시작하기 버튼 클릭 → 채팅으로 이동
  useEffect(() => {
    if (!demo1) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const ctaX = 195, ctaY = 810;

    timers.push(setTimeout(() => setCursor({ x: ctaX, y: ctaY, tapping: false, visible: true }), 700));
    timers.push(setTimeout(() => setCursor(c => ({ ...c, tapping: true })), 1200));
    timers.push(setTimeout(() => setCursor(c => ({ ...c, tapping: false })), 1450));
    timers.push(setTimeout(() => { gotoPath("/chat?mood=good&demo=1"); }, 1650));

    return () => timers.forEach(clearTimeout);
  }, [demo1]); // eslint-disable-line react-hooks/exhaustive-deps

  // demo=3: 감정 순환 선택 애니메이션 (화면 전환 없이 종료)
  useEffect(() => {
    if (!demo3) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const pickerX = 120, pickerY = 688;
    timers.push(setTimeout(() => setCursor({ x: pickerX, y: pickerY, tapping: false, visible: true }), 400));

    const sequence: MoodKey[] = ["best", "good", "okay", "bad", "worst", "good"];
    const delays =              [800,   1700,  2600,  3500,  4400,  5300];
    sequence.forEach((mood, i) => {
      timers.push(setTimeout(() => setCursor(c => ({ ...c, tapping: true })),  delays[i] - 150));
      timers.push(setTimeout(() => { setCursor(c => ({ ...c, tapping: false })); setSelected(mood); }, delays[i]));
    });

    return () => timers.forEach(clearTimeout);
  }, [demo3]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = selected ? MOODS.find((m) => m.key === selected)! : null;
  const hasSelection = current !== null;

  // 모든 무드 이미지를 페이지 진입 즉시 프리로드 (브라우저 캐시에 미리 올림)
  useEffect(() => {
    const urls: string[] = [];
    MOODS.forEach((m) => {
      urls.push(m.big);
      urls.push(m.bg);
      urls.push(m.thumb);
    });
    urls.forEach((u) => {
      const img = new Image();
      img.decoding = "async";
      img.src = u;
    });
  }, []);

  return (
    <div className="app-shell">
      <div className="app-frame" style={{ position: "relative" }}>
        {(demo1 || demo3) && <DemoCursor {...cursor} />}
        {/* 배경 — 선택 전: 연한 하늘 / 선택 후: 해당 무드 배경 */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: hasSelection
              ? undefined
              : "linear-gradient(180deg, oklch(0.95 0.025 240) 0%, oklch(0.97 0.012 240) 60%, #ffffff 100%)",
          }}
        />
        {/* 모든 배경 이미지를 미리 깔아두고 opacity로만 전환 → 클릭 시 즉시 표시 */}
        {MOODS.map((m) => (
          <img
            key={`bg-${m.key}`}
            src={m.bg}
            alt=""
            aria-hidden
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
            style={{ opacity: selected === m.key ? 1 : 0 }}
          />
        ))}

        {/* 콘텐츠 */}
        <div className="relative z-10 flex h-full flex-col">
          {/* 헤더 (뒤로가기) */}
          <header className="flex items-center px-5 pt-[52px] pb-1">
            <Link
              to="/"
              aria-label="뒤로 가기"
              className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:text-foreground"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
            </Link>
          </header>

          {/* 타이틀 */}
          <section className="px-6 pt-3">
            <p
              className="text-[15px] tracking-tight transition-colors duration-300"
              style={{ color: selected === "worst" ? "#ffffff" : "#8a8d96" }}
            >
              가장 가까운 감정을 골라주세요
            </p>
            <h1
              className="mt-2 font-bold text-[28px] leading-[1.25] tracking-tight transition-colors duration-300"
              style={{ color: selected === "worst" ? "#ffffff" : undefined }}
            >
              지금 기분이 어때요?
            </h1>
          </section>

          {/* 캐릭터 영역 */}
          <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-10 pb-4 min-h-0">
            {/* 말풍선 */}
            <div className="rounded-full bg-white/95 px-5 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
              {current ? (
                <span className="font-semibold text-foreground text-[15px] tracking-tight">
                  {current.label}
                </span>
              ) : (
                <span className="text-foreground/50 text-[18px] leading-none tracking-widest font-bold">
                  •••
                </span>
              )}
            </div>

            {/* 캐릭터 — 모든 캐릭터를 동일한 크기(280px)로 강제하여 시각 크기 통일 */}
            <div className="relative mt-3 h-[300px] w-[300px] flex items-center justify-center">
              <img
                src={moodEmpty}
                alt="감정을 선택해주세요"
                decoding="async"
                fetchPriority="high"
                className="absolute inset-0 m-auto h-[280px] w-[280px] object-contain transition-opacity duration-300"
                style={{
                  opacity: hasSelection ? 0 : 1,
                  transform: `translateX(${EMPTY_CHARACTER_OFFSET_X}px)`,
                }}
              />
              {MOODS.map((m) => (
                <img
                  key={`char-${m.key}`}
                  src={m.big}
                  alt={m.label}
                  decoding="async"
                  className="absolute inset-0 m-auto h-[280px] w-[280px] object-contain transition-opacity duration-300"
                  style={{
                    opacity: selected === m.key ? 1 : 0,
                    transform: `translateX(${BIG_CHARACTER_OFFSET_X[m.key] ?? 0}px)`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* 무드 선택 — 순환 슬라이딩 트랙 */}
          <MoodPicker
            moods={MOODS}
            selected={selected}
            onSelect={(k) => setSelected(k)}
          />

          {/* 하단 CTA 패널 — Figma 121:632 기준: 둥근 모서리 + 상단 ▲ 노치 */}
          <section
            className="relative bg-white px-6 pt-5 pb-[46px] rounded-t-[24px]"
            style={{
              boxShadow:
                "0 -8px 24px -6px rgba(20, 30, 60, 0.12), 0 -2px 6px -2px rgba(20, 30, 60, 0.06)",
            }}
          >
            {/* 시트 상단 ▲ 노치 — 첫 슬롯(선택 칩) 바로 아래 위치 */}
            {hasSelection && (
              <svg
                aria-hidden
                width="32"
                height="18"
                viewBox="0 0 32 18"
                className="absolute"
                style={{
                  left: 24 + 36,
                  top: -16,
                  transform: "translateX(-50%)",
                  filter:
                    "drop-shadow(0 -3px 4px rgba(20, 30, 60, 0.10))",
                }}
              >
                <path
                  d="M14.5 1.5 Q16 0 17.5 1.5 L30 16 Q31 17.5 29 17.5 L3 17.5 Q1 17.5 2 16 Z"
                  fill="#ffffff"
                />
              </svg>
            )}
            <p className="text-[12px] text-[#9a9aa3] tracking-tight">오늘의 감정톡</p>
            <h2 className="mt-1 font-bold text-foreground text-[17px] leading-snug tracking-tight">
              {current ? current.cta : "감정 선택하고 대화 시작하기"}
            </h2>

            <button
              type="button"
              disabled={!hasSelection}
              onClick={() => {
                if (!selected) return;
                navigate({ to: "/chat", search: { mood: selected } });
              }}
              className={`mt-3 flex w-full items-center justify-center rounded-2xl py-3.5 font-semibold text-[15px] tracking-tight transition-all ${
                hasSelection
                  ? "bg-[var(--primary)] text-white shadow-md active:scale-[0.99]"
                  : "bg-[#e8e8ec] text-[#a8a8b0] cursor-not-allowed"
              }`}
            >
              시작하기
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * MoodPicker — 화살표 인디케이터는 고정, 감정 칩 트랙이 가로로 슬라이드.
 * 선택된 감정이 항상 인디케이터(왼쪽에서 두 번째 자리) 위치로 이동.
 */
function MoodPicker({
  moods,
  selected,
  onSelect,
}: {
  moods: Mood[];
  selected: MoodKey | null;
  onSelect: (k: MoodKey) => void;
}) {
  const ITEM = 72; // chip diameter
  const GAP = 16;  // gap between chips
  const PADDING_LEFT = 24;

  const selectedIndex = selected ? moods.findIndex((m) => m.key === selected) : -1;

  // 순환 정렬: 선택된 칩이 첫 번째에 오고, 이후는 원래 순서대로 뒤에서 이어짐.
  // 예) 선택 = worst(4) → [worst, best, good, okay, bad]
  const ordered =
    selectedIndex >= 0
      ? [...moods.slice(selectedIndex), ...moods.slice(0, selectedIndex)]
      : moods;

  return (
    <div className="relative pb-8 pt-12 select-none overflow-hidden">
      {/* 첫 슬롯(선택 칩)에 파란 링 — key 고정으로 위치 자체에 붙임 */}
      {selected && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-20 rounded-full ring-[3px] ring-[#7aa7ff]"
          style={{
            left: PADDING_LEFT,
            top: 48,
            width: ITEM,
            height: ITEM,
          }}
        />
      )}

      {/* 칩 트랙 — 순환 재정렬 (선택 칩이 항상 첫 자리) */}
      <div
        className="flex"
        style={{
          gap: `${GAP}px`,
          paddingLeft: PADDING_LEFT,
          paddingRight: PADDING_LEFT,
        }}
      >
        {ordered.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onSelect(m.key)}
            aria-pressed={selected === m.key}
            aria-label={m.label}
            className="relative shrink-0 grid place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-200 active:scale-95"
            style={{ width: ITEM, height: ITEM }}
          >
            <img src={m.thumb} alt="" className="h-12 w-12 object-contain" />
          </button>
        ))}
      </div>
    </div>
  );
}