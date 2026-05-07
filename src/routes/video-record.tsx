import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft, Circle, Square, RotateCcw, CheckCircle2,
  Camera, Loader2, Mic, MicOff,
} from "lucide-react";
import { useFaceApi, type FaceExpression } from "@/hooks/useFaceApi";
import { setVideoRecord, type MoodKey } from "@/lib/videoStore";

import moodBest from "@/assets/moods/mood-best.webp";
import moodGood from "@/assets/moods/mood-good.webp";
import moodOkay from "@/assets/moods/mood-okay.webp";
import moodBad from "@/assets/moods/mood-bad.webp";
import moodWorst from "@/assets/moods/mood-worst.webp";

export const Route = createFileRoute("/video-record")({
  validateSearch: (s: Record<string, unknown>): { mood?: MoodKey } => ({
    mood: (s.mood as MoodKey) ?? undefined,
  }),
  head: () => ({
    meta: [
      { title: "영상 기록 — 안다미로" },
      { name: "theme-color", content: "#000000" },
    ],
  }),
  component: VideoRecordPage,
});

// face-api 표정 → 앱 감정 매핑
function mapExpressionToMood(expr: FaceExpression, conf: number): MoodKey | "surprised" {
  if (expr === "surprised") return "surprised";
  if (expr === "happy") return conf > 0.7 ? "best" : "good";
  if (expr === "neutral") return "okay";
  if (expr === "sad") return "bad";
  if (expr === "angry" || expr === "disgusted" || expr === "fearful") return "worst";
  return "okay";
}

const MOOD_META: Record<MoodKey, { label: string; thumb: string; emoji: string }> = {
  best: { label: "최고예요!", thumb: moodBest, emoji: "🤩" },
  good: { label: "좋아요!", thumb: moodGood, emoji: "😊" },
  okay: { label: "보통이에요", thumb: moodOkay, emoji: "😐" },
  bad: { label: "별로예요", thumb: moodBad, emoji: "😔" },
  worst: { label: "최악이에요", thumb: moodWorst, emoji: "😭" },
};

const MOODS = (["best", "good", "okay", "bad", "worst"] as MoodKey[]).map((k) => ({
  key: k,
  ...MOOD_META[k],
}));

const EXPRESSION_KO: Record<FaceExpression, string> = {
  neutral: "평온",
  happy: "행복",
  sad: "슬픔",
  angry: "분노",
  fearful: "두려움",
  disgusted: "역겨움",
  surprised: "놀람",
};

type RecordState = "idle" | "recording" | "done";

// SpeechRecognition 타입 선언
type SpeechRecognitionType = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

