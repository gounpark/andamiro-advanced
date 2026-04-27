/**
 * GitHub Pages 배포 시 base URL(/andamiro-demo/) 포함한 경로로 이동
 * window.location.href = "/path" 대신 이 함수를 사용해야
 * GitHub Pages 서브 경로에서도 올바르게 동작함
 */
export function gotoPath(path: string) {
  const base = import.meta.env.BASE_URL ?? "/";
  // path가 "/"로 시작하면 앞 슬래시 제거 후 base에 붙임
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  window.location.href = `${base}${normalized}`;
}

/** 현재 앱의 origin + base path (presentation.tsx iframe용) */
export function getAppOrigin(): string {
  const { protocol, hostname, port } = window.location;
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  return `${protocol}//${hostname}${port ? ":" + port : ""}${base}`;
}
