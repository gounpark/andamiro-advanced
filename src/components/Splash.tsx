import { useEffect, useState } from "react";
import splashGif from "@/assets/splash.gif";

const ANIMATION_MS = 4050; // 89 frames — GIF plays once and freezes on last frame
export const SPLASH_COMPLETE_KEY = "andamiro_splash_complete_v4";

type SplashProps = {
  play?: boolean;
  showLogin?: boolean;
  loginLoading?: boolean;
  onComplete?: () => void;
  onLogin?: () => void;
};

export function Splash({
  play = true,
  showLogin = false,
  loginLoading = false,
  onComplete,
  onLogin,
}: SplashProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window !== window.top) { onComplete?.(); return; }
    if (new URLSearchParams(window.location.search).get("nosplash") === "1") { onComplete?.(); return; }
    if (window.location.pathname.includes("presentation")) { onComplete?.(); return; }

    setMounted(true);
    if (!play) { onComplete?.(); return; }

    const timer = window.setTimeout(() => {
      onComplete?.();
    }, ANIMATION_MS);

    return () => window.clearTimeout(timer);
  }, [onComplete, play]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      style={{ pointerEvents: showLogin ? "auto" : "none" }}
    >
      <div className="relative bg-white overflow-hidden w-full h-[100dvh] md:w-[375px] md:h-[812px] md:rounded-[28px] md:shadow-2xl flex items-center justify-center">
        {/* GIF이 1루프 후 마지막 프레임에 자체적으로 멈춤 */}
        <img
          src={splashGif}
          alt=""
          className="max-h-full max-w-full object-contain"
        />

        {/* 로그인 버튼 슬라이드업 */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] transition-all duration-500 ease-out ${
            showLogin ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ pointerEvents: showLogin ? "auto" : "none" }}
        >
          <button
            type="button"
            onClick={onLogin}
            disabled={loginLoading}
            className="flex h-[52px] w-full items-center justify-center gap-[12px] rounded-[12px] border border-[#e2e2e2] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition active:scale-[0.99] disabled:opacity-60"
          >
            {loginLoading ? (
              <div className="h-5 w-5 rounded-full border-2 border-[#ddd] border-t-[var(--primary)] animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span className="text-[16px] font-semibold text-[#454545]">
              {loginLoading ? "로그인 중..." : "Google 로 로그인"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
