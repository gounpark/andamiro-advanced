import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, Camera, Loader2, Mic } from "lucide-react";
import { type FaceExpression } from "@/hooks/useFaceApi";
import { ensureModelsLoaded } from "@/hooks/useFaceApi";
import { setVideoRecord, type MoodKey, type EmotionSnapshot } from "@/lib/videoStore";

export const Route = createFileRoute("/video-record")({
  validateSearch: (s: Record<string, unknown>): { mood?: MoodKey } => ({
    mood: (s.mood as MoodKey) ?? undefined,
  }),
  head: () => ({
    meta: [{ title: "영상 기록 — 안다미로" }, { name: "theme-color", content: "#000000" }],
  }),
  component: VideoRecordPage,
});

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
type SpeechRecognitionEvent = { results: SpeechRecognitionResultList; resultIndex: number };

function getSpeechRecognition(): (new () => SpeechRecognitionType) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionType;
    webkitSpeechRecognition?: new () => SpeechRecognitionType;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const EXPRESSION_KO: Record<string, string> = {
  neutral: "평온",
  happy: "기쁨",
  sad: "슬픔",
  angry: "긴장",
  fearful: "두려움",
  disgusted: "불쾌",
  surprised: "놀람",
};
void EXPRESSION_KO; // suppress unused warning

// "perm": 처음 방문 시 카메라/마이크 사용 안내 화면
type RecordState = "perm" | "idle" | "recording" | "analyzing" | "done";

const PERM_CACHE_KEY = "andamiro_cam_perm"; // 한번 허용 후 재안내 스킵용

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
    const [dom] = entries.reduce<[string, number]>(
      (mx, [k, v]) => ((v ?? 0) > mx[1] ? [k, v ?? 0] : mx),
      ["", 0],
    );
    if (dom) counts[dom] = (counts[dom] ?? 0) + 1;
  }
  const [topEmotion, topCount] = Object.entries(counts).reduce<[string, number]>(
    (mx, cur) => (cur[1] > mx[1] ? cur : mx),
    ["neutral", 0],
  );
  const confidence = timeline.length > 0 ? topCount / timeline.length : 0;
  return {
    aiMood: mapExpressionToMood(topEmotion as FaceExpression, confidence),
    aiConfidence: confidence,
  };
}

// 녹화된 영상을 프레임 단위로 샘플링해서 감정 분석
async function analyzeRecordedVideo(blobUrl: string): Promise<EmotionSnapshot[]> {
  await ensureModelsLoaded();
  const faceapi = await import("face-api.js");

  const video = document.createElement("video");
  video.src = blobUrl;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";

  // 메타데이터 로드 대기
  await new Promise<void>((resolve, reject) => {
    const onMeta = () => {
      video.removeEventListener("loadedmetadata", onMeta);
      resolve();
    };
    const onErr = () => {
      video.removeEventListener("error", onErr);
      reject(new Error("video load failed"));
    };
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("error", onErr);
    video.load();
    // 타임아웃 fallback
    setTimeout(resolve, 5000);
  });

  const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 10;
  // 최대 8 프레임, 최소 1초 간격
  const sampleCount = Math.min(8, Math.max(1, Math.floor(duration)));
  const interval = duration / sampleCount;
  const snapshots: EmotionSnapshot[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const t = i * interval + interval * 0.5; // 각 구간 중간
    video.currentTime = Math.min(t, duration - 0.1);

    await new Promise<void>((res) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        res();
      };
      video.addEventListener("seeked", onSeeked);
      setTimeout(res, 1500); // seeked 타임아웃 fallback
    });

    try {
      const result = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
        .withFaceExpressions();

      if (result) {
        const exprs = result.expressions as unknown as Record<string, number>;
        const filtered: Record<string, number> = {};
        for (const k of ["neutral", "happy", "sad", "angry", "fearful", "disgusted", "surprised"]) {
          filtered[k] = exprs[k] ?? 0;
        }
        snapshots.push({ sec: Math.round(t), expressions: filtered });
      }
    } catch {
      /* 프레임 분석 실패 무시 */
    }
  }

  return snapshots;
}

