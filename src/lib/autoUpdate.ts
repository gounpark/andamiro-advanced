// 자동 업데이트 — 새 배포 감지 시 새로고침
// 1) Vite 동적 청크 로드 실패(=배포로 청크 hash 변경됨) → 즉시 reload
// 2) version.json 폴링 → 변경되면 reload

const RELOAD_FLAG = "andamiro_auto_reload_at";
const POLL_INTERVAL_MS = 60_000;

function safeReload(reason: string) {
  if (typeof window === "undefined") return;
  // 무한 reload 방지: 마지막 reload로부터 30초 이내면 skip
  const last = Number(sessionStorage.getItem(RELOAD_FLAG) ?? "0");
  if (Date.now() - last < 30_000) return;
  sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
  console.info(`[auto-update] reloading: ${reason}`);
  // 캐시 무시 reload
  window.location.reload();
}

/** 1) 동적 import 실패 시 reload (가장 흔한 케이스: 옛 HTML이 옛 청크 가리킴) */
function installChunkErrorHandler() {
  if (typeof window === "undefined") return;

  // Vite는 preload 실패 시 vite:preloadError 이벤트 발사
  window.addEventListener("vite:preloadError", () => {
    safeReload("chunk preload error");
  });

  // 일반 unhandled error 중 'Failed to fetch dynamically imported module' 패턴도 잡기
  window.addEventListener("error", (e) => {
    const msg = String(e.message ?? "");
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("error loading dynamically imported module")
    ) {
      safeReload("dynamic import failed");
    }
  });

  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e.reason as Error)?.message ?? e.reason ?? "");
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("error loading dynamically imported module")
    ) {
      safeReload("dynamic import rejected");
    }
  });
}

/** 2) /version.json 폴링 — 빌드 시 GitHub Actions가 ${GITHUB_SHA} 기록 */
function installVersionPoller() {
  if (typeof window === "undefined") return;

  const base = import.meta.env.BASE_URL ?? "/";
  const versionUrl = `${base.replace(/\/$/, "")}/version.json`;

  let currentVersion: string | null = null;

  async function check() {
    try {
      const res = await fetch(versionUrl, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { sha?: string };
      if (!data.sha) return;
      if (currentVersion == null) {
        currentVersion = data.sha;
        return;
      }
      if (data.sha !== currentVersion) {
        safeReload(`new version detected (${currentVersion.slice(0, 7)} → ${data.sha.slice(0, 7)})`);
      }
    } catch {
      /* 네트워크 오류는 무시 */
    }
  }

  // 페이지 표시 직후 한번, 이후 주기적으로
  check();
  setInterval(check, POLL_INTERVAL_MS);
  // 백그라운드에서 돌아왔을 때도 즉시 체크 (PWA에서 중요)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
}

export function installAutoUpdate() {
  installChunkErrorHandler();
  installVersionPoller();
}
