// ── 교환일기 데이터 레이어 ──────────────────────────────────────────────────
// Supabase 기반 — 어떤 브라우저/기기에서도 동일 데이터 접근 가능
// localStorage는 익명 사용자 ID / 비밀번호 인증 캐시에만 사용

import { supabase } from "./supabase";
import { getAuthUserId, getAuthDisplayName } from "./auth";

export interface ExchangeDiary {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  password: string;
  inviteCode: string;
  imageDataUrl?: string;
  keywords: string[];
  viewerIds: string[];
  createdAt: string;
}

export interface ExchangeComment {
  id: string;
  diaryId: string;
  authorId: string;
  authorName: string;
  body: string;
  parentId?: string;
  createdAt: string;
}

// Supabase row → 앱 인터페이스 변환
function rowToDiary(row: Record<string, unknown>): ExchangeDiary {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    authorName: row.author_name as string,
    title: row.title as string,
    body: row.body as string,
    password: row.password as string,
    inviteCode: row.invite_code as string,
    imageDataUrl: (row.image_data_url as string | null) ?? undefined,
    keywords: (row.keywords as string[]) ?? [],
    viewerIds: (row.viewer_ids as string[]) ?? [],
    createdAt: row.created_at as string,
  };
}

function rowToComment(row: Record<string, unknown>): ExchangeComment {
  return {
    id: row.id as string,
    diaryId: row.diary_id as string,
    authorId: row.author_id as string,
    authorName: row.author_name as string,
    body: row.body as string,
    parentId: (row.parent_id as string | null) ?? undefined,
    createdAt: row.created_at as string,
  };
}

// ── localStorage 키 (기기 로컬 상태 전용) ────────────────────────────────────
const KEY_MY_ID = "andamiro_my_id";
const KEY_MY_NAME = "andamiro_my_name";
const KEY_AUTH = "andamiro_authorized_diaries";

const NICKNAME_PREFIXES = ["구름", "햇살", "달빛", "바람", "별빛", "새벽", "노을", "마음"];
const NICKNAME_SUFFIXES = ["친구", "기록자", "산책자", "작가", "수집가", "동행", "여행자", "지기"];

// ── 내부 헬퍼 ───────────────────────────────────────────────────────────────
function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function createNickname(id: string): string {
  const hash = hashText(id);
  const prefix = NICKNAME_PREFIXES[hash % NICKNAME_PREFIXES.length];
  const suffix =
    NICKNAME_SUFFIXES[Math.floor(hash / NICKNAME_PREFIXES.length) % NICKNAME_SUFFIXES.length];
  const code = id
    .replace(/[^a-z0-9]/gi, "")
    .slice(-4)
    .toUpperCase();
  return `${prefix}${suffix}${code}`;
}

// ── 사용자 ID / 이름 ──────────────────────────────────────────────────────────
// 로그인된 경우 Supabase auth user ID/이름 우선, 없으면 localStorage 익명 ID
export function getMyId(): string {
  const authId = getAuthUserId();
  if (authId) return authId;

  if (!isBrowser()) return "server";
  let id = localStorage.getItem(KEY_MY_ID);
  if (!id) {
    id = uid();
    localStorage.setItem(KEY_MY_ID, id);
  }
  return id;
}

export function getMyName(): string {
  const authName = getAuthDisplayName();
  if (authName) return authName;

  if (!isBrowser()) return "";
  const savedName = localStorage.getItem(KEY_MY_NAME)?.trim();
  if (savedName) return savedName;

  const nickname = createNickname(getMyId());
  localStorage.setItem(KEY_MY_NAME, nickname);
  return nickname;
}

export function setMyName(name: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_MY_NAME, name);
}

