import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
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
  validateSearch: (search: Record<string, unknown>): { day?: number } => {
    const n = typeof search.day === "number" ? search.day : Number(search.day);
    return Number.isFinite(n) && n > 0 ? { day: n } : {};
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

function AnalysisPage() {
  const { day } = Route.useSearch();
  const data: DailyData = (day && DAILY_DATA[day]) || DEFAULT_DATA;
  const { score, mood, metrics, summaryTitle, summaryBody, chatRecap, tomorrow } = data;
  const scrollRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const tomorrowRef = useRef<HTMLElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

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