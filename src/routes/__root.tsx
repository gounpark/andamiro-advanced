import { Outlet, Link, createRootRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import appCss from "../styles.css?url";
import { Splash } from "@/components/Splash";
import { initAuth, getCachedUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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
  const router = useRouter();

  useEffect(() => {
    initAuth().then(() => setAuthReady(true));

    // OAuth 리디렉션 후 세션이 생기면 이전 페이지로 복귀
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        // login 페이지에서 redirect 파라미터로 복귀 경로 관리
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirect") ?? "/my";
        // 현재 경로가 /login이면 복귀
        if (window.location.pathname.endsWith("/login")) {
          router.navigate({ to: redirectTo as "/" });
        }
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authReady) {
    // auth 초기화 전엔 Splash만 표시
    return <Splash />;
  }

  return (
    <>
      <Splash />
      <Outlet />
    </>
  );
}