// ── 일기 조회 ─────────────────────────────────────────────────────────────────
export async function getMyDiaries(): Promise<ExchangeDiary[]> {
  const myId = getMyId();
  const { data, error } = await supabase
    .from("exchange_diaries")
    .select("*")
    .eq("author_id", myId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(rowToDiary);
}

export async function getSharedDiaries(): Promise<ExchangeDiary[]> {
  const myId = getMyId();
  const { data, error } = await supabase
    .from("exchange_diaries")
    .select("*")
    .contains("viewer_ids", [myId])
    .neq("author_id", myId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(rowToDiary);
}

export async function getDiaryById(id: string): Promise<ExchangeDiary | undefined> {
  const { data, error } = await supabase
    .from("exchange_diaries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return undefined;
  return rowToDiary(data as Record<string, unknown>);
}

// ── 핵심 수정: invite_code는 Supabase에서 조회 → 다른 브라우저에서도 동작 ──
export async function getDiaryByInviteCode(code: string): Promise<ExchangeDiary | undefined> {
  const { data, error } = await supabase
    .from("exchange_diaries")
    .select("*")
    .eq("invite_code", code)
    .maybeSingle();
  if (error || !data) return undefined;
  return rowToDiary(data as Record<string, unknown>);
}

// ── 일기 생성 / 삭제 ──────────────────────────────────────────────────────────
export interface CreateDiaryParams {
  title: string;
  body: string;
  password: string;
  keywords?: string[];
  imageDataUrl?: string;
}

export async function createDiary(params: CreateDiaryParams): Promise<ExchangeDiary> {
  const myId = getMyId();
  const myName = getMyName();
  const diary: ExchangeDiary = {
    id: uid(),
    authorId: myId,
    authorName: myName,
    title: params.title,
    body: params.body,
    password: params.password,
    inviteCode: uid().slice(0, 10),
    imageDataUrl: params.imageDataUrl,
    keywords: params.keywords ?? [],
    viewerIds: [],
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("exchange_diaries").insert({
    id: diary.id,
    author_id: diary.authorId,
    author_name: diary.authorName,
    title: diary.title,
    body: diary.body,
    password: diary.password,
    invite_code: diary.inviteCode,
    image_data_url: diary.imageDataUrl ?? null,
    keywords: diary.keywords,
    viewer_ids: diary.viewerIds,
    created_at: diary.createdAt,
  });

  if (error) throw new Error(`일기 생성 실패: ${error.message}`);
  return diary;
}

export async function deleteDiary(id: string): Promise<void> {
  const myId = getMyId();
  await supabase.from("exchange_diaries").delete().eq("id", id).eq("author_id", myId);
}

// ── 뷰어 / 인증 ──────────────────────────────────────────────────────────────
export function isDiaryAuthorized(id: string): boolean {
  if (!isBrowser()) return false;
  try {
    const list: string[] = JSON.parse(localStorage.getItem(KEY_AUTH) ?? "[]");
    return list.includes(id);
  } catch {
    return false;
  }
}

export function authorizeDiary(id: string): void {
  if (!isBrowser()) return;
  try {
    const list: string[] = JSON.parse(localStorage.getItem(KEY_AUTH) ?? "[]");
    if (!list.includes(id)) {
      localStorage.setItem(KEY_AUTH, JSON.stringify([...list, id]));
    }
  } catch {
    // 무시
  }
}

export async function addViewer(id: string): Promise<void> {
  const myId = getMyId();
  // viewer_ids 배열에 myId가 없을 때만 append (DB 레벨 중복 방지)
  const { data } = await supabase
    .from("exchange_diaries")
    .select("viewer_ids")
    .eq("id", id)
    .maybeSingle();

  if (!data) return;
  const current: string[] = (data as { viewer_ids: string[] }).viewer_ids ?? [];
  if (current.includes(myId)) return;

  await supabase
    .from("exchange_diaries")
    .update({ viewer_ids: [...current, myId] })
    .eq("id", id);
}

// ── 댓글 CRUD ─────────────────────────────────────────────────────────────────
export async function getCommentCountMap(diaryIds: string[]): Promise<Record<string, number>> {
  if (diaryIds.length === 0) return {};
  const { data } = await supabase
    .from("exchange_comments")
    .select("diary_id")
    .in("diary_id", diaryIds);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { diary_id: string }[]) {
    counts[row.diary_id] = (counts[row.diary_id] ?? 0) + 1;
  }
  return counts;
}

export async function getComments(diaryId: string): Promise<ExchangeComment[]> {
  const { data, error } = await supabase
    .from("exchange_comments")
    .select("*")
    .eq("diary_id", diaryId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []).map(rowToComment);
}

export async function createComment(
  diaryId: string,
  body: string,
  parentId?: string,
): Promise<ExchangeComment> {
  const comment: ExchangeComment = {
    id: uid(),
    diaryId,
    authorId: getMyId(),
    authorName: getMyName(),
    body,
    parentId,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("exchange_comments").insert({
    id: comment.id,
    diary_id: comment.diaryId,
    author_id: comment.authorId,
    author_name: comment.authorName,
    body: comment.body,
    parent_id: comment.parentId ?? null,
    created_at: comment.createdAt,
  });

  if (error) throw new Error(`댓글 생성 실패: ${error.message}`);
  return comment;
}

export async function deleteComment(id: string): Promise<void> {
  await supabase.from("exchange_comments").delete().eq("id", id);
}

// ── 시간 포맷 ─────────────────────────────────────────────────────────────────
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "방금 전";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ── 커버 컬러 (ID 기반 결정론적 색상) ───────────────────────────────────────
const COVER_COLORS = [
  "#7c6ef5",
  "#f5866e",
  "#6ec7f5",
  "#f5c96e",
  "#6ef5b4",
  "#f56ebd",
  "#6e9df5",
  "#b4f56e",
];

export function coverColorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
}