function VideoRecordPage() {
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // localStorage 플래그 있으면 perm 화면 스킵, 없으면 사용 안내 먼저
  const [recordState, setRecordState] = useState<RecordState>(() =>
    localStorage.getItem(PERM_CACHE_KEY) === "1" ? "idle" : "perm",
  );
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordSec, setRecordSec] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 감정 타임라인 (post-recording analysis 결과를 저장)
  const timelineRef = useRef<EmotionSnapshot[]>([]);

  // 음성 인식
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [speechActive, setSpeechActive] = useState(false);
  const [speechSupported] = useState(() => !!getSpeechRecognition());
  const finalTranscriptRef = useRef("");
  // interim 업데이트 throttle용
  const interimRef = useRef("");
  const interimThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 모델 백그라운드 프리로드 (녹화 시작 전에 미리 로드해서 분석 대기 시간 단축)
  useEffect(() => {
    ensureModelsLoaded().catch(() => {
      /* 실패해도 무시 - 분석 시 재시도 */
    });
  }, []);

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
      // 카메라 성공 시 권한 허용 상태 캐시 (다음 방문부터 perm 화면 스킵)
      localStorage.setItem(PERM_CACHE_KEY, "1");
      setStreamReady(true);
    } catch (err) {
      const isNotAllowed = err instanceof Error && err.name === "NotAllowedError";
      setCameraError(
        isNotAllowed
          ? "카메라 접근이 거부되었습니다.\n브라우저 설정 → 사이트 권한에서 카메라/마이크를 허용해 주세요."
          : "카메라를 시작할 수 없습니다.",
      );
      // 거부됐으면 다음엔 perm 화면 다시 보여주기 (재허용 유도)
      if (isNotAllowed) localStorage.removeItem(PERM_CACHE_KEY);
    }
  }, []);

  // 마운트 시: perm 화면이 필요 없으면 바로 startCamera
  // perm 화면이 있으면 사용자 액션 후 startCamera
  useEffect(() => {
    // Permissions API로 이미 허용 여부 확인 → perm 화면 스킵 가능하면 스킵
    const checkAndStart = async () => {
      try {
        const [cam, mic] = await Promise.all([
          navigator.permissions.query({ name: "camera" as PermissionName }),
          navigator.permissions.query({ name: "microphone" as PermissionName }),
        ]);
        if (cam.state === "granted" && mic.state === "granted") {
          // 이미 허용됨 — perm 화면 없이 바로 시작
          localStorage.setItem(PERM_CACHE_KEY, "1");
          setRecordState("idle");
          startCamera();
          return;
        }
      } catch {
        // Permissions API 미지원 (일부 iOS 버전 등) — localStorage 플래그로만 판단
      }
      // 이미 "idle" 상태(localStorage 플래그 있었음) → startCamera
      setRecordState((prev) => {
        if (prev === "idle") startCamera();
        return prev;
      });
    };
    checkAndStart();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      recognitionRef.current?.abort();
      if (interimThrottleRef.current) clearTimeout(interimThrottleRef.current);
    };
  }, [startCamera]);

  // 사용자가 perm 화면에서 "시작하기" 탭 → 카메라 시작
  const handlePermAccept = useCallback(() => {
    localStorage.setItem(PERM_CACHE_KEY, "1");
    setRecordState("idle");
    startCamera();
  }, [startCamera]);

  // 음성 인식 (interim 업데이트 throttle — 200ms)
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
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      finalTranscriptRef.current = final;
      // final은 즉시 업데이트
      setTranscript(final);
      // interim은 200ms throttle로 re-render 줄이기
      interimRef.current = interim;
      if (!interimThrottleRef.current) {
        interimThrottleRef.current = setTimeout(() => {
          setInterimText(interimRef.current);
          interimThrottleRef.current = null;
        }, 200);
      }
    };
    rec.onend = () => {
      if (speechActive) {
        try {
          rec.start();
        } catch {
          /* ignore */
        }
      } else {
        setSpeechActive(false);
        setInterimText("");
      }
    };
    rec.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") setSpeechActive(false);
    };
    rec.start();
    recognitionRef.current = rec;
    setSpeechActive(true);
  }, [transcript, speechActive]);

  const stopSpeech = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setSpeechActive(false);
    setInterimText("");
    if (interimThrottleRef.current) {
      clearTimeout(interimThrottleRef.current);
      interimThrottleRef.current = null;
    }
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    timelineRef.current = [];
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
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      // 녹화 후 분석 시작
      setRecordState("analyzing");
      try {
        const timeline = await analyzeRecordedVideo(url);
        timelineRef.current = timeline;
      } catch {
        // 분석 실패해도 done으로 이동 (타임라인 없이)
      }
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
    // 녹화 완료 시 카메라·마이크 스트림 즉시 해제
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreamReady(false);
    // recordState는 recorder.onstop이 "analyzing" → "done"으로 전환
  };

  const resetRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordSec(0);
    setRecordState("idle");
    setTranscript("");
    setInterimText("");
    finalTranscriptRef.current = "";
    timelineRef.current = [];
    // 다시 녹화 시 카메라 재시작
    startCamera();
  };

  const completeRecording = () => {
    const videoUrl = recordedBlob && recordedUrl ? recordedUrl : "";
    const { aiMood, aiConfidence } = computeOverallMood(timelineRef.current);
    const aiMoodLabel =
      aiMood && aiMood !== "surprised"
        ? ({
            best: "최고예요!",
            good: "좋아요!",
            okay: "보통이에요",
            bad: "별로예요",
            worst: "최악이에요",
          }[aiMood] ?? "-")
        : aiMood === "surprised"
          ? "놀람"
          : "-";

    setVideoRecord({
      videoUrl,
      aiMood,
      aiMoodLabel,
      aiConfidence,
      rawExpressions: {},
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

  // ─── 카메라/마이크 사용 안내 화면 (첫 방문 시 1회만) ───
  if (recordState === "perm") {
    return (
      <div className="app-shell">
        <div className="app-frame relative bg-black overflow-hidden flex flex-col">
          {/* 상단 X 버튼 */}
          <button
            type="button"
            onClick={() => navigate({ to: "/record" })}
            aria-label="뒤로"
            style={{ top: "52px", left: "16px", touchAction: "manipulation" }}
            className="absolute z-20 grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/20 text-white"
          >
            <X className="h-5 w-5" />
          </button>

          {/* 배경 그라디언트 */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b2a] to-[#1a2840]" />

          {/* 콘텐츠 */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-7 text-center">
            {/* 아이콘 */}
            <div className="mb-8 flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                <Mic className="h-8 w-8 text-white" />
              </div>
            </div>

            <h2 className="text-white font-bold text-[22px] tracking-tight leading-tight mb-3">
              카메라와 마이크를
              <br />
              사용해요
            </h2>
            <p className="text-white/60 text-[14px] leading-relaxed tracking-tight mb-8">
              영상 일기를 기록하고
              <br />
              음성으로 오늘의 이야기를 남겨요.
              <br />
              <span className="text-white/40 text-[12px]">허용 후엔 다시 묻지 않아요 ✓</span>
            </p>

            {/* 허용 항목 */}
            <div className="w-full flex flex-col gap-3 mb-10">
              {[
                { icon: <Camera className="h-4 w-4" />, label: "카메라", desc: "영상 기록에 사용" },
                { icon: <Mic className="h-4 w-4" />, label: "마이크", desc: "음성 인식에 사용" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl bg-white/8 border border-white/10 px-4 py-3 text-left"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-white font-semibold text-[14px] tracking-tight">
                      {item.label}
                    </p>
                    <p className="text-white/50 text-[12px] tracking-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 시작 버튼 */}
            <button
              type="button"
              onClick={handlePermAccept}
              style={{ background: "var(--primary)", touchAction: "manipulation" }}
              className="w-full rounded-2xl py-4 font-bold text-white text-[16px] tracking-tight shadow-lg"
            >
              허용하고 시작하기
            </button>
            <p className="mt-3 text-white/30 text-[11px] tracking-tight">
              권한은 브라우저 설정에서 언제든 변경할 수 있어요
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── AI 분석 중 화면 ───
  if (recordState === "analyzing") {
    return (
      <div className="app-shell">
        <div className="app-frame relative bg-black overflow-hidden flex flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-white/10 border-t-white/70 animate-spin" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-white font-bold text-[18px] tracking-tight">
                AI가 영상을 분석하고 있어요
              </p>
              <p className="text-white/50 text-[13px] tracking-tight">잠시만 기다려주세요...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            style={{ top: "calc(52px)", left: "16px", touchAction: "manipulation" }}
            className="absolute z-20 grid h-10 w-10 place-items-center rounded-full bg-black/60 border border-white/20 text-white"
          >
            <X className="h-5 w-5" />
          </button>

          {/* 녹화 시간 칩 */}
          <div
            className="absolute z-20 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5"
            style={{ top: "calc(52px + 4px)", left: "50%", transform: "translateX(-50%)" }}
          >
            <span className="text-white text-[13px] font-semibold tabular-nums">
              {formatSec(recordSec)} 녹화됨
            </span>
          </div>

          {/* 하단 액션 오버레이 */}
          <div
            className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-12"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
            }}
          >
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
                style={{ touchAction: "manipulation" }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 border border-white/20 py-3.5 font-semibold text-white text-[15px] tracking-tight backdrop-blur-sm"
              >
                다시 녹화
              </button>
              <button
                type="button"
                onClick={completeRecording}
                style={{ background: "var(--primary)", touchAction: "manipulation" }}
                className="flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white text-[15px] tracking-tight shadow-lg"
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
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* 카메라 오류 */}
        {cameraError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 px-8 text-center">
            <Camera className="h-10 w-10 text-white/50 mb-3" />
            <p className="text-white text-[14px] leading-relaxed mb-5">{cameraError}</p>
            <button
              type="button"
              onClick={startCamera}
              style={{ touchAction: "manipulation" }}
              className="rounded-full bg-white/20 px-5 py-2.5 text-white text-[13px] font-medium"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* ── 상단 오버레이 ── */}
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-start px-4"
          style={{ paddingTop: "52px" }}
        >
          {/* X / 뒤로가기 */}
          <button
            type="button"
            onClick={() => navigate({ to: "/record" })}
            aria-label="뒤로"
            style={{ touchAction: "manipulation" }}
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

        {/* idle: 카메라 준비 완료 표시 */}
        {recordState === "idle" && streamReady && (
          <div
            className="absolute z-20 flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-2 backdrop-blur-sm"
            style={{ top: "calc(52px + 56px)", left: "16px" }}
          >
            <span className="h-2 w-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-[11px] font-medium text-green-300">카메라 준비 완료</span>
          </div>
        )}

        {/* 녹화 중 음성 인식 안내 배지 */}
        {recordState === "recording" && speechActive && (
          <div
            className="absolute z-20 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 backdrop-blur-sm"
            style={{ top: "calc(52px + 56px)", right: "16px" }}
          >
            <Mic className="h-3 w-3 text-red-400 animate-pulse" />
            <span className="text-red-300 text-[11px] font-medium">음성 인식 중</span>
          </div>
        )}

        {/* 음성 인식 텍스트 오버레이 */}
        {recordState === "recording" && (speechActive || displayTranscript) && (
          <div className="absolute z-20 bottom-[180px] left-3 right-3">
            <div className="rounded-2xl bg-black/65 px-4 py-3 backdrop-blur-sm">
              <p className="text-white text-[13px] leading-relaxed">
                {transcript && <span>{transcript}</span>}
                {interimText && <span className="text-white/50"> {interimText}</span>}
                {!displayTranscript && speechActive && (
                  <span className="text-white/40 text-[12px]">말씀해 주세요...</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── 하단 컨트롤 ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center pb-12"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)" }}
        >
          {recordState === "idle" && (
            <>
              <p className="text-white/60 text-[12px] mb-5 tracking-tight">
                {streamReady ? "버튼을 눌러 녹화를 시작하세요" : "카메라 준비 중..."}
              </p>
              {/* 셔터 버튼 — touchAction: manipulation 으로 300ms 지연 제거 */}
              <button
                type="button"
                onClick={startRecording}
                disabled={!streamReady}
                style={{ touchAction: "manipulation" }}
                className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-white transition-transform active:scale-95 disabled:opacity-40"
              >
                <div className="h-[60px] w-[60px] rounded-full bg-white" />
              </button>
            </>
          )}

          {recordState === "recording" && (
            <>
              <p className="text-white/60 text-[12px] mb-5 tracking-tight">
                말하는 동안 AI가 녹화 후 분석해드려요
              </p>
              {/* 정지 버튼 */}
              <button
                type="button"
                onClick={stopRecording}
                style={{ touchAction: "manipulation" }}
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
