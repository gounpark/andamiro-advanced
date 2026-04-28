import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, Loader2 } from "lucide-react";

import { PhoneMockup } from "@/components/presentation/PhoneMockup";
import logoSvg from "@/assets/icons/logo.svg";
import { getAppOrigin } from "@/lib/navigate";

// ── ElevenLabs config ──────────────────────────────────────────────────────
const ELEVENLABS_KEY = "sk_9f0c84f481ad9649b42396edc97fcd0be1e66771f281f0c2";
const VOICE_ID = "uyVNoMrnUku1dZyVEXwD";

async function generateAudio(text: string): Promise<string> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ── Slide data ─────────────────────────────────────────────────────────────
interface SlideData {
  category: string;
  title: string;
  body: string;
  narration: string;
  accent?: string;
  iframeRoute?: string;
  noPhone?: boolean;
}

const SLIDES: SlideData[] = [
  {
    category: "소개",
    title: "AI 감정일기, 안다미로",
    body: "월간 달력에서 기록을 확인하고, 날짜를 눌러 그날의 일기를 바로 볼 수 있어요.",
    narration: "안녕하세요, 안다미로를 소개할게요. 달력에서 노란색은 기록이 있는 날, 초록은 오늘이에요. 날짜를 누르면 그날의 기록을 바로 확인할 수 있어요.",
    accent: "#4B82F5",
    iframeRoute: "/intro?nosplash=1",
  },
  {
    category: "주요 기능 01",
    title: "기록 시작: 오늘의 감정부터 선택하고",
    body: "지금 가장 가까운 감정을 고르면 기록의 맥락이 자연스럽게 시작됩니다.",
    narration: "홈에서 기록 버튼을 누르면 감정 선택 화면으로 이어집니다. 지금 기분과 가장 가까운 것을 골라보세요.",
    accent: "#FFCA2D",
    // 홈에서 기록 CTA 버튼 클릭 → 감정선택 이동 (주요기능01 시작 장면)
    iframeRoute: "/?demo=2&nosplash=1",
  },
  {
    category: "주요 기능 02",
    title: "AI 기록: 대화하듯 편하게 기록하고",
    body: "감정을 선택하면 AI가 자연스러운 대화로 오늘의 기록을 함께 완성합니다.",
    narration: "오늘의 감정을 선택하면 AI가 친근한 대화로 기록을 시작합니다. 대화하듯 편하게 이어가다 보면 오늘 하루가 자연스럽게 정리돼요.",
    accent: "#4B82F5",
    // 감정선택에서 시작하기 클릭 → 채팅 이동 (주요기능02 시작 장면)
    iframeRoute: "/record?demo=1&nosplash=1",
  },
  {
    category: "주요 기능 03",
    title: "오늘의 분석: 기록은 분석으로 이어집니다",
    body: "감정 점수·요약·AI 조언으로 하루를 더 명확하게 돌아봅니다.",
    narration: "대화 후 감정 점수와 AI 요약을 확인해보세요.",
    accent: "#FF7A50",
    // 완료된 채팅 정적 화면 → 대화종료 클릭 → 분석 이동 (주요기능03)
    iframeRoute: "/chat?mood=good&demo=2&nosplash=1",
  },
  {
    category: "주요 기능 04",
    title: "리포트: 쌓인 기록으로 패턴을 이해하고",
    body: "감정의 흐름과 에너지 변화를 시각적으로 확인합니다.",
    narration: "기록이 쌓이면 한 달의 감정 패턴을 한눈에 볼 수 있어요.",
    accent: "#4B82F5",
    // 홈에서 리포트 탭 클릭 → 리포트 이동 (주요기능04 시작 장면)
    iframeRoute: "/?demo=4&nosplash=1",
  },
  {
    category: "주요 기능 05",
    title: "맞춤 조언: 오늘의 상태에 맞는 한마디까지",
    body: "기록과 분석을 바탕으로 오늘의 나에게 필요한 조언을 전달합니다.",
    narration: "오늘의 기록을 바탕으로 나에게 딱 맞는 조언을 받아보세요.",
    accent: "#11A858",
    // 홈에서 조언 탭 클릭 → 조언 이동 (주요기능05 시작 장면)
    iframeRoute: "/?demo=5&nosplash=1",
  },
  {
    category: "주요 기능 06",
    title: "포춘쿠키: 하루를 마무리하는 작은 선물",
    body: "감정 기록을 마치면 오늘의 포춘쿠키가 기다리고 있습니다.",
    narration: "하루를 마무리하는 포춘쿠키. 쿠키를 탭하면 오늘의 행운 메시지가 펼쳐집니다.",
    accent: "#FFCA2D",
    // 조언에서 포춘쿠키 배너 클릭 → 포춘쿠키 이동 (주요기능06 시작 장면)
    iframeRoute: "/advice?empty=false&demo=1&nosplash=1",
  },
  {
    category: "마무리",
    title: "안다미로와 함께",
    body: "나를 더 분명하게 이해해보세요.",
    narration: "안다미로와 함께, 나를 더 분명하게 이해해보세요.",
    accent: "#4B82F5",
    noPhone: true,
  },
];

