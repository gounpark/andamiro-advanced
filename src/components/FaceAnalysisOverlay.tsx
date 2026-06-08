/**
 * FaceAnalysisOverlay
 * 채팅 화면 안에서 전체 오버레이로 올라오는 실시간 표정 분석 카메라 뷰.
 * "분석 완료 →" 탭 시 감지된 expressions + dominant + confidence를 부모로 전달.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ensureModelsLoaded } from "@/hooks/useFaceApi";
import type { FaceExpression, ExpressionMap } from "@/hooks/useFaceApi";

export type { ExpressionMap, FaceExpression };

interface FaceAnalysisOverlayProps {
  onClose: () => void;
  onComplete: (
    expressions: ExpressionMap,
    dominant: FaceExpression | null,
    confidence: number,
  ) => void;
}

const EXPR_ROWS: { key: FaceExpression; label: string; color: string }[] = [
  { key: "happy",     label: "행복",   color: "#22c55e" },
  { key: "neutral",   label: "무표정", color: "#9ca3af" },
  { key: "sad",       label: "슬픔",   color: "#4B82F5" },
  { key: "surprised", label: "놀람",   color: "#f59e0b" },
  { key: "fearful",   label: "불안",   color: "#a78bfa" },
  { key: "angry",     label: "화남",   color: "#ef4444" },
];

export function FaceAnalysisOverlay({ onClose, onComplete }: FaceAnalysisOverlayProps) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const mountedRef   = useRef(true);
  const detectingRef = useRef(false);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // Latest detection results (refs so we can read in handleComplete without stale closure)
  const latestExpressionsRef = useRef<ExpressionMap | null>(null);
  const latestDominantRef    = useRef<FaceExpression | null>(null);
  const latestConfRef        = useRef<number>(0);

  const [streamReady,  setStreamReady]  = useState(false);
  const [modelsReady,  setModelsReady]  = useState(false);
  const [cameraError,  setCameraError]  = useState<string | null>(null);
  const [recSec,       setRecSec]       = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [expressions,  setExpressions]  = useState<ExpressionMap | null>(null);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current)    clearInterval(timerRef.current);
  }, []);

  // ── Init: load models → open camera ───────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        await ensureModelsLoaded();
        if (!mountedRef.current) return;
        setModelsReady(true);
      } catch {
        if (mountedRef.current)
          setCameraError("AI 모델 로드에 실패했어요.\n잠시 후 다시 시도해주세요.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current && mountedRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreamReady(true);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        const denied = err instanceof Error && err.name === "NotAllowedError";
        setCameraError(
          denied
            ? "카메라 접근이 거부됐어요.\n브라우저 설정에서 카메라를 허용해주세요."
            : "카메라를 시작할 수 없어요.",
        );
      }
    };

    init();
    timerRef.current = setInterval(() => {
      if (mountedRef.current) setRecSec((s) => s + 1);
    }, 1000);

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // ── Detection loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!streamReady || !modelsReady) return;

    const detect = async () => {
      const video     = videoRef.current;
      const canvas    = canvasRef.current;
      const container = containerRef.current;
      if (!video || !canvas || !container || video.readyState < 2 || detectingRef.current || !mountedRef.current) return;

      detectingRef.current = true;
      try {
        const faceapi = await import("face-api.js");
        const result = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
          .withFaceExpressions();

        if (!mountedRef.current) return;

        const W = container.clientWidth;
        const H = container.clientHeight;
        if (canvas.width !== W)  canvas.width  = W;
        if (canvas.height !== H) canvas.height = H;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, W, H);

        if (result) {
          setFaceDetected(true);

          // ── Object-cover coordinate transform ──────────────────────────────
          // Both video and canvas have scaleX(-1), so the transforms cancel:
          // drawing at (face-api x coords) appears correctly over the mirrored video.
          const vW  = video.videoWidth  || 640;
          const vH  = video.videoHeight || 480;
          const vAR = vW / vH;
          const cAR = W / H;

          let scale: number, offsetX: number, offsetY: number;
          if (vAR > cAR) {
            // video wider than container → height fits, sides crop
            scale   = H / vH;
            offsetX = -(vW * scale - W) / 2;
            offsetY = 0;
          } else {
            // video taller than container → width fits, top/bottom crop
            scale   = W / vW;
            offsetX = 0;
            offsetY = -(vH * scale - H) / 2;
          }

          const { x, y, width, height } = result.detection.box;
          const dx = x * scale + offsetX;
          const dy = y * scale + offsetY;
          const dw = width  * scale;
          const dh = height * scale;

          // Translucent rect
          ctx.strokeStyle = "rgba(75, 130, 245, 0.30)";
          ctx.lineWidth   = 1.5;
          ctx.strokeRect(dx, dy, dw, dh);

          // Corner accents
          const cl = Math.min(22, dw * 0.22);
          ctx.strokeStyle = "#4B82F5";
          ctx.lineWidth   = 2.5;
          ctx.lineCap     = "round";

          const corners: [number, number, number, number, number, number][] = [
            [dx,         dy + cl,  dx,       dy,      dx + cl,       dy      ], // TL
            [dx + dw - cl, dy,     dx + dw,  dy,      dx + dw,       dy + cl ], // TR
            [dx,           dy + dh - cl, dx, dy + dh, dx + cl,       dy + dh ], // BL
            [dx + dw - cl, dy + dh, dx + dw, dy + dh, dx + dw, dy + dh - cl ], // BR
          ];
          corners.forEach(([x1, y1, x2, y2, x3, y3]) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.stroke();
          });

          // ── Expressions ───────────────────────────────────────────────────
          const exprs = result.expressions as unknown as Record<string, number>;
          const filtered: ExpressionMap = {};
          for (const { key } of EXPR_ROWS) {
            filtered[key] = exprs[key] ?? 0;
          }
          filtered["disgusted"] = exprs["disgusted"] ?? 0;

          let domKey: FaceExpression = "neutral";
          let domConf = 0;
          for (const [k, v] of Object.entries(filtered) as [FaceExpression, number][]) {
            if ((v ?? 0) > domConf) { domConf = v ?? 0; domKey = k; }
          }

          latestExpressionsRef.current = filtered;
          latestDominantRef.current    = domKey;
          latestConfRef.current        = domConf;
          setExpressions({ ...filtered });
        } else {
          setFaceDetected(false);
          latestExpressionsRef.current = null;
        }
      } catch {
        /* ignore frame errors */
      } finally {
        detectingRef.current = false;
      }
    };

    intervalRef.current = setInterval(detect, 800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [streamReady, modelsReady]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleComplete = () => {
    cleanup();
    onComplete(
      latestExpressionsRef.current ?? {},
      latestDominantRef.current,
      latestConfRef.current,
    );
  };

  const handleClose = () => { cleanup(); onClose(); };

  const formatSec = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const isLoading = !cameraError && (!modelsReady || !streamReady);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ background: "#0a0a0a" }}>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)", paddingBottom: "10px" }}
      >
        <div className="flex items-center gap-2 h-6">
          {streamReady && (
            <>
              <span className="h-[7px] w-[7px] rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-[13px] font-semibold tabular-nums">
                REC {formatSec(recSec)}
              </span>
            </>
          )}
        </div>
        <span className="text-white/70 text-[13px] font-medium">
          {faceDetected ? "얼굴 1명 감지" : streamReady ? "얼굴 인식 중..." : ""}
        </span>
      </div>

      {/* ── Camera + Canvas ── */}
      <div
        ref={containerRef}
        className="relative flex-1 mx-4 rounded-[20px] overflow-hidden"
        style={{ background: "#1c1c1e" }}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
            <div
              className="h-10 w-10 rounded-full border-[3px] animate-spin"
              style={{ borderColor: "rgba(255,255,255,0.12)", borderTopColor: "rgba(255,255,255,0.65)" }}
            />
            <p className="text-white/50 text-[13px] tracking-tight">
              {!modelsReady ? "AI 모델 로드 중..." : "카메라 준비 중..."}
            </p>
          </div>
        )}

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center gap-4">
            <p className="text-white/70 text-[14px] leading-relaxed whitespace-pre-line">{cameraError}</p>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full bg-white/10 px-5 py-2 text-white text-[13px]"
            >
              닫기
            </button>
          </div>
        )}

        {/* Video — mirrored so it feels like a selfie */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Canvas — same scaleX(-1) so drawing coords align with video display */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Expression bars overlay (bottom of video) */}
        {expressions && (
          <div
            className="absolute bottom-0 left-0 right-0 px-4 pt-4 pb-4 rounded-b-[20px]"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 70%, transparent 100%)",
            }}
          >
            <p className="text-white/45 text-[10px] font-semibold tracking-widest mb-2.5">
              실시간 표정 분석
            </p>
            <div className="flex flex-col gap-[7px]">
              {EXPR_ROWS.map(({ key, label, color }) => {
                const val = Math.round((expressions[key] ?? 0) * 100);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-white/75 text-[11px] w-10 shrink-0 tracking-tight">
                      {label}
                    </span>
                    <div
                      className="flex-1 h-[3px] rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.10)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${val}%`, background: color }}
                      />
                    </div>
                    <span className="text-white/65 text-[11px] w-7 text-right tabular-nums font-medium">
                      {val}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Status line ── */}
      <div className="flex items-center justify-center gap-2 py-3 shrink-0">
        <span
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            faceDetected ? "bg-green-400" : "bg-yellow-400 animate-pulse"
          }`}
        />
        <span className="text-white/50 text-[13px] tracking-tight">
          {faceDetected
            ? "얼굴 감지됨 · 표정 분석 중"
            : "얼굴을 카메라에 가까이 해주세요"}
        </span>
      </div>

      {/* ── Buttons ── */}
      <div className="flex gap-3 px-4 pb-6 shrink-0">
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 h-[52px] rounded-2xl font-semibold text-[15px] tracking-tight"
          style={{
            background: "rgba(239,68,68,0.13)",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleComplete}
          disabled={!expressions}
          className="flex-1 h-[52px] rounded-2xl text-white font-bold text-[15px] tracking-tight transition disabled:opacity-35"
          style={{ background: "var(--primary)" }}
        >
          분석 완료 →
        </button>
      </div>
    </div>
  );
}
