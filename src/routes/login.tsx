import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signInWithGoogle, getCachedUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "로그인 — 안다미로" }, { name: "theme-color", content: "#ffffff" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/my",
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 이미 로그인된 경우 바로 이동
  if (getCachedUser()) {
    navigate({ to: redirect as "/my" });
    return null;
  }

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // OAuth 리디렉션 후 onAuthStateChange가 세션을 업데이트하면
      // __root.tsx의 리스너가 navigate를 처리
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div
        className="app-frame flex flex-col items-center justify-center px-6"
        style={{ background: "#f5f6f8" }}
      >
        {/* 로고 영역 */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="grid h-20 w-20 place-items-center rounded-3xl mb-5 shadow-md"
            style={{ background: "var(--primary)" }}
          >
            <span className="text-white text-[40px]">🍀</span>
          </div>
          <h1 className="text-[24px] font-bold text-foreground tracking-tight">안다미로</h1>
          <p className="text-[14px] text-[#999] mt-1 tracking-tight">AI 감정일기</p>
        </div>

        {/* 안내 문구 */}
        <div className="w-full rounded-2xl bg-white px-5 py-4 mb-6 text-center shadow-sm">
          <p className="text-[14px] text-foreground font-semibold tracking-tight mb-1">
            교환일기를 사용하려면 로그인이 필요해요
          </p>
          <p className="text-[12px] text-[#aaa] tracking-tight leading-relaxed">
            로그인하면 누가 일기를 읽었는지,
            <br />
            누가 댓글을 달았는지 확인할 수 있어요.
          </p>
        </div>

        {/* 구글 로그인 버튼 */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white border border-[#e0e0e0] py-4 shadow-sm active:scale-[0.99] transition disabled:opacity-60"
        >
          {loading ? (
            <div className="h-5 w-5 rounded-full border-2 border-[#ddd] border-t-[var(--primary)] animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span className="text-[15px] font-semibold text-foreground tracking-tight">
            {loading ? "로그인 중..." : "Google로 계속하기"}
          </span>
        </button>

        <p className="mt-6 text-[11px] text-[#bbb] tracking-tight text-center leading-relaxed">
          로그인하면 서비스 이용약관 및<br />개인정보 처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
