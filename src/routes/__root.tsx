import { Outlet, Link, createRootRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import appCss from "../styles.css?url";
import { Splash, SPLASH_COMPLETE_KEY } from "@/components/Splash";
import { getCachedUser, initAuth, isOnboardingComplete, signInWithGoogle } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  getCommentsAfter,
  getMyDiaries,
  getMyId,
  getSharedDiaries,
  type ExchangeComment,
  type ExchangeDiary,
} from "@/lib/exchangeStore";
import {
  areExchangeNotificationsOn,
  canShowNotifications,
  showAppNotification,
} from "@/lib/notifications";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            search={{} as any}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "안다미로 — AI 감정일기" },
      { name: "description", content: "AI와 함께 감정을 기록하는 일기 앱." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const [authReady, setAuthReady] = useState(false);

  // 이번 세션에서 이미 스플래시를 봤는지 (초기값 — 이후엔 변경하지 않음)
  const [alreadyShown] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(SPLASH_COMPLETE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // GIF 재생이 이번 렌더에서 완료됐는지
  const [gifDone, setGifDone] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    initAuth().then(() => {
      setAuthReady(true);
      if (getCachedUser()) navigateAfterSignIn(router);
    });

    // OAuth 리디렉션 후 세션이 생기면 이전 페이지로 복귀
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        navigateAfterSignIn(router, true); // 신규 로그인 → 온보딩 체크
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSplashComplete = useCallback(() => {
    try { window.sessionStorage.setItem(SPLASH_COMPLETE_KEY, "1"); } catch { /* ignore */ }
    setGifDone(true);
  }, []);

  const handleSplashLogin = useCallback(async () => {
    setLoginLoading(true);
    try {
      window.sessionStorage.setItem(AUTH_REDIRECT_KEY, getAuthRedirectTarget());
      await signInWithGoogle();
    } catch {
      setLoginLoading(false);
    }
  }, []);

  if (isSplashGateBypassed()) {
    if (!authReady) return null;
    return (
      <>
        <ExchangeNotificationWatcher />
        <Outlet />
      </>
    );
  }

  // 이미 이번 세션에서 스플래시를 봤으면 절대 다시 렌더하지 않음
  if (alreadyShown) {
    if (!authReady) return null;
    return (
      <>
        <ExchangeNotificationWatcher />
        <Outlet />
      </>
    );
  }

  // 최초 방문 — GIF 재생 → (비로그인이면 로그인 버튼) → 앱 진입
  const user = authReady ? getCachedUser() : null;
  const showLogin = gifDone && authReady && !user;
  const splashFinished = gifDone && authReady && !!user;

  if (splashFinished) {
    return (
      <>
        <ExchangeNotificationWatcher />
        <Outlet />
      </>
    );
  }

  return (
    <Splash
      play={!gifDone}
      showLogin={showLogin}
      loginLoading={loginLoading}
      onComplete={handleSplashComplete}
      onLogin={handleSplashLogin}
    />
  );
}

const AUTH_REDIRECT_KEY = "andamiro_auth_redirect";

function getCurrentAppPathWithSearch(): string {
  if (typeof window === "undefined") return "/";

  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  let pathname = window.location.pathname;
  if (base && base !== "/" && pathname.startsWith(base)) {
    pathname = pathname.slice(base.length) || "/";
  }

  return `${pathname}${window.location.search}`;
}

function getAuthRedirectTarget(): string {
  if (typeof window === "undefined") return "/";
  if (!window.location.pathname.endsWith("/login")) return getCurrentAppPathWithSearch();

  const params = new URLSearchParams(window.location.search);
  return params.get("redirect") ?? "/my";
}

function consumeAuthRedirect(): string | null {
  try {
    const stored = window.sessionStorage.getItem(AUTH_REDIRECT_KEY);
    if (stored) {
      window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
      return stored;
    }
  } catch {
    // sessionStorage 사용 불가 시 URL 파라미터만 사용
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("redirect");
}

function navigateAfterSignIn(router: ReturnType<typeof useRouter>, isFreshSignIn = false) {
  if (typeof window === "undefined") return;

  const redirectTo = consumeAuthRedirect();
  const comingFromLogin = !!redirectTo || window.location.pathname.endsWith("/login");

  // 온보딩 체크: 신규 로그인이거나 로그인 페이지에서 왔을 때만
  if ((isFreshSignIn || comingFromLogin) && !isOnboardingComplete()) {
    router.navigate({ to: "/onboarding" });
    return;
  }

  if (!redirectTo && !window.location.pathname.endsWith("/login")) return;

  const target = redirectTo || "/my";
  const url = new URL(target, window.location.origin);
  const search = Object.fromEntries(url.searchParams.entries());
  router.navigate({ to: url.pathname as "/", search: search as any });
}

function isSplashGateBypassed() {
  if (typeof window === "undefined") return false;
  if (window !== window.top) return true;
  if (new URLSearchParams(window.location.search).get("nosplash") === "1") return true;
  return window.location.pathname.includes("presentation");
}

const EXCHANGE_LAST_COMMENT_KEY = "andamiro_exchange_last_comment_at";
const EXCHANGE_POLL_MS = 30000;

function ExchangeNotificationWatcher() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let checking = false;

    const runCheck = async () => {
      if (cancelled || checking || !canShowNotifications() || !areExchangeNotificationsOn()) return;
      checking = true;

      try {
        const lastSeen = localStorage.getItem(EXCHANGE_LAST_COMMENT_KEY);
        if (!lastSeen) {
          localStorage.setItem(EXCHANGE_LAST_COMMENT_KEY, new Date().toISOString());
          return;
        }

        const [myDiaries, sharedDiaries] = await Promise.all([getMyDiaries(), getSharedDiaries()]);
        const diaries = [...myDiaries, ...sharedDiaries];
        const diaryIds = diaries.map((diary) => diary.id);
        const comments = await getCommentsAfter(diaryIds, lastSeen);
        if (comments.length === 0) return;

        const myId = getMyId();
        const newest = comments[comments.length - 1];
        localStorage.setItem(EXCHANGE_LAST_COMMENT_KEY, newest.createdAt);

        const notifyTarget = comments.find((comment) => comment.authorId !== myId);
        if (notifyTarget) notifyComment(notifyTarget, diaries);
      } finally {
        checking = false;
      }
    };

    runCheck();
    const timer = window.setInterval(runCheck, EXCHANGE_POLL_MS);
    window.addEventListener("focus", runCheck);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", runCheck);
    };
  }, []);

  return null;
}

function notifyComment(comment: ExchangeComment, diaries: ExchangeDiary[]) {
  const diary = diaries.find((item) => item.id === comment.diaryId);
  const bodyPrefix = comment.parentId ? "답글" : "댓글";
  const title = diary ? `"${diary.title}"에 새 ${bodyPrefix}` : `교환일기에 새 ${bodyPrefix}`;
  const notification = showAppNotification(title, {
    body: `${comment.authorName}: ${comment.body}`,
    tag: `exchange-comment-${comment.diaryId}`,
  });

  if (!notification || !diary) return;
  notification.onclick = () => {
    window.focus();
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    window.location.href = `${base}/exchange/${diary.id}`;
  };
}