function getSpeechRecognition(): (new () => SpeechRecognitionType) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionType;
    webkitSpeechRecognition?: new () => SpeechRecognitionType;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function VideoRecordPage() {
  const { mood: initMood } = Route.useSearch();
  const navigate = useNavigate();

  // 카메라 상태
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 녹화 상태
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordSec, setRecordSec] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 음성 인식
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [speechSupported] = useState(() => !!getSpeechRecognition());
  const [speechActive, setSpeechActive] = useState(false);
  const finalTranscriptRef = useRef("");

  // 감정 선택
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(initMood ?? null);

  // face-api
  const { modelsLoaded, modelError, dominantExpression, dominantConfidence } =
    useFaceApi(videoRef, streamReady);

  const aiMoodRaw =
    dominantExpression && dominantConfidence > 0.3
      ? mapExpressionToMood(dominantExpression, dominantConfidence)
      : null;
  const aiMood: MoodKey | null =
    aiMoodRaw && aiMoodRaw !== "surprised" ? aiMoodRaw : null;

  // AI 감지 시 무드 자동 선택 (사용자가 아직 선택 안 한 경우)
  useEffect(() => {
    if (aiMood && selectedMood === null) {
      setSelectedMood(aiMood);
    }
  }, [aiMood, selectedMood]);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamReady(true);
    } catch (err) {
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "카메라 접근이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요."
          : "카메라를 시작할 수 없습니다. 다른 앱이 카메라를 사용 중인지 확인해 주세요.";
      setCameraError(msg);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      recognitionRef.current?.abort();
    };
  }, [startCamera]);

  // 음성 인식 시작/중지
  const startSpeech = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    finalTranscriptRef.current = transcript;
    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = finalTranscriptRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          final += r[0].transcript;
        } else {
          interim += r[0].transcript;
        }
      }
      finalTranscriptRef.current = final;
      setTranscript(final);
      setInterimText(interim);
    };

    rec.onend = () => {
      // 녹화 중이면 자동 재시작 (연속 인식)
      if (recordState === "recording" || speechActive) {
        try { rec.start(); } catch { /* ignore */ }
      } else {
        setSpeechActive(false);
        setInterimText("");
      }
    };

    rec.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setSpeechActive(false);
      }
    };

    rec.start();
    recognitionRef.current = rec;
    setSpeechActive(true);
  }, [transcript, recordState, speechActive]);

  const stopSpeech = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setSpeechActive(false);
    setInterimText("");
  }, []);

  // 녹화 시작
  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordSec(0);

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      setRecordState("done");
    };
    recorder.start(200);
    recorderRef.current = recorder;
    setRecordState("recording");

    // 음성 인식 자동 시작
    if (speechSupported && !speechActive) startSpeech();

    timerRef.current = setInterval(() => setRecordSec((s) => s + 1), 1000);
  };

  // 녹화 중지
  const stopRecording = () => {
    recorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeech();
  };

  // 다시 녹화
  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordSec(0);
    setRecordState("idle");
    setTranscript("");
    setInterimText("");
    finalTranscriptRef.current = "";
  };

  // 기록 완료
  const completeRecording = () => {
    if (speechActive) stopSpeech();
    const videoUrl = recordedBlob ? URL.createObjectURL(recordedBlob) : "";
    const finalMood = selectedMood ?? aiMood ?? "okay";

    setVideoRecord({
      videoUrl,
      aiMood: aiMoodRaw ?? null,
      aiMoodLabel:
        aiMoodRaw === "surprised"
          ? "놀람"
          : aiMoodRaw
          ? MOOD_META[aiMoodRaw].label
          : "-",
      aiConfidence: dominantConfidence,
      rawExpressions: {},
      userMood: finalMood,
      userMoodLabel: MOOD_META[finalMood].label,
      transcript: finalTranscriptRef.current.trim(),
    });
    navigate({ to: "/analysis", search: {} });
  };

  const formatSec = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const displayTranscript = transcript + (interimText ? ` ${interimText}` : "");

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col bg-black" style={{ position: "relative" }}>
        {/* 헤더 */}
        <header className="relative z-20 flex shrink-0 items-center justify-between px-4 pt-[52px] pb-3">
          <Link
            to="/record"
            aria-label="뒤로"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
          </Link>
          <span className="text-white/90 text-[14px] font-semibold tracking-tight">
            영상으로 기록하기
          </span>
          <div className="h-9 w-9" />
        </header>

        {/* 카메라 프리뷰 */}
        <div className="relative flex-1 min-h-0 overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* 카메라 오류 */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-8 text-center">
              <Camera className="h-10 w-10 text-white/50 mb-3" />
              <p className="text-white text-[14px] leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-5 rounded-full bg-white/20 px-5 py-2.5 text-white text-[13px] font-medium"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 모델 로딩 */}
          {streamReady && !modelsLoaded && !modelError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              <span className="text-white text-[12px]">AI 분석 모델 로딩 중...</span>
            </div>
          )}

          {/* 모델 오류 */}
          {modelError && (
            <div className="absolute bottom-4 left-3 right-3 rounded-xl bg-black/60 px-4 py-3 backdrop-blur-sm">
              <p className="text-amber-300 text-[12px] leading-relaxed">
                ⚠️ AI 감정 분석을 사용할 수 없습니다. 감정은 직접 선택해 주세요.
              </p>
            </div>
          )}

          {/* AI 감지 배지 */}
          {modelsLoaded && dominantExpression && dominantConfidence > 0.3 && (
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3.5 py-2 backdrop-blur-sm">
              <span className="text-[18px] leading-none">
                {aiMoodRaw && aiMoodRaw !== "surprised" ? MOOD_META[aiMoodRaw].emoji : "😮"}
              </span>
              <div>
                <p className="text-white text-[12px] font-semibold leading-none">
                  {EXPRESSION_KO[dominantExpression]}
                </p>
                <p className="text-white/60 text-[10px] mt-0.5">
                  {Math.round(dominantConfidence * 100)}% 확신
                </p>
              </div>
              <span className="ml-1 text-[10px] font-medium text-cyan-300 border border-cyan-300/40 rounded px-1.5 py-0.5">
                AI
              </span>
            </div>
          )}

          {/* 녹화 중 */}
          {recordState === "recording" && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-[12px] font-semibold tabular-nums">
                {formatSec(recordSec)}
              </span>
            </div>
          )}

          {/* 녹화 완료 */}
          {recordState === "done" && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-green-500/90 px-3 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              <span className="text-white text-[12px] font-semibold">
                {formatSec(recordSec)} 완료
              </span>
            </div>
          )}

          {/* 음성 인식 텍스트 오버레이 */}
          {(speechActive || displayTranscript) && (
            <div className="absolute bottom-4 left-3 right-3">
              <div className="rounded-xl bg-black/65 px-4 py-3 backdrop-blur-sm">
                {speechActive && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-red-300 text-[11px] font-semibold">음성 인식 중</span>
                  </div>
                )}
                <p className="text-white text-[13px] leading-relaxed">
                  {transcript && <span>{transcript}</span>}
                  {interimText && (
                    <span className="text-white/50">{interimText}</span>
                  )}
                  {!displayTranscript && speechActive && (
                    <span className="text-white/40 text-[12px]">말씀해 주세요...</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 하단 패널 */}
        <div
          className="shrink-0 rounded-t-[24px] bg-white px-5 pt-5 pb-[36px]"
          style={{ boxShadow: "0 -8px 24px -6px rgba(20,30,60,0.14)" }}
        >
          {/* 감정 선택 */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12px] text-[#9a9aa3] tracking-tight">오늘의 감정톡</p>
              <p className="mt-0.5 font-bold text-foreground text-[15px] tracking-tight">
                {selectedMood
                  ? `${MOOD_META[selectedMood].emoji} ${MOOD_META[selectedMood].label}`
                  : "감정을 선택해 주세요"}
              </p>
            </div>
            {aiMood && selectedMood !== aiMood && (
              <button
                type="button"
                onClick={() => setSelectedMood(aiMood)}
                className="flex items-center gap-1.5 rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1.5"
              >
                <span className="text-[11px] text-cyan-700 font-medium">AI 추천</span>
                <span className="text-[14px]">{MOOD_META[aiMood].emoji}</span>
              </button>
            )}
          </div>

          {/* 감정 칩 */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-5 px-5">
            {MOODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMood(m.key)}
                className={`shrink-0 flex flex-col items-center gap-1 rounded-2xl px-3 pt-2.5 pb-2 transition-all ${
                  selectedMood === m.key
                    ? "bg-[var(--primary)] shadow-md"
                    : "bg-[#f3f4f8]"
                }`}
              >
                <img src={m.thumb} alt="" className="h-9 w-9 object-contain" />
                <span
                  className={`text-[11px] font-medium whitespace-nowrap ${
                    selectedMood === m.key ? "text-white" : "text-[#666]"
                  }`}
                >
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {/* 녹화 컨트롤 */}
          <div className="mt-4 flex gap-2.5">
            {recordState === "idle" && (
              <>
                {/* 음성 인식 토글 (녹화 전) */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => (speechActive ? stopSpeech() : startSpeech())}
                    disabled={!streamReady}
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-all ${
                      speechActive
                        ? "bg-red-100 text-red-500"
                        : "bg-[#f3f4f8] text-[#888]"
                    }`}
                    aria-label={speechActive ? "음성 인식 중지" : "음성 인식 시작"}
                  >
                    {speechActive ? (
                      <Mic className="h-5 w-5 animate-pulse" />
                    ) : (
                      <MicOff className="h-5 w-5" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={!streamReady}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-[14px] tracking-tight transition-all ${
                    streamReady
                      ? "bg-red-500 text-white shadow-md active:scale-[0.99]"
                      : "bg-[#e8e8ec] text-[#b8bac2] cursor-not-allowed"
                  }`}
                >
                  <Circle className="h-4 w-4 fill-current" />
                  녹화 시작
                </button>
              </>
            )}

            {recordState === "recording" && (
              <button
                type="button"
                onClick={stopRecording}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#222] py-3.5 font-semibold text-white text-[14px] tracking-tight shadow-md active:scale-[0.99] transition-all"
              >
                <Square className="h-4 w-4 fill-current" />
                녹화 중지
              </button>
            )}

            {recordState === "done" && (
              <>
                <button
                  type="button"
                  onClick={resetRecording}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#f3f4f8] px-4 py-3.5 font-semibold text-foreground text-[14px] tracking-tight active:scale-[0.99] transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                  다시
                </button>
                <button
                  type="button"
                  onClick={completeRecording}
                  disabled={!selectedMood}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-[14px] tracking-tight shadow-md active:scale-[0.99] transition-all ${
                    selectedMood
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[#e8e8ec] text-[#b8bac2] cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  기록 완료
                </button>
              </>
            )}
          </div>

          {/* 녹화 없이 완료 */}
          {recordState === "idle" && streamReady && (
            <button
              type="button"
              onClick={completeRecording}
              disabled={!selectedMood}
              className={`mt-2 w-full rounded-2xl py-3 text-[13px] font-medium tracking-tight transition-all ${
                selectedMood
                  ? "text-[var(--primary)] underline underline-offset-2"
                  : "text-[#bbb] cursor-not-allowed"
              }`}
            >
              녹화 없이 완료
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
