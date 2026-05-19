import { useEffect, useState } from "react";
import splashGif from "@/assets/splash.gif";

const FADE_MS = 350;
const ANIMATION_MS = 4850; // 1회 루프 길이 (97 frames × 50ms)
const SESSION_KEY = "splash_shown";

export function Splash() {
  // 세션당 한 번만 — SSR에서는 일단 true로 시작했다가 마운트 후 결정
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  const dismiss = () => {
    setFading(true);
    window.setTimeout(() => setVisible(false), FADE_MS);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    // iframe 내부면 스킵 (프레젠테이션 데모 중 스플래시가 데모를 가리는 문제 방지)
    if (window !== window.top) {
      setVisible(false);
      return;
    }
    // nosplash=1 파라미터 또는 /presentation 경로면 스킵
    if (new URLSearchParams(window.location.search).get("nosplash") === "1") {
      setVisible(false);
      return;
    }
    if (window.location.pathname.includes("presentation")) {
      setVisible(false);
      return;
    }
    // 세션당 1회만 표시 (탭 전환 시 재표시 방지)
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) {
        setVisible(false);
        return;
      }
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage 사용 불가 시 그대로 진행
    }
    setMounted(true);
    const t1 = window.setTimeout(() => setFading(true), ANIMATION_MS);
    const t2 = window.setTimeout(() => setVisible(false), ANIMATION_MS + FADE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // SSR / 마운트 전에는 렌더하지 않음 → hydration mismatch 방지
  if (!mounted || !visible) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 md:bg-black/40 transition-opacity"
      style={{ opacity: fading ? 0 : 1, transitionDuration: `${FADE_MS}ms`, pointerEvents: "none" }}
    >
      {/* 모바일 앱 프레임과 동일한 사이즈로 스플래시 표시 */}
      <div className="relative bg-white overflow-hidden w-full h-[100dvh] md:w-[375px] md:h-[812px] md:rounded-[28px] md:shadow-2xl flex items-center justify-center">
        <button
          type="button"
          onClick={dismiss}
          style={{ pointerEvents: "auto" }}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-foreground/70"
        >
          건너뛰기
        </button>
        <img src={splashGif} alt="" className="max-h-full max-w-full object-contain" />
      </div>
    </div>
  );
}
