import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import { getVideoRecord, clearVideoRecord, type VideoRecord, type EmotionSnapshot, type MoodKey } from "@/lib/videoStore";
import { saveDiaryEntry, todayString } from "@/lib/diaryStore";

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

import bgBest from "@/assets/moods/bg-best.webp?url";
import bgGood from "@/assets/moods/bg-good.webp?url";
import bgOkay from "@/assets/moods/bg-okay.webp?url";
import bgBad from "@/assets/moods/bg-bad.webp?url";
import bgWorst from "@/assets/moods/bg-worst.webp?url";
import iconChat from "@/assets/analysis/insight-icon-container.svg";
import iconAiBook from "@/assets/analysis/preparation-header-icon.svg";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "오늘의 일기분석 — 안다미로" },
      { name: "description", content: "오늘의 채팅을 바탕으로 한 데일리 감정 분석." },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { day?: number; demo?: boolean } => {
    const n = typeof search.day === "number" ? search.day : Number(search.day);
    return {
      ...(Number.isFinite(n) && n > 0 ? { day: n } : {}),
      ...(search.demo === true || search.demo === "true" ? { demo: true } : {}),
    };
  },
  component: AnalysisPage,
});

type Metric = { label: string; value: number };

type DailyData = {
  score: number;
  mood: string;
  metrics: Metric[];
  summaryTitle: string;
  summaryBody: string;
  chatRecap: string;
  tomorrow: { num: number; title: string; body: string }[];
};

const DAILY_DATA: Record<number, DailyData> = {
  1: {
    score: 82, mood: "설렘",
    metrics: [
      { label: "에너지", value: 85 }, { label: "안정감", value: 70 },
      { label: "집중력", value: 78 }, { label: "긍정성", value: 88 },
    ],
    summaryTitle: "새 출발의 활기가 가득해요!",
    summaryBody: "새로운 달의 시작과 함께 들뜬 마음이 잘 드러나는 하루였어요. 작은 목표를 세워두면 이 설렘이 좋은 동력이 될 거예요. 너무 욕심내기보다는 하나씩 차근히 즐기며 시작하시길 바라요.",
    chatRecap: "달의 첫날을 작은 기대들로 채우며, 가볍지만 활기찬 분위기로 보낸 하루였어요.",
    tomorrow: [
      { num: 1, title: "월간 목표 정리", body: "들뜬 에너지를 명확한 계획으로 옮겨보세요." },
      { num: 2, title: "친구에게 안부 인사", body: "긍정 에너지를 나누면 두 배가 됩니다." },
    ],
  },
  4: {
    score: 78, mood: "활기참",
    metrics: [
      { label: "에너지", value: 90 }, { label: "안정감", value: 65 },
      { label: "집중력", value: 70 }, { label: "긍정성", value: 82 },
    ],
    summaryTitle: "햇살처럼 환한 하루였어요!",
    summaryBody: "산책과 햇살이 만들어준 상쾌함이 종일 이어진 하루였어요. 이런 활기는 몸과 마음의 좋은 리듬을 만들어주니, 내일도 가볍게 움직이는 습관을 이어가 보세요.",
    chatRecap: "햇살 아래 산책과 함께 가벼운 마음으로 활기를 충전한 하루였어요.",
    tomorrow: [
      { num: 1, title: "20분 야외 걷기", body: "오늘의 좋은 흐름을 자연스럽게 이어가요." },
      { num: 2, title: "충분한 수분 섭취", body: "에너지가 높을수록 회복도 중요해요." },
    ],
  },
  5: {
    score: 80, mood: "감사",
    metrics: [
      { label: "에너지", value: 70 }, { label: "안정감", value: 85 },
      { label: "집중력", value: 72 }, { label: "긍정성", value: 90 },
    ],
    summaryTitle: "따뜻함이 마음에 머문 하루",
    summaryBody: "여유로운 아침과 작은 친절이 더해진 따뜻한 하루였어요. 감사의 감정은 안정감을 키워주니, 짧은 메모로 오늘의 고마움을 적어두면 좋아요.",
    chatRecap: "느긋한 아침과 따뜻한 마주침으로 마음이 차분히 채워진 하루.",
    tomorrow: [
      { num: 1, title: "감사 일기 한 줄", body: "오늘 받은 따뜻함을 기록해보세요." },
      { num: 2, title: "느린 아침 루틴", body: "여유의 리듬을 한 번 더 즐겨봐요." },
    ],
  },
  8: {
    score: 76, mood: "집중",
    metrics: [
      { label: "에너지", value: 68 }, { label: "안정감", value: 74 },
      { label: "집중력", value: 92 }, { label: "긍정성", value: 70 },
    ],
    summaryTitle: "깊이 몰입한 하루였네요!",
    summaryBody: "한 가지 일에 깊게 빠져들어 좋은 결과를 만든 하루였어요. 다만 집중 후엔 충분한 휴식이 필요하니, 저녁엔 화면을 잠시 멀리해 보세요.",
    chatRecap: "한 가지 일에 깊게 빠져들어 뿌듯한 마무리를 한 하루.",
    tomorrow: [
      { num: 1, title: "딥워크 1시간", body: "집중 흐름을 짧고 강하게 이어가요." },
      { num: 2, title: "스트레칭 휴식", body: "몰입 후 회복이 다음 집중을 만들어요." },
    ],
  },
  10: {
    score: 85, mood: "기쁨",
    metrics: [
      { label: "에너지", value: 82 }, { label: "안정감", value: 75 },
      { label: "집중력", value: 65 }, { label: "긍정성", value: 95 },
    ],
    summaryTitle: "마음이 한껏 채워진 저녁!",
    summaryBody: "오랜만에 만난 친구와의 시간으로 긍정 점수가 크게 올라간 하루였어요. 좋은 관계는 가장 든든한 회복제이니, 자주 시간을 만들어보세요.",
    chatRecap: "오랜만의 친구와의 저녁, 즐거운 대화로 마음이 가득 찬 하루.",
    tomorrow: [
      { num: 1, title: "감사 메시지 보내기", body: "함께한 사람에게 마음을 전해보세요." },
      { num: 2, title: "충분한 수면", body: "즐거움 뒤엔 푹 쉬어가는 시간이 필요해요." },
    ],
  },
  14: {
    score: 72, mood: "안정감",
    metrics: [
      { label: "에너지", value: 60 }, { label: "안정감", value: 88 },
      { label: "집중력", value: 70 }, { label: "긍정성", value: 72 },
    ],
    summaryTitle: "잔잔히 흘러간 하루",
    summaryBody: "특별한 사건은 없었지만 마음이 고요했던 하루였어요. 이런 날의 평온함이 다음 날의 좋은 출발을 만들어줍니다.",
    chatRecap: "잔잔한 흐름 속에서 마음이 가만히 가라앉은 하루.",
    tomorrow: [
      { num: 1, title: "가벼운 정리", body: "안정된 마음에 작은 정돈을 더해봐요." },
      { num: 2, title: "독서 30분", body: "고요한 흐름을 한 번 더 이어가세요." },
    ],
  },
  16: {
    score: 88, mood: "성취",
    metrics: [
      { label: "에너지", value: 80 }, { label: "안정감", value: 78 },
      { label: "집중력", value: 85 }, { label: "긍정성", value: 90 },
    ],
    summaryTitle: "완성한 만큼 단단해진 하루!",
    summaryBody: "아침의 설렘으로 시작해 마무리의 만족감으로 끝난 균형 잡힌 하루였어요. 스스로에게 작은 보상을 주는 것도 좋은 습관이에요.",
    chatRecap: "기대로 시작해 성취감으로 마무리한, 양 끝이 단단했던 하루.",
    tomorrow: [
      { num: 1, title: "셀프 리워드", body: "잘 해낸 자신에게 작은 선물 어떨까요." },
      { num: 2, title: "다음 작은 목표", body: "이 흐름을 이어줄 다음 한 걸음을 정해요." },
    ],
  },
  18: {
    score: 74, mood: "평온함",
    metrics: [
      { label: "에너지", value: 65 }, { label: "안정감", value: 86 },
      { label: "집중력", value: 68 }, { label: "긍정성", value: 76 },
    ],
    summaryTitle: "차분함이 깊었던 하루",
    summaryBody: "차분하고 안정적인 흐름으로 보낸 하루였어요. 평온이 이어질 때는 작은 새로움 하나를 더해 보면 좋은 자극이 됩니다.",
    chatRecap: "큰 기복 없이 안정된 분위기로 채워진 하루였어요.",
    tomorrow: [
      { num: 1, title: "새로운 카페 탐방", body: "잔잔함에 작은 변화를 더해봐요." },
      { num: 2, title: "10분 명상", body: "내일도 이 평온을 이어가 보세요." },
    ],
  },
  21: {
    score: 75, mood: "평온함",
    metrics: [
      { label: "에너지", value: 68 }, { label: "안정감", value: 80 },
      { label: "집중력", value: 75 }, { label: "긍정성", value: 78 },
    ],
    summaryTitle: "오늘은 이렇게 보내고 계시는군요!",
    summaryBody: "평온한 에너지로 차분한 하루를 보내셨다니 참 좋습니다. 직장에서의 좋은 운을 살려 내일은 미뤄두었던 업무나 새로운 프로젝트에 도전해 보시면 어떨까요? 금전 운이 조금 낮은 만큼 불필요한 지출은 자제하고, 애정 운도 함께 상승 중이니 소중한 사람들과 따뜻한 시간을 나누며 오늘의 평온함을 내일까지 이어가시길 응원합니다.",
    chatRecap: "해야 할 일을 차근차근 정리하고 중요한 일에 집중하면서, 일과 휴식의 균형 속에 무리 없이 하루를 마무리했어요.",
    tomorrow: [
      { num: 1, title: "중요한 기획·집중 작업", body: "평온감이 이어지면 깊은 작업에 최적이에요." },
      { num: 2, title: "산책 & 마음 챙김", body: "안정 무드로 내일도 좋은 흐름을 이어요." },
    ],
  },
};