// ── Route ──────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/presentation")({
  head: () => ({
    meta: [
      { title: "안다미로 — 인터랙티브 데모" },
      { name: "theme-color", content: "#4B82F5" },
    ],
  }),
  component: PresentationPage,
});

// ── Shared text panel ──────────────────────────────────────────────────────
function SlideText({ slide, index, total }: { slide: SlideData; index: number; total: number }) {
  return (
    <>
      <div className="mb-3" style={{ animation: "slideUp 0.45s ease" }}>
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1"
          style={{
            background: `${slide.accent}18`,
            color: slide.accent,
            fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: slide.accent, display: "inline-block" }} />
          {slide.category}
        </span>
      </div>

      <h1 style={{
        fontSize: "clamp(20px, 2.4vw, 32px)",
        fontWeight: 800, color: "#0D1B3E",
        lineHeight: 1.35, marginBottom: 16,
        animation: "slideUp 0.45s ease 0.05s both",
      }}>
        {slide.title}
      </h1>

      <p style={{
        fontSize: "clamp(13px, 1.1vw, 16px)",
        color: "#555", lineHeight: 1.75, maxWidth: 480,
        animation: "slideUp 0.45s ease 0.1s both",
      }}>
        {slide.body}
      </p>

    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
function PresentationPage() {
  const [started, setStarted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [subtitle, setSubtitle] = useState("");

  // 슬라이드 이동 시 해당 iframe을 강제 리로드 (데모 타이머 초기화)
  const [visitCounts, setVisitCounts] = useState<Record<number, number>>({});
  // 슬라이드 0: 폰이 가운데→왼쪽으로 이동하는 인트로 애니메이션
  const [introPhase, setIntroPhase] = useState<"centered" | "layout">("centered");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<number, string>>(new Map());
  const subtitleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCurrentRef = useRef<number | null>(null);
  // 오디오 겹침 방지: 각 playAudio 호출에 고유 ID 부여, 완료 시점에 최신 ID와 다르면 폐기
  const audioGenIdRef = useRef(0);

  const appOrigin = getAppOrigin();

  // Load Pretendard font
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // Pre-load audio for slide 0 in background while on start screen
  useEffect(() => {
    generateAudio(SLIDES[0].narration)
      .then(url => { audioCacheRef.current.set(0, url); setAudioReady(true); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopAudio = useCallback(() => {
    audioGenIdRef.current += 1; // 진행 중인 모든 async 요청 무효화
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
    setSubtitle("");
    setIsAudioLoading(false);
  }, []);

  const playAudio = useCallback(async (index: number) => {
    stopAudio();
    const genId = ++audioGenIdRef.current; // 이 호출만의 고유 ID

    const narration = SLIDES[index].narration;
    if (!narration) return;
    setSubtitle(narration);

    if (audioCacheRef.current.has(index)) {
      if (genId !== audioGenIdRef.current) return; // 이미 다른 요청이 왔음
      const url = audioCacheRef.current.get(index)!;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
      audio.addEventListener("ended", () => { if (genId === audioGenIdRef.current) setSubtitle(""); });
      return;
    }

    setIsAudioLoading(true);
    try {
      const url = await generateAudio(narration);
      if (genId !== audioGenIdRef.current) return; // 완료됐지만 이미 다른 슬라이드로 이동
      audioCacheRef.current.set(index, url);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
      audio.addEventListener("ended", () => { if (genId === audioGenIdRef.current) setSubtitle(""); });
    } catch (err) {
      if (genId !== audioGenIdRef.current) return;
      console.error("Audio generation failed:", err);
      subtitleTimerRef.current = setTimeout(() => setSubtitle(""), 8000);
    } finally {
      if (genId === audioGenIdRef.current) setIsAudioLoading(false);
    }
  }, [stopAudio]);

  // 시작하기 클릭: 슬라이드 0 시작 + 음성 즉시 재생 + 인트로 애니메이션
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startIntroAnim = useCallback(() => {
    setIntroPhase("centered");
    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    introTimerRef.current = setTimeout(() => setIntroPhase("layout"), 2500);
  }, []);

  const handleStart = useCallback(() => {
    setStarted(true);
    prevCurrentRef.current = null;
    startIntroAnim();
    playAudio(0);
  }, [playAudio, startIntroAnim]);

  // 슬라이드 변경 시 해당 iframe 리로드 + 음성 재생
  useEffect(() => {
    if (!started) return;
    // 현재 슬라이드 visitCount 증가 → iframe key 변경 → 리로드
    setVisitCounts(prev => ({ ...prev, [current]: (prev[current] ?? 0) + 1 }));

    if (prevCurrentRef.current !== null && prevCurrentRef.current !== current) {
      // 슬라이드 0으로 돌아오면 인트로 애니메이션 재시작
      if (current === 0) startIntroAnim();
      playAudio(current);
    }

    prevCurrentRef.current = current;
  }, [current, started]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    if (!started) { handleStart(); return; }
    setCurrent((c) => Math.min(c + 1, SLIDES.length - 1));
  }, [started, handleStart]);
  const goPrev = useCallback(() => {
    if (!started) return;
    setCurrent((c) => Math.max(c - 1, 0));
  }, [started]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const slide = SLIDES[current];
  const isOutro = !!slide.noPhone;

  // ── Start screen (before 시작하기) ──────────────────────────────────────
  if (!started) {
    return (
      <div
        className="w-screen h-screen flex flex-col overflow-hidden select-none"
        style={{ fontFamily: "'Pretendard', 'Inter', -apple-system, sans-serif" }}
      >
        {/* header */}
        <div className="shrink-0 flex items-center gap-3 px-6" style={{ height: 52, background: "#4B82F5" }}>
          <img src={logoSvg} alt="안다미로"
            style={{ width: 100, height: 35, filter: "brightness(0) invert(1)", objectFit: "contain", flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginLeft: 4 }}>Interactive Demo</span>
        </div>
        {/* start body */}
        <div
          className="flex-1 flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(160deg, #f0f6ff 0%, #fff 60%)" }}
        >
          <div className="flex flex-col items-center gap-7 text-center px-10" style={{ maxWidth: 560 }}>
            <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="안다미로" style={{ width: 120, height: 120, objectFit: "contain" }} />
            <div>
              <h1 style={{ fontSize: 34, fontWeight: 800, color: "#111", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                AI 감정일기, 안다미로
              </h1>
              <p style={{ marginTop: 10, fontSize: 15, color: "#888", letterSpacing: "-0.01em" }}>
                인터랙티브 데모를 시작할 준비가 되면 버튼을 눌러주세요
              </p>
            </div>
            <button
              type="button"
              onClick={handleStart}
              style={{
                background: "#4B82F5",
                color: "white",
                border: "none",
                borderRadius: 18,
                padding: "18px 56px",
                fontSize: 17,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "-0.01em",
                boxShadow: "0 10px 32px rgba(75,130,245,0.38)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
            >
              시작하기 →
            </button>
            {audioReady ? (
              <p style={{ fontSize: 12, color: "#11A858", marginTop: -16 }}>✓ 음성 준비 완료</p>
            ) : (
              <p style={{ fontSize: 12, color: "#aaa", marginTop: -16 }}>음성 준비 중...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen flex flex-col overflow-hidden select-none relative"
      style={{ fontFamily: "'Pretendard', 'Inter', -apple-system, sans-serif", background: "#fff" }}
    >
      {/* ── Top header bar ── */}
      <div
        className="shrink-0 flex items-center gap-3 px-6"
        style={{ height: 52, background: "#4B82F5" }}
      >
        <img
          src={logoSvg}
          alt="안다미로"
          style={{ width: 100, height: 35, filter: "brightness(0) invert(1)", objectFit: "contain", flexShrink: 0 }}
        />
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginLeft: 4 }}>
          Interactive Demo
        </span>
        <div style={{ flex: 1 }} />
      </div>

      {/* ── Nav bar ── */}
      <div
        className="shrink-0 flex items-center justify-between px-6"
        style={{ height: 52, borderBottom: "1px solid #f0f0f0" }}
      >
        <button
          type="button"
          onClick={goPrev}
          disabled={current === 0}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all"
          style={{
            background: current === 0 ? "#f5f5f5" : "#eef4ff",
            color: current === 0 ? "#ccc" : "#4B82F5",
            fontWeight: 600, fontSize: 13,
            cursor: current === 0 ? "not-allowed" : "pointer",
          }}
        >
          <ChevronLeft size={16} />
          이전
        </button>

        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 20 : 7,
                height: 7,
                borderRadius: 4,
                background: i === current ? "#4B82F5" : "#e0e0e0",
                transition: "all 0.3s ease",
                cursor: "pointer",
                border: "none",
                padding: 0,
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>
            {current + 1} / {SLIDES.length}
          </span>
          <button
            type="button"
            onClick={() => playAudio(current)}
            disabled={isAudioLoading}
            className="flex items-center justify-center rounded-xl transition-all"
            style={{
              width: 36, height: 36,
              background: "#eef4ff",
              color: "#4B82F5",
              cursor: isAudioLoading ? "wait" : "pointer",
            }}
            title="나레이션 재생"
          >
            {isAudioLoading ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={current === SLIDES.length - 1}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all"
            style={{
              background: current === SLIDES.length - 1 ? "#f5f5f5" : "#4B82F5",
              color: current === SLIDES.length - 1 ? "#ccc" : "white",
              fontWeight: 600, fontSize: 13,
              cursor: current === SLIDES.length - 1 ? "not-allowed" : "pointer",
            }}
          >
            다음
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      {isOutro ? (
        /* ── Outro slide: clean white, no phone ── */
        <div className="flex-1 flex items-center justify-center min-h-0" style={{ background: "#fff" }}>
          <div className="flex flex-col items-center gap-6 px-16 text-center" style={{ maxWidth: 700 }}>
            <div style={{
              width: 48, height: 4, borderRadius: 2,
              background: "linear-gradient(90deg, #4B82F5, #11A858)",
            }} />
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{
                background: "#eef4ff", color: "#4B82F5",
                fontSize: 12, fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4B82F5", display: "inline-block" }} />
              {slide.category}
            </span>
            <h1 style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 800, color: "#0D1B3E", lineHeight: 1.2,
            }}>
              {slide.title}
            </h1>
            <p style={{ fontSize: "clamp(16px, 1.4vw, 22px)", color: "#666", lineHeight: 1.7 }}>
              {slide.body}
            </p>
            <div className="rounded-full px-6 py-3 mt-2" style={{ background: "#0D1B3E" }}>
              <span style={{ fontSize: 15, color: "white", fontWeight: 600 }}>
                복잡해도 괜찮아, 길은 있어 :)
              </span>
            </div>
          </div>
        </div>
      ) : current === 0 ? (
        /* ── Slide 0: 폰이 가운데에서 시작해 왼쪽으로 이동 ── */
        <div className="flex-1 relative min-h-0 overflow-hidden" style={{ background: "#f8f9ff" }}>
          <div
            style={{
              position: "absolute", top: 0, bottom: 0, left: 0,
              width: introPhase === "layout" ? "50%" : "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "8px 20px",
              transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 1,
            }}
          >
            <PhoneMockup>
              <iframe
                key={`0-${visitCounts[0] ?? 0}`}
                src={`${appOrigin}/intro`}
                title="안다미로 앱"
                style={{ position: "absolute", top: 0, left: 0, width: 390, height: 844, border: "none" }}
              />
            </PhoneMockup>
          </div>
          <div
            style={{
              position: "absolute", top: 0, bottom: 0, right: 0, width: "50%",
              display: "flex", flexDirection: "column", justifyContent: "center",
              padding: "32px 48px 32px 40px",
              opacity: introPhase === "layout" ? 1 : 0,
              transform: introPhase === "layout" ? "translateX(0)" : "translateX(48px)",
              transition: "opacity 0.8s ease 0.7s, transform 0.8s ease 0.7s",
              pointerEvents: introPhase === "layout" ? "auto" : "none",
            }}
          >
            <SlideText slide={SLIDES[0]} index={0} total={SLIDES.length} />
          </div>
        </div>
      ) : (
        /* ── Normal slides (1~6): phone left + text right ── */
        <div className="flex-1 flex min-h-0 gap-0">
          <div
            className="flex items-center justify-center"
            style={{
              width: "50%",
              padding: "8px 20px",
              background: "#f8f9ff",
              borderRight: "1px solid #eeefff",
            }}
          >
            <PhoneMockup>
              {SLIDES.slice(1, SLIDES.length - 1).map((s, idx) => {
                const slideIdx = idx + 1;
                // 현재 슬라이드만 iframe 마운트 (동시 로드 시 sessionStorage 충돌 방지)
                if (!s.iframeRoute || slideIdx !== current) return null;
                return (
                  <iframe
                    key={`${slideIdx}-${visitCounts[slideIdx] ?? 0}`}
                    src={`${appOrigin}${s.iframeRoute}`}
                    title={s.title}
                    style={{
                      position: "absolute",
                      top: 0, left: 0,
                      width: 390, height: 844,
                      border: "none",
                    }}
                  />
                );
              })}
            </PhoneMockup>
          </div>

          <div
            className="flex-1 flex flex-col justify-center"
            style={{ padding: "32px 48px 32px 40px" }}
          >
            <SlideText key={current} slide={slide} index={current} total={SLIDES.length} />
          </div>
        </div>
      )}

      {/* ── Floating subtitle ── */}
      {subtitle && (
        <div
          className="absolute left-0 right-0 flex justify-center pointer-events-none"
          style={{ bottom: 28, zIndex: 50 }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              borderRadius: 16,
              padding: "10px 24px",
              maxWidth: "70%",
            }}
          >
            <p style={{ color: "white", fontSize: 14, textAlign: "center", lineHeight: 1.6 }}>
              {subtitle}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
