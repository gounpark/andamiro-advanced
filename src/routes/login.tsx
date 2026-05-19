import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { signInWithGoogle, getCachedUser } from "@/lib/auth";
import splashGif from "@/assets/splash.gif";
import splashWebp from "@/assets/splash.webp";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "안다미로" }, { name: "theme-color", content: "#ffffff" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/my",
  }),
  component: LoginPage,
});

// GIF 1루프 ≈ 2000ms
const GIF_DURATION_MS = 2000;

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // gif → freeze(webp) → login(버튼 슬라이드업)
  const [phase, setPhase] = useState<"gif" | "freeze" | "login">("gif");

  if (getCachedUser()) {
    navigate({ to: redirect as "/my" });
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // GIF 1루프 끝나면 webp로 교체 (freeze)
    const freezeTimer = setTimeout(() => setPhase("freeze"), GIF_DURATION_MS);
    // 그 직후(transition 완료 기다렸다가) 버튼 슬라이드업
    const loginTimer = setTimeout(() => setPhase("login"), GIF_DURATION_MS + 80);
    return () => {
      clearTimeout(freezeTimer);
      clearTimeout(loginTimer);
    };
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-frame relative bg-white overflow-hidden">

        {/* ── 캐릭터 + 로고 영역 ── */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: 276, width: 280, height: 280 }}
        >
          {/* GIF: 루프 재생 */}
          <img
            src={splashGif}
            alt="안다미로"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-150 ${
              phase === "gif" ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* WebP: 마지막 프레임 freeze용 정적 이미지 */}
          <img
            src={splashWebp}
            alt=""
            aria-hidden
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-150 ${
              phase !== "gif" ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* ── 로그인 버튼 (슬라이드업) ── */}
        <div
          className="absolute left-[24px] right-[24px] flex flex-col gap-[16px] transition-transform duration-500 ease-out"
          style={{
            bottom: "calc(2rem + env(safe-area-inset-bottom))",
            transform: phase === "login" ? "translateY(0)" : "translateY(160%)",
          }}
        >
          {/* Google 로그인 버튼 */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-[52px] flex items-center justify-center gap-[12px] rounded-[12px] bg-white border border-[#e2e2e2] active:scale-[0.99] transition disabled:opacity-60"
          >
            {loading ? (
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
              {loading ? "로그인 중..." : "Google 로 로그인"}
            </span>
          </button>

          {/* 개인정보처리방침 */}
          <p className="text-[14px] text-[#999] text-center underline underline-offset-2 tracking-tight">
            개인정보처리방침
          </p>
        </div>

      </div>
    </div>
  );
}
