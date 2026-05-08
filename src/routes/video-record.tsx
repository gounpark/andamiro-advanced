import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, Camera, Loader2, Mic } from "lucide-react";
import { useFaceApi, type FaceExpression } from "@/hooks/useFaceApi";
import { setVideoRecord, type MoodKey, type EmotionSnapshot } from "@/lib/videoStore";

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

type SpeechRecognitionType = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
type SpeechRecognitionEvent = { results: SpeechRecognitionResultList; resultIndex: number };

function getSpeechRecognition(): (new () => SpeechRecognitionType) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionType;
    webkitSpeechRecognition?: new () => SpeechRecognitionType;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const EXPRESSION_KO: Record<string, string> = {
  neutral: "평온", happy: "기쁨", sad: "슬픔",
  angry: "긴장", fearful: "두려움", disgusted: "불쾌", surprised: "놀람",
};

type RecordState = "idle" | "recording" | "done";

function mapExpressionToMood(expr: FaceExpression, conf: number): MoodKey | "surprised" {
  if (expr === "surprised") return "surprised";
  if (expr === "happy") return conf > 0.7 ? "best" : "good";
  if (expr === "neutral") return "okay";
  if (expr === "sad") return "bad";
  if (expr === "angry" || expr === "disgusted" || expr === "fearful") return "worst";
  return "okay";
}

function computeOverallMood(timeline: EmotionSnapshot[]) {
  if (!timeline.length) return { aiMood: null as MoodKey | "surprised" | null, aiConfidence: 0 };
  const counts: Record<string, number> = {};
  for (const snap of timeline) {
    const entries = Object.entries(snap.expressions);
    if (!entries.length) continue;
    const [dom] = entries.reduce<[string, number]>((mx, [k, v]) => (v ?? 0) > mx[1] ? [k, v ?? 0] : mx, ["", 0]);
    if (dom) counts[dom] = (counts[dom] ?? 0) + 1;
  }
  const [topEmotion, topCount] = Object.entries(counts).reduce<[string, number]>(
    (mx, cur) => cur[1] > mx[1] ? cur : mx, ["neutral", 0]
  );
  const confidence = topCount / timeline.length;
  return {
    aiMood: mapExpressionToMood(topEmotion as FaceExpression, confidence),
    aiConfidence: confidence,
  };
}

