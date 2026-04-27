/**
 * GitHub Pages 전용 SPA 진입점.
 * TanStack Start(SSR) 없이 순수 TanStack Router + React로 동작.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

// GitHub Pages 404.html → index.html 리다이렉트 복구
const redirect = sessionStorage.getItem("ghpages_redirect");
if (redirect) {
  sessionStorage.removeItem("ghpages_redirect");
  try {
    const { path, search, hash } = JSON.parse(redirect);
    // basepath 제거 후 app 내부 경로만 추출
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const appPath = path.replace(base, "") || "/";
    window.history.replaceState(null, "", base + appPath + search + hash);
  } catch {
    // ignore
  }
}

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