const DEFAULT_DATA = DAILY_DATA[21];

// ─── 영상 데이터 → 분석 결과 계산 ───────────────────────────────────────────
function computeAnalysisFromRecord(record: VideoRecord): DailyData {
  const timeline = record.emotionTimeline ?? [];
  const conf = record.aiConfidence ?? 0.5;
  const aiMood = (record.aiMood ?? "okay") as string;

  // 기본 점수 (aiMood + 신뢰도)
  const BASE: Record<string, number> = { best: 92, good: 82, okay: 70, bad: 54, worst: 40 };
  const baseScore = BASE[aiMood] ?? 70;
  const score = Math.round(Math.min(100, Math.max(30, baseScore * 0.78 + conf * 22)));

  // 타임라인 감정 평균
  let sumH = 0, sumN = 0, sumAngry = 0, sumFear = 0;
  for (const s of timeline) {
    sumH     += s.expressions.happy   ?? 0;
    sumN     += s.expressions.neutral ?? 0;
    sumAngry += s.expressions.angry   ?? 0;
    sumFear  += s.expressions.fearful ?? 0;
  }
  const n = timeline.length || 1;
  const avgH = sumH / n, avgN = sumN / n, avgNeg = (sumAngry + sumFear) / n;
  const clamp = (v: number) => Math.round(Math.min(100, Math.max(35, v)));

  const metrics: Metric[] = [
    { label: "에너지",  value: clamp((1 - avgN * 0.65) * 100 * 0.55 + conf * 45) },
    { label: "안정감",  value: clamp(avgN * 60 + (1 - avgNeg * 4) * 40 + 20) },
    { label: "집중력",  value: clamp(baseScore * 0.62 + conf * 38) },
    { label: "긍정성",  value: clamp(avgH * 120 + baseScore * 0.38) },
  ];

  // 요약 템플릿
  const T: Record<string, { title: string; body: string; tomorrow: { num: number; title: string; body: string }[] }> = {
    best: {
      title: "활기가 넘쳤던 하루예요!",
      body: "영상에서 환한 에너지와 기쁨이 느껴졌어요. 이런 날의 감정을 잘 기억해두면 힘든 날에 큰 힘이 됩니다. 오늘의 긍정 에너지를 내일도 이어가 보세요.",
      tomorrow: [
        { num: 1, title: "오늘의 기분 메모하기", body: "기쁜 감정의 이유를 짧게 적어두면 좋아요." },
        { num: 2, title: "주변에 긍정 에너지 나누기", body: "이 활기를 가까운 사람과 나눠보세요." },
      ],
    },
    good: {
      title: "좋은 하루였네요!",
      body: "전반적으로 밝고 안정된 감정이 느껴지는 하루였어요. 작은 즐거움들이 모여 오늘을 만들었을 거예요. 이 흐름을 내일도 이어가 보세요.",
      tomorrow: [
        { num: 1, title: "오늘 좋았던 순간 떠올리기", body: "긍정 감정을 강화하는 좋은 습관이에요." },
        { num: 2, title: "가벼운 운동이나 산책", body: "좋은 에너지를 몸으로도 이어가 보세요." },
      ],
    },
    okay: {
      title: "평온하게 보낸 하루예요",
      body: "감정 기복 없이 안정된 흐름으로 보낸 하루였어요. 평온함 속에서도 작은 의미를 찾는 연습이 내일을 더 풍요롭게 만들어줄 거예요.",
      tomorrow: [
        { num: 1, title: "한 가지 즐거운 계획 세우기", body: "내일에 기대할 것 하나를 만들어봐요." },
        { num: 2, title: "충분한 수면", body: "평온한 하루의 마무리는 충분한 휴식이에요." },
      ],
    },
    bad: {
      title: "오늘 좀 힘드셨겠어요",
      body: "영상에서 피로하거나 무거운 감정이 느껴졌어요. 힘든 날도 있는 법이에요. 오늘은 푹 쉬고, 내일은 조금 더 가벼운 마음으로 시작해 보세요.",
      tomorrow: [
        { num: 1, title: "충분한 휴식 취하기", body: "몸과 마음이 회복할 시간이 필요해요." },
        { num: 2, title: "좋아하는 것 하나 하기", body: "기분 전환이 되는 작은 활동을 해보세요." },
      ],
    },
    worst: {
      title: "많이 지치셨겠어요",
      body: "오늘은 정말 힘든 하루였을 것 같아요. 이런 날일수록 자신에게 너그러워지는 것이 중요해요. 지금 느끼는 감정을 그대로 인정하고 천천히 쉬어가세요.",
      tomorrow: [
        { num: 1, title: "자신에게 친절하기", body: "오늘 수고한 자신을 토닥여 주세요." },
        { num: 2, title: "가벼운 산책", body: "신선한 공기가 기분 전환에 도움이 돼요." },
      ],
    },
  };
  const t = T[aiMood] ?? T.okay;

  const chatRecap = record.transcript
    ? (record.transcript.length > 90 ? record.transcript.slice(0, 88) + "…" : record.transcript)
    : "영상을 통해 오늘의 감정을 기록했어요.";

  return {
    score,
    mood: record.aiMoodLabel ?? "평온함",
    metrics,
    summaryTitle: t.title,
    summaryBody: t.body,
    chatRecap,
    tomorrow: t.tomorrow,
  };
}