function VideoRecordPage() {
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordSec, setRecordSec] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 감정 타임라인 수집
  const timelineRef = useRef<EmotionSnapshot[]>([]);
  const lastSnapSecRef = useRef(-1);

  // 음성 인식
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [speechActive, setSpeechActive] = useState(false);
  const [speechSupported] = useState(() => !!getSpeechRecognition());
  const finalTranscriptRef = useRef("");

  // 녹화 중일 때만 face-api 활성화 — idle에서는 CPU 절약
  const { modelsLoaded, modelError, expressions, dominantExpression, dominantConfidence } =
    useFaceApi(videoRef, recordState === "recording");

  // 1초마다 스냅샷 수집
  useEffect(() => {
    if (recordState !== "recording" || !expressions) return;
    if (recordSec !== lastSnapSecRef.current) {
      lastSnapSecRef.current = recordSec;
      timelineRef.current.push({ sec: recordSec, expressions: { ...expressions } });
    }
  }, [expressions, recordSec, recordState]);

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
      setCameraError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "카메라 접근이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요."
          : "카메라를 시작할 수 없습니다."
      );
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

  // 음성 인식
  const startSpeech = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    finalTranscriptRef.current = transcript;
    const rec = new SR();
    rec.lang = "ko-KR"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ""; let final = finalTranscriptRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      finalTranscriptRef.current = final;
      setTranscript(final); setInterimText(interim);
    };
    rec.onend = () => {
      if (speechActive) { try { rec.start(); } catch { /* ignore */ } }
      else { setSpeechActive(false); setInterimText(""); }
    };
    rec.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") setSpeechActive(false); };
    rec.start();
    recognitionRef.current = rec;
    setSpeechActive(true);
  }, [transcript, speechActive]);

  const stopSpeech = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setSpeechActive(false); setInterimText("");
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    timelineRef.current = [];
    lastSnapSecRef.current = -1;
    setRecordSec(0);

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      setRecordState("done");
    };
    recorder.start(200);
    recorderRef.current = recorder;
    setRecordState("recording");

    if (speechSupported) startSpeech();
    timerRef.current = setInterval(() => setRecordSec((s) => s + 1), 1000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeech();
  };

  const resetRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null); setRecordedUrl(null);
    setRecordSec(0); setRecordState("idle");
    setTranscript(""); setInterimText("");
    finalTranscriptRef.current = "";
    timelineRef.current = []; lastSnapSecRef.current = -1;
  };

  const completeRecording = () => {
    const videoUrl = recordedBlob && recordedUrl ? recordedUrl : "";
    const { aiMood, aiConfidence } = computeOverallMood(timelineRef.current);
    const aiMoodLabel = aiMood && aiMood !== "surprised"
      ? { best: "최고예요!", good: "좋아요!", okay: "보통이에요", bad: "별로예요", worst: "최악이에요" }[aiMood] ?? "-"
      : aiMood === "surprised" ? "놀람" : "-";

    setVideoRecord({
      videoUrl,
      aiMood,
      aiMoodLabel,
      aiConfidence,
      rawExpressions: expressions ?? {},
      userMood: null,
      userMoodLabel: null,
      transcript: finalTranscriptRef.current.trim(),
      emotionTimeline: timelineRef.current,
    });
    navigate({ to: "/analysis", search: {} });
  };

  const formatSec = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const displayTranscript = transcript + (interimText ? ` ${interimText}` : "");

  // ─── 녹화 중지 후 확인 화면 ───
  if (recordState === "done") {
    return (
      <div className="app-shell">
        <div className="app-frame relative bg-black overflow-hidden">
          {/* 녹화된 영상 미리보기 */}
          {recordedUrl && (
            <video
              ref={previewRef}
              src={recordedUrl}
              playsInline
              autoPlay
              loop
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          )}

          {/* 상단 X 버튼 */}
          <button
            type="button"
            onClick={resetRecording}
            aria-label="다시 녹화"
            className="absolute z-20 grid h-10 w-10 place-items-center rounded-full bg-black/60 border border-white/20 text-white"
            style={{ top: "calc(52px)", left: "16px" }}
          >
            <X className="h-5 w-5" />
          </button>

          {/* 녹화 시간 칩 */}
          <div className="absolute z-20 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5"
            style={{ top: "calc(52px + 4px)", left: "50%", transform: "translateX(-50%)" }}>
            <span className="text-white text-[13px] font-semibold tabular-nums">
              {formatSec(recordSec)} 녹화됨
            </span>
          </div>

          {/* 하단 액션 오버레이 */}
          <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-12"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)" }}>
            <p className="text-white text-center font-bold text-[18px] tracking-tight mb-1">
              녹화를 마칠까요?
            </p>
            <p className="text-white/60 text-center text-[13px] mb-5 tracking-tight">
              방금 녹화한 영상을 확인해보세요
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={resetRecording}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 border border-white/20 py-3.5 font-semibold text-white text-[15px] tracking-tight backdrop-blur-sm"
              >
                다시 녹화
              </button>
              <button
                type="button"
                onClick={completeRecording}
                className="flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white text-[15px] tracking-tight shadow-lg"
                style={{ background: "var(--primary)" }}
              >
                기록 완료
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 녹화 준비 / 녹화 중 화면 ───
  return (
    <div className="app-shell">
      <div className="app-frame relative bg-black overflow-hidden">
        {/* 카메라 프리뷰 */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* 카메라 오류 */}
        {cameraError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 px-8 text-center">
            <Camera className="h-10 w-10 text-white/50 mb-3" />
            <p className="text-white text-[14px] leading-relaxed mb-5">{cameraError}</p>
            <button type="button" onClick={startCamera}
              className="rounded-full bg-white/20 px-5 py-2.5 text-white text-[13px] font-medium">
              다시 시도
            </button>
          </div>
        )}

        {/* ── 상단 오버레이 ── */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-start px-4"
          style={{ paddingTop: "52px" }}>
          {/* X / 뒤로가기 */}
          <button
            type="button"
            onClick={() => navigate({ to: "/record" })}
            aria-label="뒤로"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/60 border border-white/20 text-white"
          >
            <X className="h-5 w-5" />
          </button>

          {/* 안내 텍스트 (idle) */}
          {recordState === "idle" && streamReady && (
            <div className="ml-3 flex-1 flex justify-center pr-10">
              <div className="rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
                <span className="text-white text-[13px] font-medium tracking-tight">
                  오늘 있었던 일을 편하게 말해보세요
                </span>
              </div>
            </div>
          )}

          {/* 녹화 타이머 (recording) */}
          {recordState === "recording" && (
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-black/60 border border-white/10 px-3 py-1.5 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-[13px] font-semibold tabular-nums">
                {formatSec(recordSec)}
              </span>
            </div>
          )}
        </div>

        {/* ── 카메라 위 오버레이 배지 ── */}
        {/* idle: 카메라 준비 완료 표시 (face-api는 꺼둠) */}
        {recordState === "idle" && streamReady && (
          <div className="absolute z-20 flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-2 backdrop-blur-sm"
            style={{ top: "calc(52px + 56px)", left: "16px" }}>
            <span className="h-2 w-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-[11px] font-medium text-green-300">카메라 준비 완료</span>
          </div>
        )}

        {/* AI 분석 중 배지 (recording) */}
        {recordState === "recording" && modelsLoaded && (
          <div className="absolute z-20 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 backdrop-blur-sm"
            style={{ top: "calc(52px + 56px)", right: "16px" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-300 text-[11px] font-medium">AI 분석 중</span>
          </div>
        )}

        {/* 모델 로딩 (녹화 시작 직후) */}
        {recordState === "recording" && !modelsLoaded && !modelError && (
          <div className="absolute top-[calc(52px+56px)] left-1/2 -translate-x-1/2 z-20
            flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            <span className="text-white text-[12px]">AI 분석 준비 중...</span>
          </div>
        )}

        {/* 음성 인식 텍스트 오버레이 */}
        {recordState === "recording" && (speechActive || displayTranscript) && (
          <div className="absolute z-20 bottom-[180px] left-3 right-3">
            <div className="rounded-2xl bg-black/65 px-4 py-3 backdrop-blur-sm">
              {speechActive && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Mic className="h-3 w-3 text-red-400 animate-pulse" />
                  <span className="text-red-300 text-[11px] font-semibold">음성 인식 중</span>
                </div>
              )}
              <p className="text-white text-[13px] leading-relaxed">
                {transcript && <span>{transcript}</span>}
                {interimText && <span className="text-white/50">{interimText}</span>}
                {!displayTranscript && speechActive && (
                  <span className="text-white/40 text-[12px]">말씀해 주세요...</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── 하단 컨트롤 ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center pb-12"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)" }}>

          {recordState === "idle" && (
            <>
              {/* 안내 텍스트 */}
              <p className="text-white/60 text-[12px] mb-5 tracking-tight">
                {streamReady ? "버튼을 눌러 녹화를 시작하세요" : "카메라 준비 중..."}
              </p>
              {/* 셔터 버튼 */}
              <button
                type="button"
                onClick={startRecording}
                disabled={!streamReady}
                className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-white transition-transform active:scale-95 disabled:opacity-40"
              >
                <div className="h-[60px] w-[60px] rounded-full bg-white" />
              </button>
            </>
          )}

          {recordState === "recording" && (
            <>
              <p className="text-white/60 text-[12px] mb-5 tracking-tight">
                말하는 동안 AI가 감정을 분석하고 있어요
              </p>
              {/* 정지 버튼 */}
              <button
                type="button"
                onClick={stopRecording}
                className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-white transition-transform active:scale-95"
              >
                <div className="h-[28px] w-[28px] rounded-[6px] bg-white" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
