import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import splashGif from "@/assets/splash.gif";
import { gotoPath } from "@/lib/navigate";

// 세션스토리지 우회 전용 인트로 라우트
// 스플래시를 한 번 보여주고 바로 홈으로 이동
export const Route = createFileRoute("/intro")({
  component: IntroPage,
});

const SPLASH_MS = 2000; // 2초 후 홈으로

function IntroPage() {
  useEffect(() => {
    const t = setTimeout(() => {
      gotoPath("/?demo=1&nosplash=1");
    }, SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="app-shell">
      <div className="app-frame flex items-center justify-center bg-white overflow-hidden">
        <img
          src={splashGif}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  );
}
