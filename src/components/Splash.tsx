import { useEffect, useState } from "react";
import splashGif from "@/assets/splash.gif";
import splashWebp from "@/assets/splash.webp";
import { getCachedUser, signInWithGoogle } from "@/lib/auth";

// GIF 1루프 ≈ 2000ms
const GIF_DURATION_MS = 2000;
const FADE_MS = 300;
const SESSION_KEY = "splash_shown";

export function Splash() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  // gif → freeze → login(버튼 표시) 또는 fading(로그인 상태면 바로 페이드아웃)
  const [phase, setPhase] = useState<"gif" | "freeze" | "login" | "fading">("gif");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // iframe·presentation·nosplash 스킵
    if (window !== window.top) { setVisible(false); return; }
    if (new URLSearchParams(window.location.search).get("nosplash") === "1") { setVisible(false); return; }
    if (window.location.pathname.includes("presentation")) { setVisible(false); return; }
    // 세션당 1회만
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) { setVisible(false); return; }
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch { /* ignore */ }

    setMounted(true);

    // GIF 1루프 후 freeze
    const t1 = window.setTimeout(() => setPhase("freeze"), GIF_DURATION_MS);

    // freeze 직후 로그인 상태 분기
    const t2 = window.setTimeout(() => {
      if (getCachedUser()) {
        // 로그인됨 → 그냥 페이드아웃
        setPhase("fading");
        window.setTimeout(() => setVisible(false), FADE_MS);
      } else {
        // 미로그인 → 로그인 버튼 슬라이드업
        setPhase("login");
      }
    }, GIF_DURATION_MS + 80);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await signInWithGoogle();
      // OAuth redirect → 페이지 리로드 → SESSION_KEY 있어서 Splash 스킵
    } catch {
      setLoginLoading(false);
    }
  };

  if (!mounted || !visible) return null;

  const fading = phase === "fading";

  return (
    <div
      aria-hidden={phase !== "login"}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white md:bg-black/40 transition-opacity"
      style={{ opacity: fading ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
    >
      {/* 앱 프레임 */}
      <div className="relative bg-white overflow-hidden w-full h-[100dvh] md:w-[375px] md:h-[812px] md:rounded-[28px] md:shadow-2xl">

        {/* 건너뛰기 — 로그인 상태가 아닐 때만(=로그인 버튼 전 단계) */}
        {phase === "gif" && (
          <button
            type="button"
            onClick={() => {
              setPhase("fading");
              window.setTimeout(() => setVisible(false), FADE_MS);
            }}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/5 px-3 py-1.5 text-[12px] font-medium text-foreground/70"
          >
            건너뛰기
          </button>
        )}

        {/* 캐릭터 + 로고 */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: 276, width: 280, height: 280 }}
        >
          <img
            src={splashGif}
            alt="안다미로"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-150 ${
              phase === "gif" ? "opacity-100" : "opacity-0"
            }`}
          />
          <img
            src={splashWebp}
            alt=""
            aria-hidden
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-150 ${
              phase !== "gif" ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* 로그인 버튼 — 슬라이드업 */}
        <div
          className="absolute left-[24px] right-[24px] flex flex-col gap-[16px] transition-transform duration-500 ease-out"
          style={{
            bottom: "calc(2rem + env(safe-area-inset-bottom))",
            transform: phase === "login" ? "translateY(0)" : "translateY(160%)",
            pointerEvents: phase === "login" ? "auto" : "none",
          }}
        >
          <button
            type="button"
            onClick={handleLogin}
            disabled={loginLoading}
            className="w-full h-[52px] flex items-center justify-center gap-[12px] rounded-[12px] bg-white border border-[#e2e2e2] active:scale-[0.99] transition disabled:opacity-60"
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
            <span className="text-[16px] font-semibold text-[#454545] tracking-[-0.48px]">
              {loginLoading ? "로그인 중..." : "Google 로 로그인"}
            </span>
          </button>

          <p className="text-[14px] text-[#999] text-center underline underline-offset-2 tracking-tight">
            개인정보처리방침
          </p>
        </div>

      </div>
    </div>
  );
}
