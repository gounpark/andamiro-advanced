import { useCallback, useEffect, useRef, useState } from "react";

export type FaceExpression =
  | "neutral"
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "disgusted"
  | "surprised";

export type ExpressionMap = Partial<Record<FaceExpression, number>>;

export interface UseFaceApiResult {
  modelsLoaded: boolean;
  modelError: string | null;
  expressions: ExpressionMap | null;
  dominantExpression: FaceExpression | null;
  dominantConfidence: number;
}

// 모델은 한 번만 로드 (모듈 레벨 캐시)
let modelsLoadPromise: Promise<void> | null = null;

async function ensureModelsLoaded(): Promise<void> {
  if (modelsLoadPromise) return modelsLoadPromise;
  modelsLoadPromise = (async () => {
    // face-api.js dynamic import (무거운 번들 lazy-load)
    const faceapi = await import("face-api.js");
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(`${base}/models`),
      faceapi.nets.faceExpressionNet.loadFromUri(`${base}/models`),
    ]);
  })();
  return modelsLoadPromise;
}

export function useFaceApi(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean
): UseFaceApiResult {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [expressions, setExpressions] = useState<ExpressionMap | null>(null);
  const [dominantExpression, setDominantExpression] =
    useState<FaceExpression | null>(null);
  const [dominantConfidence, setDominantConfidence] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    ensureModelsLoaded()
      .then(() => {
        if (mountedRef.current) setModelsLoaded(true);
      })
      .catch((err: unknown) => {
        // 모델 로드 실패 시 다음 마운트에서 재시도 가능하도록 캐시 초기화
        modelsLoadPromise = null;
        if (mountedRef.current)
          setModelError(
            err instanceof Error ? err.message : "모델 로드 실패"
          );
      });
  }, []);

  const detect = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !mountedRef.current) return;
    try {
      const faceapi = await import("face-api.js");
      const result = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      if (!result || !mountedRef.current) return;

      const exprs = result.expressions as unknown as Record<string, number>;
      const filtered: ExpressionMap = {};
      for (const k of [
        "neutral",
        "happy",
        "sad",
        "angry",
        "fearful",
        "disgusted",
        "surprised",
      ] as FaceExpression[]) {
        filtered[k] = exprs[k] ?? 0;
      }
      setExpressions(filtered);

      const entries = Object.entries(filtered) as [FaceExpression, number][];
      const [dom, conf] = entries.reduce<[FaceExpression, number]>(
        (max, cur) => (cur[1] > max[1] ? cur : max),
        ["neutral", 0]
      );
      setDominantExpression(dom);
      setDominantConfidence(conf);
    } catch {
      // 프레임 감지 실패는 조용히 무시
    }
  }, [videoRef]);

  useEffect(() => {
    if (!modelsLoaded || !active) return;
    intervalRef.current = setInterval(detect, 400);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [modelsLoaded, active, detect]);

  return {
    modelsLoaded,
    modelError,
    expressions,
    dominantExpression,
    dominantConfidence,
  };
}