const DEMO_RECORD: VideoRecord = {
  videoUrl: "",
  aiMood: "good",
  aiMoodLabel: "좋아요!",
  aiConfidence: 0.72,
  rawExpressions: { happy: 0.62, neutral: 0.28, surprised: 0.1 },
  userMood: null,
  userMoodLabel: null,
  transcript: "오늘 팀 미팅에서 발표를 잘 마쳤어요. 준비를 많이 했는데 반응이 좋아서 기분이 너무 좋았고, 퇴근하면서 동료랑 같이 커피 한 잔 했는데 그것도 즐거웠어요.",
  emotionTimeline: [
    { sec: 0,  expressions: { neutral: 0.7, happy: 0.2, surprised: 0.05, sad: 0.02, angry: 0.02, fearful: 0.01 } },
    { sec: 3,  expressions: { neutral: 0.55, happy: 0.35, surprised: 0.06, sad: 0.02, angry: 0.01, fearful: 0.01 } },
    { sec: 6,  expressions: { neutral: 0.3, happy: 0.6, surprised: 0.07, sad: 0.01, angry: 0.01, fearful: 0.01 } },
    { sec: 9,  expressions: { neutral: 0.25, happy: 0.68, surprised: 0.04, sad: 0.01, angry: 0.01, fearful: 0.01 } },
    { sec: 12, expressions: { neutral: 0.4, happy: 0.45, surprised: 0.08, sad: 0.03, angry: 0.02, fearful: 0.02 } },
    { sec: 15, expressions: { neutral: 0.5, happy: 0.35, surprised: 0.1, sad: 0.02, angry: 0.02, fearful: 0.01 } },
    { sec: 18, expressions: { neutral: 0.35, happy: 0.55, surprised: 0.06, sad: 0.02, angry: 0.01, fearful: 0.01 } },
    { sec: 21, expressions: { neutral: 0.3, happy: 0.62, surprised: 0.05, sad: 0.01, angry: 0.01, fearful: 0.01 } },
    { sec: 24, expressions: { neutral: 0.45, happy: 0.42, surprised: 0.09, sad: 0.02, angry: 0.01, fearful: 0.01 } },
    { sec: 27, expressions: { neutral: 0.28, happy: 0.65, surprised: 0.04, sad: 0.01, angry: 0.01, fearful: 0.01 } },
  ],
};

