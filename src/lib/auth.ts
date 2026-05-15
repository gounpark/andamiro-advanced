// ── 인증 레이어 ──────────────────────────────────────────────────────────────
// Supabase OAuth (Google, Kakao) 기반 소셜 로그인
// 세션을 모듈 레벨에 캐싱해 동기적으로 접근 가능하게 유지

import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

let _session: Session | null = null;

// ── 앱 시작 시 1회 호출 ───────────────────────────────────────────────────────
export async function initAuth(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  _session = data.session;

  supabase.auth.onAuthStateChange((_event, session) => {
    _session = session;
    // OAuth 리디렉션 후 URL 해시 정리
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      window.history.replaceState({}, "", window.location.pathname + window.location.search);
    }
  });
}

// ── 세션 / 유저 (동기 접근) ───────────────────────────────────────────────────
export function getCachedSession(): Session | null {
  return _session;
}

export function getCachedUser(): User | null {
  return _session?.user ?? null;
}

// ── 사용자 ID / 닉네임 ────────────────────────────────────────────────────────
export function getAuthUserId(): string | null {
  return _session?.user?.id ?? null;
}

export function getAuthDisplayName(): string | null {
  const user = _session?.user;
  if (!user) return null;
  // 커스텀 닉네임 우선, 없으면 소셜 계정 full_name
  return (
    (user.user_metadata?.display_name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null
  );
}

// ── 닉네임 변경 (Supabase user_metadata에 저장) ───────────────────────────────
export async function setDisplayName(name: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { display_name: name },
  });
  if (error) throw new Error(error.message);
  // 캐시 갱신
  const { data } = await supabase.auth.getSession();
  _session = data.session;
}

// ── 소셜 로그인 ───────────────────────────────────────────────────────────────
function getRedirectTo(): string {
  if (typeof window === "undefined") return "/";
  const { protocol, hostname, port } = window.location;
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  return `${protocol}//${hostname}${port ? ":" + port : ""}${base}`;
}

export async function signInWithGoogle(): Promise<void> {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getRedirectTo() },
  });
}

// ── 로그아웃 ──────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  _session = null;
}

// ── 회원탈퇴 (데이터 삭제 후 계정 삭제) ──────────────────────────────────────
// Supabase admin API가 필요한 실제 삭제는 서버사이드에서 처리해야 함
// 클라이언트에서는 로그아웃만 수행
export async function deleteAccount(): Promise<void> {
  await signOut();
}