function AnalysisPage() {
  const { day, demo } = Route.useSearch();

  // 영상 기록 후 계산된 분석 데이터가 있으면 사용
  const [videoAnalysis] = useState<DailyData | null>(() => {
    try {
      const raw = sessionStorage.getItem("videoAnalysisResult");
      if (raw) { sessionStorage.removeItem("videoAnalysisResult"); return JSON.parse(raw) as DailyData; }
    } catch { /* ignore */ }
    return null;
  });

  const data: DailyData = videoAnalysis || (day && DAILY_DATA[day]) || DEFAULT_DATA;
  const { score, mood, metrics, summaryTitle, summaryBody, chatRecap, tomorrow } = data;
  const scrollRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const tomorrowRef = useRef<HTMLElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  const [videoRecord] = useState<VideoRecord | null>(() =>
    demo ? DEMO_RECORD : getVideoRecord()
  );
  useEffect(() => {
    if (!demo) return () => { clearVideoRecord(); };
  }, [demo]);

  // 영상 기록이 있으면 감정 리포트 화면으로 전환
  if (videoRecord) {
    return <EmotionReportPage record={videoRecord} />;
  }

  // 순차 reveal: AI가 결과를 차례로 생성하는 것처럼
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setRevealed(1), 200),   // 점수 카드 상단
      setTimeout(() => setRevealed(2), 800),   // 게이지
      setTimeout(() => setRevealed(3), 1500),  // 메트릭
      setTimeout(() => setRevealed(4), 2400),  // 요약 카드
      setTimeout(() => setRevealed(5), 3400),  // 내일 카드
      setTimeout(() => setRevealed(6), 4400),  // 버튼
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // reveal 될 때마다 해당 섹션이 뷰에 들어오도록 부드럽게 스크롤
  useEffect(() => {
    const targets: Record<number, React.RefObject<HTMLElement | HTMLDivElement | null>> = {
      4: summaryRef,
      5: tomorrowRef,
      6: buttonsRef,
    };
    const el = (targets[revealed] as React.RefObject<HTMLElement | null>)?.current;
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
        {/* 헤더 */}
        <header className="relative shrink-0 flex items-center justify-center px-4 pt-[52px] pb-3 bg-white">
          <Link
            to="/"
            aria-label="뒤로"
            className="absolute left-3 top-[50px] grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:text-foreground"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
          </Link>
          <h1 className="font-semibold text-foreground text-[16px] tracking-tight">
            오늘의 일기분석
          </h1>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide pb-10">

          {/* 점수 카드 */}
          <section className="bg-white px-5 pt-8 pb-10">
            <div style={fadeIn(1)}>
              <p className="text-[13px] text-[#9a9aa3] tracking-tight">데일리 채팅 분석</p>
              <h2 className="mt-1.5 font-bold text-foreground text-[20px] tracking-tight">
                오늘의 감정 점수
              </h2>
            </div>

            {/* 반원 게이지 */}
            <div className="mt-8 flex justify-center" style={fadeIn(2)}>
              <ScoreGauge score={score} label={mood} />
            </div>

            {/* 메트릭 4개 */}
            <div className="mt-8 grid grid-cols-4 gap-4" style={fadeIn(3)}>
              {metrics.map((m) => (
                <MetricBar key={m.label} label={m.label} value={m.value} />
              ))}
            </div>
          </section>

          {/* 오늘 요약 카드 */}
          <section ref={summaryRef} className="mx-4 mt-6 rounded-2xl bg-white p-6 shadow-sm" style={fadeIn(4)}>
            <div className="flex flex-col items-center">
              <img src={iconChat} alt="" className="h-[52px] w-[52px] object-contain" />
              <h3 className="mt-2 font-bold text-foreground text-[17px] tracking-tight">
                {summaryTitle}
              </h3>
            </div>
            <p className="mt-4 text-[14px] leading-[1.75] text-foreground/85 tracking-tight">
              {summaryBody}
            </p>

            <div className="mt-4 rounded-xl px-4 py-4 bg-[#fffcf5]">
              <span className="inline-block rounded-md px-2 py-0.5 text-[12px] font-semibold text-white bg-[#786359]">
                채팅 요약
              </span>
              <p className="mt-2 text-[13.5px] leading-[1.7] text-foreground/85 tracking-tight">
                {chatRecap}
              </p>
            </div>
          </section>

          {/* 내일은 이렇게 카드 */}
          <section ref={tomorrowRef} className="mx-4 mt-6 rounded-2xl bg-white p-6 shadow-sm" style={fadeIn(5)}>
            <div className="flex flex-col items-center">
              <img src={iconAiBook} alt="" className="h-[52px] w-[52px] object-contain" />
              <h3 className="mt-2 font-bold text-foreground text-[17px] tracking-tight">
                내일은 이렇게 준비해보세요!
              </h3>
            </div>

            <ul className="mt-5 flex flex-col gap-4">
              {tomorrow.map((t) => (
                <li key={t.num} className="flex items-start gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#7AC47D] text-white font-bold text-[14px]">
                    {t.num}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-[15px] tracking-tight">
                      {t.title}
                    </p>
                    <p className="mt-0.5 text-[13px] text-foreground/65 tracking-tight">
                      {t.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 하단 버튼 */}
          <div ref={buttonsRef} className="mx-4 mt-6 mb-6 flex flex-col gap-2.5" style={fadeIn(6)}>
            <Link
              to="/advice"
              search={{ empty: false }}
              className="flex w-full items-center justify-center bg-white py-3.5 font-semibold text-[var(--primary)] text-[15px] tracking-tight border border-[var(--primary)]/20 active:scale-[0.99] transition rounded-2xl shadow-none"
            >
              조언 바로가기
            </Link>
            <Link
              to="/"
              className="flex w-full items-center justify-center rounded-2xl bg-[var(--primary)] py-3.5 font-semibold text-white text-[15px] tracking-tight shadow-md active:scale-[0.99] transition"
            >
              완료
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 반원형 게이지 (0~100). SVG stroke-dasharray로 부드럽게 채움.
 */
function ScoreGauge({ score, label }: { score: number; label: string }) {
  const SIZE = 200;
  const STROKE = 20;
  const R = (SIZE - STROKE) / 2;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  // 270도 호(아래 90도가 비어있는 C자 모양). 호 길이 = 2πr * 270/360
  const ARC = 2 * Math.PI * R * 0.75;
  const filled = Math.max(0, Math.min(1, score / 100)) * ARC;
  // 시작각 135deg(좌하단) → 종료각 45deg(우하단), 시계방향 270도
  const start = polar(CX, CY, R, 135);
  const end = polar(CX, CY, R, 45);
  const arcPath = `M ${start.x} ${start.y} A ${R} ${R} 0 1 1 ${end.x} ${end.y}`;
  // 호의 아래쪽 끝(stroke-linecap=round 포함)이 잘리지 않도록 충분한 높이 확보
  const HEIGHT = Math.ceil(start.y + STROKE / 2 + 4);

  return (
    <div className="relative" style={{ width: SIZE, height: HEIGHT }}>
      <svg width={SIZE} height={HEIGHT} viewBox={`0 0 ${SIZE} ${HEIGHT}`}>
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cfe0ff" />
            <stop offset="100%" stopColor="#3b6fff" />
          </linearGradient>
        </defs>
        {/* 트랙 */}
        <path
          d={arcPath}
          fill="none"
          stroke="#eef1f5"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* 채움 */}
        <path
          d={arcPath}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${ARC}`}
          style={{ transition: "stroke-dasharray 700ms ease-out" }}
        />
      </svg>

      {/* 중앙 라벨 */}
      <div
        className="absolute inset-x-0 flex flex-col items-center"
        style={{ top: 44 }}
      >
        <span className="text-[13px] font-semibold text-foreground/80 tracking-tight">
          {label}
        </span>
        <div className="mt-2 font-extrabold text-foreground text-[38px] leading-none tracking-tight">
          {score}
        </div>
        <div className="mt-1.5 text-[10px] font-semibold text-[#9a9aa3] tracking-[0.22em]">
          SCORE
        </div>
      </div>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-[12px] text-foreground/70 tracking-tight">{label}</span>
      <span className="mt-1 text-[11px] font-semibold text-foreground tracking-tight">
        {value}
        <span className="ml-0.5 text-[10px] font-normal text-[#9a9aa3]">/100점</span>
      </span>
      <div className="mt-2 h-2 w-full rounded-full bg-[#eef1f5] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background:
              "linear-gradient(90deg, #5b8cff 0%, #3b6fff 70%, rgba(59,111,255,0.35) 100%)",
            transition: "width 700ms ease-out",
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 감정 리포트 전체 페이지
// ─────────────────────────────────────────────

const MOOD_META: Record<MoodKey, { label: string; thumb: string; big: string; bg: string; emoji: string }> = {
  best:  { label: "최고예요!", thumb: moodBest,  big: moodBestBig,  bg: bgBest,  emoji: "🤩" },
  good:  { label: "좋아요!",   thumb: moodGood,  big: moodGoodBig,  bg: bgGood,  emoji: "😊" },
  okay:  { label: "보통이에요", thumb: moodOkay,  big: moodOkayBig,  bg: bgOkay,  emoji: "😐" },
  bad:   { label: "별로예요",  thumb: moodBad,   big: moodBadBig,   bg: bgBad,   emoji: "😔" },
  worst: { label: "최악이에요", thumb: moodWorst, big: moodWorstBig, bg: bgWorst, emoji: "😭" },
};
const MOODS = (["best","good","okay","bad","worst"] as MoodKey[]).map(k => ({ key: k, ...MOOD_META[k] }));

const BIG_CHARACTER_OFFSET_X: Partial<Record<MoodKey, number>> = { good: 20, bad: 20 };
const EMPTY_CHARACTER_OFFSET_X = 20;

const EMOTION_KO: Record<string, string> = {
  neutral: "평온", happy: "기쁨", sad: "슬픔",
  angry: "긴장", fearful: "두려움", disgusted: "불쾌", surprised: "놀람",
};
const EMOTION_COLORS: Record<string, string> = {
  neutral: "#94a3b8", happy: "#fbbf24", angry: "#f87171",
  sad: "#60a5fa", surprised: "#c084fc", fearful: "#fb923c", disgusted: "#4ade80",
};
const GRAPH_EMOTIONS = ["neutral", "happy", "angry", "sad", "surprised", "fearful", "disgusted"];

function formatSec(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

interface EmotionStats {
  strongest: { emotion: string; value: number; sec: number };
  longest:   { emotion: string; durationSec: number; startSec: number };
  biggestChange: { sec: number; delta: number; toEmotion: string };
}

function computeStats(timeline: EmotionSnapshot[]): EmotionStats | null {
  if (timeline.length < 2) return null;

  // 가장 강한 감정
  let strongest = { emotion: "neutral", value: 0, sec: 0 };
  for (const snap of timeline) {
    for (const [emotion, value] of Object.entries(snap.expressions)) {
      if (emotion === "neutral") continue;
      if ((value ?? 0) > strongest.value) strongest = { emotion, value: value ?? 0, sec: snap.sec };
    }
  }

  // 가장 오래 지속된 감정 (run-length)
  let longest = { emotion: "neutral", durationSec: 0, startSec: 0 };
  let cur = { emotion: "", durationSec: 0, startSec: 0 };
  for (const snap of timeline) {
    const [dom] = Object.entries(snap.expressions)
      .reduce<[string, number]>((mx, [k, v]) => (v ?? 0) > mx[1] ? [k, v ?? 0] : mx, ["neutral", 0]);
    if (dom === cur.emotion) {
      cur.durationSec++;
    } else {
      if (cur.durationSec > longest.durationSec) longest = { ...cur };
      cur = { emotion: dom, durationSec: 1, startSec: snap.sec };
    }
  }
  if (cur.durationSec > longest.durationSec) longest = { ...cur };

  // 변화가 가장 컸던 구간
  let biggestChange = { sec: 0, delta: 0, toEmotion: "neutral" };
  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1].expressions;
    const curr = timeline[i].expressions;
    let delta = 0;
    for (const k of Object.keys(curr)) delta += Math.abs((curr[k] ?? 0) - (prev[k] ?? 0));
    if (delta > biggestChange.delta) {
      const [dom] = Object.entries(curr)
        .reduce<[string, number]>((mx, [k, v]) => (v ?? 0) > mx[1] ? [k, v ?? 0] : mx, ["neutral", 0]);
      biggestChange = { sec: timeline[i].sec, delta, toEmotion: dom };
    }
  }

  return { strongest, longest, biggestChange };
}

function generateQuestions(stats: EmotionStats | null, timeline: EmotionSnapshot[]): string[] {
  if (!stats || timeline.length < 3) return [];
  const questions: string[] = [];

  if (stats.biggestChange.delta > 0.25) {
    const label = EMOTION_KO[stats.biggestChange.toEmotion] ?? stats.biggestChange.toEmotion;
    questions.push(
      `${formatSec(stats.biggestChange.sec)} 즈음에 표정 변화가 있었어요.\n` +
      `${label}에 가까운 반응이 추정됐는데, 그때 어떤 생각을 하고 있었나요?`
    );
  }
  if (stats.strongest.value > 0.4 && stats.strongest.emotion !== "neutral") {
    const label = EMOTION_KO[stats.strongest.emotion] ?? stats.strongest.emotion;
    questions.push(
      `${formatSec(stats.strongest.sec)} 지점에서 ${label} 반응이 가장 높게 추정됐어요.\n` +
      `그 순간 이야기하던 내용이 무엇이었나요?`
    );
  }
  return questions.slice(0, 2);
}

function EmotionGraph({ timeline }: { timeline: EmotionSnapshot[] }) {
  if (timeline.length < 2) return (
    <div className="flex items-center justify-center h-[100px] text-[13px] text-[#bbb]">
      데이터가 충분하지 않아요
    </div>
  );

  const W = 300, H = 160;
  const PL = 10, PR = 10, PT = 12, PB = 16;
  const maxSec = timeline[timeline.length - 1].sec || 1;

  const toX = (sec: number) => PL + (sec / maxSec) * (W - PL - PR);
  const toY = (val: number) => PT + (1 - Math.min(1, Math.max(0, val))) * (H - PT - PB);

  // X축 레이블 (최대 5개)
  const tickCount = Math.min(5, timeline.length);
  const tickInterval = Math.ceil(maxSec / (tickCount - 1));
  const ticks = Array.from({ length: tickCount }, (_, i) => Math.min(i * tickInterval, maxSec));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        {/* 그리드 라인 */}
        {[0.25, 0.5, 0.75].map(v => (
          <line key={v} x1={PL} y1={toY(v)} x2={W - PR} y2={toY(v)}
            stroke="#f0f0f0" strokeWidth="1" />
        ))}
        {/* 감정 라인 */}
        {GRAPH_EMOTIONS.map(emotion => {
          const pts = timeline
            .map(s => `${toX(s.sec).toFixed(1)},${toY(s.expressions[emotion] ?? 0).toFixed(1)}`)
            .join(" ");
          return (
            <polyline key={emotion} points={pts} fill="none"
              stroke={EMOTION_COLORS[emotion]} strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          );
        })}
      </svg>
      {/* X축 시간 레이블 */}
      <div className="flex justify-between px-2 -mt-1">
        {ticks.map(t => (
          <span key={t} className="text-[9px] text-[#bbb]">{formatSec(t)}</span>
        ))}
      </div>
    </div>
  );
}

const TOTAL_STEPS = 4;

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            background: i === current ? "var(--primary)" : "#d8dce6",
          }}
        />
      ))}
    </div>
  );
}

function EmotionReportPage({ record }: { record: VideoRecord }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stats = computeStats(record.emotionTimeline ?? []);
  const questions = generateQuestions(stats, record.emotionTimeline ?? []);
  const duration = (record.emotionTimeline ?? []).length > 0
    ? (record.emotionTimeline[record.emotionTimeline.length - 1]?.sec ?? 0) : 0;

  const aiMoodMeta = record.aiMood ? MOOD_META[record.aiMood as MoodKey] : null;

  const goNext = () => {
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const goPrev = () => {
    if (step === 0) { navigate({ to: "/" }); return; }
    setStep(s => Math.max(s - 1, 0));
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const handleSave = () => {
    const mood = selectedMood ?? "okay";
    saveDiaryEntry({
      date: todayString(),
      userMood: mood,
      userMoodLabel: MOOD_META[mood].label,
      aiMood: record.aiMood,
      aiMoodLabel: record.aiMoodLabel,
      aiConfidence: record.aiConfidence,
      transcript: record.transcript,
      hasVideo: !!record.videoUrl,
    });
    setSaved(true);
    // 영상 데이터로 분석 결과 계산 후 저장, 영상 기록 제거
    const analysisData = computeAnalysisFromRecord(record);
    sessionStorage.setItem("videoAnalysisResult", JSON.stringify(analysisData));
    clearVideoRecord();
    setTimeout(() => navigate({ to: "/analysis", search: {} }), 400);
  };

  const stepTitles = ["영상 확인", "감정 흐름", "AI 분석", "기록 완료"];

  // Step 3: 풀스크린 무드 선택 (RecordPage 스타일)
  if (step === 3) {
    return (
      <MoodSelectionStep
        selectedMood={selectedMood}
        setSelectedMood={setSelectedMood}
        onSave={handleSave}
        onBack={goPrev}
        saved={saved}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col" style={{ background: "#f5f6f8" }}>
        {/* 헤더 */}
        <header className="relative shrink-0 flex items-center justify-center px-4 pt-[52px] pb-3 bg-white border-b border-[#f0f0f0]">
          <button type="button" onClick={goPrev}
            className="absolute left-3 top-[50px] grid h-9 w-9 place-items-center rounded-full text-foreground/70">
            <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
          </button>
          <div className="flex flex-col items-center gap-1">
            <h1 className="font-semibold text-foreground text-[16px] tracking-tight">{stepTitles[step]}</h1>
            <StepDots current={step} />
          </div>
          <button type="button" onClick={() => navigate({ to: "/record" })}
            className="absolute right-3 top-[50px] grid h-9 w-9 place-items-center rounded-full text-foreground/40">
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </header>

        {/* 콘텐츠 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide pb-32">

          {/* ── Step 1: 영상 확인 ── */}
          {step === 0 && (
            <div>
              <div className="bg-white px-5 pt-5 pb-5">
                {record.videoUrl ? (
                  <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                    <video src={record.videoUrl} controls playsInline
                      className="w-full h-full object-cover"
                      style={{ transform: "scaleX(-1)" }} />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#f3f4f8] aspect-video flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🎙</span>
                    <p className="text-[13px] text-[#999] tracking-tight">음성으로만 기록되었어요</p>
                  </div>
                )}
                {record.videoUrl && duration > 0 && (
                  <p className="mt-2 text-[12px] text-[#9a9aa3] tracking-tight text-center">
                    녹화 시간 {formatSec(duration)}
                  </p>
                )}
              </div>

              {/* AI 분석 결과 */}
              <section className="mx-4 mt-4 rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-[12px] text-[#9a9aa3] tracking-tight mb-1">AI 감정 분석</p>
                <h2 className="font-bold text-foreground text-[18px] tracking-tight mb-4">
                  오늘 표정에서 이런 감정이 보였어요
                </h2>
                {aiMoodMeta && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f7f8fc]">
                    <img src={aiMoodMeta.thumb} alt="" className="h-14 w-14 object-contain shrink-0" />
                    <div>
                      <p className="font-bold text-foreground text-[20px] tracking-tight">{aiMoodMeta.label}</p>
                      {record.aiConfidence != null && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-2 w-28 rounded-full bg-[#eef1f5] overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--primary)]"
                              style={{ width: `${Math.round(record.aiConfidence * 100)}%`, transition: "width 700ms ease-out" }} />
                          </div>
                          <span className="text-[12px] text-[#9a9aa3] tracking-tight">
                            신뢰도 {Math.round(record.aiConfidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {record.rawExpressions && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(record.rawExpressions)
                      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
                      .slice(0, 4)
                      .map(([emotion, val]) => (
                        <span key={emotion} className="rounded-full px-3 py-1 text-[12px] font-medium"
                          style={{ background: `${EMOTION_COLORS[emotion]}22`, color: EMOTION_COLORS[emotion] }}>
                          {EMOTION_KO[emotion] ?? emotion} {Math.round((val ?? 0) * 100)}%
                        </span>
                      ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ── Step 2: 감정 흐름 ── */}
          {step === 1 && (
            <div>
              {(record.emotionTimeline ?? []).length >= 2 ? (
                <section className="mx-4 mt-5 rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-bold text-foreground text-[18px] tracking-tight">감정 흐름 그래프</h2>
                    <span className="text-[10px] text-[#bbb]">ⓘ AI 추정값</span>
                  </div>
                  <p className="text-[12px] text-[#9a9aa3] tracking-tight mb-4">
                    영상 전체에서 감지된 감정의 변화예요
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4">
                    {GRAPH_EMOTIONS.map(e => (
                      <div key={e} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: EMOTION_COLORS[e] }} />
                        <span className="text-[11px] text-[#666]">{EMOTION_KO[e]}</span>
                      </div>
                    ))}
                  </div>
                  <EmotionGraph timeline={record.emotionTimeline ?? []} />
                </section>
              ) : (
                <div className="mx-4 mt-5 rounded-2xl bg-white p-6 shadow-sm flex items-center justify-center">
                  <p className="text-[13px] text-[#bbb]">감정 데이터가 충분하지 않아요</p>
                </div>
              )}

              {stats && (
                <section className="mx-4 mt-4 rounded-2xl bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-foreground text-[16px] tracking-tight mb-4">주요 감정 변화</h2>
                  <div className="flex flex-col gap-3">
                    <SummaryRow icon="💪" label="가장 강하게 나타난 감정"
                      value={`${EMOTION_KO[stats.strongest.emotion] ?? stats.strongest.emotion}  (${formatSec(stats.strongest.sec)} 지점)`} />
                    <SummaryRow icon="⏱" label="가장 오래 지속된 감정"
                      value={`${EMOTION_KO[stats.longest.emotion] ?? stats.longest.emotion}  (약 ${stats.longest.durationSec}초)`} />
                    <SummaryRow icon="📈" label="감정 변화가 컸던 구간"
                      value={`${formatSec(stats.biggestChange.sec)} 즈음`} />
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ── Step 3: AI 분석 & 음성 ── */}
          {step === 2 && (
            <div>
              {questions.length > 0 && (
                <section className="mx-4 mt-5 rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-[12px] text-[#9a9aa3] tracking-tight mb-1">AI가 발견한 순간</p>
                  <h2 className="font-bold text-foreground text-[18px] tracking-tight mb-4">
                    이 순간 어떤 기분이었나요?
                  </h2>
                  <div className="flex flex-col gap-3">
                    {questions.map((q, i) => (
                      <div key={i} className="rounded-xl bg-[#f7f8fc] border border-[#eaecf4] px-4 py-3.5">
                        <p className="text-[13px] leading-relaxed text-foreground/85 tracking-tight whitespace-pre-line">
                          {q}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {record.transcript && (
                <section className="mx-4 mt-4 rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-[12px] text-[#9a9aa3] tracking-tight mb-1">🎙 음성 기록</p>
                  <p className="text-[14px] leading-relaxed text-foreground/85 tracking-tight">
                    {record.transcript}
                  </p>
                </section>
              )}

              {questions.length === 0 && !record.transcript && (
                <div className="mx-4 mt-5 rounded-2xl bg-white p-6 shadow-sm flex items-center justify-center">
                  <p className="text-[13px] text-[#bbb]">분석 데이터가 없어요</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: 감정 선택 ── */}
          {step === 3 && (
            <div>
              <section className="mx-4 mt-5 rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-[12px] text-[#9a9aa3] tracking-tight mb-1">오늘의 감정 기록</p>
                <h2 className="font-bold text-foreground text-[20px] tracking-tight mb-1">
                  지금 기분이 어때요?
                </h2>
                <p className="text-[13px] text-[#9a9aa3] tracking-tight mb-6">
                  AI 분석은 참고용이에요. 내가 느낀 감정을 직접 골라주세요.
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {MOODS.map(m => (
                    <button key={m.key} type="button"
                      onClick={() => setSelectedMood(m.key)}
                      style={{ touchAction: "manipulation" }}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl pt-3 pb-2.5 transition-all ${
                        selectedMood === m.key ? "bg-[var(--primary)] shadow-md scale-105" : "bg-[#f3f4f8]"
                      }`}>
                      <img src={m.thumb} alt="" className="h-10 w-10 object-contain" />
                      <span className={`text-[10px] font-medium whitespace-nowrap leading-tight ${
                        selectedMood === m.key ? "text-white" : "text-[#666]"
                      }`}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="shrink-0 bg-white border-t border-[#f0f0f0] px-4 pt-3 pb-8 flex gap-2.5">
          {step > 0 && (
            <button type="button" onClick={goPrev}
              className="flex-1 flex items-center justify-center rounded-2xl py-3.5 font-semibold text-[15px] tracking-tight border border-[#e0e0e8] text-foreground/70 active:scale-[0.99] transition bg-white">
              이전
            </button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <button type="button" onClick={goNext}
              className="flex-1 flex items-center justify-center rounded-2xl bg-[var(--primary)] py-3.5 font-semibold text-white text-[15px] tracking-tight shadow-md active:scale-[0.99] transition">
              다음
            </button>
          ) : (
            <button type="button" onClick={handleSave} disabled={!selectedMood || saved}
              style={{ touchAction: "manipulation" }}
              className={`flex-1 flex items-center justify-center rounded-2xl py-3.5 font-bold text-[15px] tracking-tight transition-all shadow-md ${
                selectedMood && !saved
                  ? "bg-[var(--primary)] text-white active:scale-[0.99]"
                  : "bg-[#e8e8ec] text-[#b8bac2] cursor-not-allowed"
              }`}>
              {saved ? "저장됐어요 ✓" : "기록 완료"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 4: 풀스크린 무드 선택 (RecordPage 스타일)
// ─────────────────────────────────────────────

function MoodPickerFull({
  selected,
  onSelect,
}: {
  selected: MoodKey | null;
  onSelect: (k: MoodKey) => void;
}) {
  const ITEM = 72;
  const GAP = 16;
  const PADDING_LEFT = 24;
  const selectedIndex = selected ? MOODS.findIndex((m) => m.key === selected) : -1;
  const ordered =
    selectedIndex >= 0
      ? [...MOODS.slice(selectedIndex), ...MOODS.slice(0, selectedIndex)]
      : MOODS;

  return (
    <div className="relative pb-8 pt-12 select-none overflow-hidden">
      {selected && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-20 rounded-full ring-[3px] ring-[#7aa7ff]"
          style={{ left: PADDING_LEFT, top: 48, width: ITEM, height: ITEM }}
        />
      )}
      <div
        className="flex"
        style={{ gap: `${GAP}px`, paddingLeft: PADDING_LEFT, paddingRight: PADDING_LEFT }}
      >
        {ordered.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onSelect(m.key)}
            aria-pressed={selected === m.key}
            aria-label={m.label}
            style={{ width: ITEM, height: ITEM, touchAction: "manipulation" }}
            className="relative shrink-0 grid place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-200 active:scale-95"
          >
            <img src={m.thumb} alt="" className="h-12 w-12 object-contain" />
          </button>
        ))}
      </div>
    </div>
  );
}

function MoodSelectionStep({
  selectedMood,
  setSelectedMood,
  onSave,
  onBack,
  saved,
}: {
  selectedMood: MoodKey | null;
  setSelectedMood: (k: MoodKey) => void;
  onSave: () => void;
  onBack: () => void;
  saved: boolean;
}) {
  const hasSelection = selectedMood !== null;
  const current = selectedMood ? MOOD_META[selectedMood] : null;

  return (
    <div className="app-shell">
      <div className="app-frame" style={{ position: "relative" }}>
        {/* 배경 레이어 */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: hasSelection
              ? undefined
              : "linear-gradient(180deg, oklch(0.95 0.025 240) 0%, oklch(0.97 0.012 240) 60%, #ffffff 100%)",
          }}
        />
        {MOODS.map((m) => (
          <img
            key={`bg-s4-${m.key}`}
            src={m.bg}
            alt=""
            aria-hidden
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
            style={{ opacity: selectedMood === m.key ? 1 : 0 }}
          />
        ))}

        {/* 콘텐츠 */}
        <div className="relative z-10 flex h-full flex-col">
          {/* 헤더: 뒤로가기 + 스텝 도트 */}
          <header className="relative flex items-center justify-center px-5 pt-[52px] pb-1">
            <button
              type="button"
              onClick={onBack}
              className="absolute left-3 grid h-9 w-9 place-items-center rounded-full text-foreground/70"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
            </button>
            <StepDots current={3} />
          </header>

          {/* 타이틀 */}
          <section className="px-6 pt-3">
            <p
              className="text-[15px] tracking-tight transition-colors duration-300"
              style={{ color: selectedMood === "worst" ? "#ffffff" : "#8a8d96" }}
            >
              AI 분석은 참고용이에요
            </p>
            <h1
              className="mt-2 font-bold text-[28px] leading-[1.25] tracking-tight transition-colors duration-300"
              style={{ color: selectedMood === "worst" ? "#ffffff" : undefined }}
            >
              내가 느낀 감정을<br />직접 골라주세요
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

            {/* 캐릭터 이미지들 */}
            <div className="relative mt-3 h-[300px] w-[300px] flex items-center justify-center">
              <img
                src={moodEmpty}
                alt="감정을 선택해주세요"
                decoding="async"
                className="absolute inset-0 m-auto h-[280px] w-[280px] object-contain transition-opacity duration-300"
                style={{
                  opacity: hasSelection ? 0 : 1,
                  transform: `translateX(${EMPTY_CHARACTER_OFFSET_X}px)`,
                }}
              />
              {MOODS.map((m) => (
                <img
                  key={`char-s4-${m.key}`}
                  src={m.big}
                  alt={m.label}
                  decoding="async"
                  className="absolute inset-0 m-auto h-[280px] w-[280px] object-contain transition-opacity duration-300"
                  style={{
                    opacity: selectedMood === m.key ? 1 : 0,
                    transform: `translateX(${BIG_CHARACTER_OFFSET_X[m.key] ?? 0}px)`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* 무드 선택 트랙 */}
          <MoodPickerFull selected={selectedMood} onSelect={setSelectedMood} />

          {/* 하단 CTA 패널 */}
          <section
            className="relative bg-white px-6 pt-5 pb-[46px] rounded-t-[24px]"
            style={{
              boxShadow:
                "0 -8px 24px -6px rgba(20, 30, 60, 0.12), 0 -2px 6px -2px rgba(20, 30, 60, 0.06)",
            }}
          >
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
                  filter: "drop-shadow(0 -3px 4px rgba(20, 30, 60, 0.10))",
                }}
              >
                <path
                  d="M14.5 1.5 Q16 0 17.5 1.5 L30 16 Q31 17.5 29 17.5 L3 17.5 Q1 17.5 2 16 Z"
                  fill="#ffffff"
                />
              </svg>
            )}
            <p className="text-[12px] text-[#9a9aa3] tracking-tight">오늘의 감정 기록</p>
            <h2 className="mt-1 font-bold text-foreground text-[17px] leading-snug tracking-tight">
              {current
                ? `${current.label} 기분이었군요! 기록해볼게요.`
                : "감정을 선택하고 기록 완료하기"}
            </h2>
            <button
              type="button"
              disabled={!hasSelection || saved}
              onClick={onSave}
              style={{ touchAction: "manipulation" }}
              className={`mt-3 flex w-full items-center justify-center rounded-2xl py-3.5 font-semibold text-[15px] tracking-tight transition-all ${
                hasSelection && !saved
                  ? "bg-[var(--primary)] text-white shadow-md active:scale-[0.99]"
                  : "bg-[#e8e8ec] text-[#a8a8b0] cursor-not-allowed"
              }`}
            >
              {saved ? "저장됐어요 ✓" : "기록 완료"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[18px] leading-none mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[#9a9aa3] tracking-tight">{label}</p>
        <p className="text-[13px] font-semibold text-foreground tracking-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}