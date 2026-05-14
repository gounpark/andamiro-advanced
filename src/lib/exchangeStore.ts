// ── 교환일기 데이터 레이어 ──────────────────────────────────────────────────
// 개별 일기 게시글 단위 공유 구조
// - 각 ExchangeDiary 가 독립적인 공유 단위
// - 초대 링크 + 비밀번호로 접근 제어

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
  viewerIds: string[];   // 초대받아 열람한 사람 ID 목록
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

// ── localStorage 키 ──────────────────────────────────────────────────────────
const KEY_DIARIES  = "andamiro_exchange_diaries";
const KEY_COMMENTS = "andamiro_exchange_comments";
const KEY_MY_ID    = "andamiro_my_id";
const KEY_MY_NAME  = "andamiro_my_name";
const KEY_AUTH     = "andamiro_authorized_diaries"; // 비번 인증한 일기 ID[]

// ── 내부 헬퍼 ───────────────────────────────────────────────────────────────
function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function load<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 스토리지 용량 초과 등 무시
  }
}

// ── 사용자 ID / 이름 ─────────────────────────────────────────────────────────
export function getMyId(): string {
  if (!isBrowser()) return "server";
  let id = localStorage.getItem(KEY_MY_ID);
  if (!id) {
    id = uid();
    localStorage.setItem(KEY_MY_ID, id);
  }
  return id;
}

export function getMyName(): string {
  if (!isBrowser()) return "";
  return localStorage.getItem(KEY_MY_NAME) ?? "";
}

export function setMyName(name: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_MY_NAME, name);
}

// ── 일기 CRUD ─────────────────────────────────────────────────────────────────
export function getMyDiaries(): ExchangeDiary[] {
  const myId = getMyId();
  return load<ExchangeDiary[]>(KEY_DIARIES, [])
    .filter((d) => d.authorId === myId)
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export function getSharedDiaries(): ExchangeDiary[] {
  const myId = getMyId();
  return load<ExchangeDiary[]>(KEY_DIARIES, [])
    .filter((d) => d.authorId !== myId && d.viewerIds.includes(myId))
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export function getDiaryById(id: string): ExchangeDiary | undefined {
  return load<ExchangeDiary[]>(KEY_DIARIES, []).find((d) => d.id === id);
}

export function getDiaryByInviteCode(code: string): ExchangeDiary | undefined {
  return load<ExchangeDiary[]>(KEY_DIARIES, []).find((d) => d.inviteCode === code);
}

export interface CreateDiaryParams {
  title: string;
  body: string;
  password: string;
  keywords?: string[];
  imageDataUrl?: string;
}

export function createDiary(params: CreateDiaryParams): ExchangeDiary {
  const myId = getMyId();
  const myName = getMyName() || "익명";
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
  const list = load<ExchangeDiary[]>(KEY_DIARIES, []);
  save(KEY_DIARIES, [diary, ...list]);
  return diary;
}

export function deleteDiary(id: string): void {
  const myId = getMyId();
  save(
    KEY_DIARIES,
    load<ExchangeDiary[]>(KEY_DIARIES, []).filter(
      (d) => !(d.id === id && d.authorId === myId)
    )
  );
  // 관련 댓글도 삭제
  save(
    KEY_COMMENTS,
    load<ExchangeComment[]>(KEY_COMMENTS, []).filter((c) => c.diaryId !== id)
  );
}

// ── 뷰어 / 인증 ──────────────────────────────────────────────────────────────
export function isDiaryAuthorized(id: string): boolean {
  if (!isBrowser()) return false;
  const diary = getDiaryById(id);
  if (!diary) return false;
  if (diary.authorId === getMyId()) return true; // 작성자는 항상 허용
  return load<string[]>(KEY_AUTH, []).includes(id);
}

export function authorizeDiary(id: string): void {
  const list = load<string[]>(KEY_AUTH, []);
  if (!list.includes(id)) {
    save(KEY_AUTH, [...list, id]);
  }
}

export function addViewer(id: string): void {
  const myId = getMyId();
  const list = load<ExchangeDiary[]>(KEY_DIARIES, []);
  const updated = list.map((d) =>
    d.id === id && !d.viewerIds.includes(myId)
      ? { ...d, viewerIds: [...d.viewerIds, myId] }
      : d
  );
  save(KEY_DIARIES, updated);
}

// ── 댓글 CRUD ─────────────────────────────────────────────────────────────────
export function getComments(diaryId: string): ExchangeComment[] {
  return load<ExchangeComment[]>(KEY_COMMENTS, [])
    .filter((c) => c.diaryId === diaryId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export function createComment(
  diaryId: string,
  body: string,
  parentId?: string
): ExchangeComment {
  const comment: ExchangeComment = {
    id: uid(),
    diaryId,
    authorId: getMyId(),
    authorName: getMyName() || "익명",
    body,
    parentId,
    createdAt: new Date().toISOString(),
  };
  save(KEY_COMMENTS, [...load<ExchangeComment[]>(KEY_COMMENTS, []), comment]);
  return comment;
}

export function deleteComment(id: string): void {
  // 댓글 + 그 답글도 함께 삭제
  const all = load<ExchangeComment[]>(KEY_COMMENTS, []);
  const toDelete = new Set<string>([id]);
  all.forEach((c) => { if (c.parentId && toDelete.has(c.parentId)) toDelete.add(c.id); });
  save(KEY_COMMENTS, all.filter((c) => !toDelete.has(c.id)));
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
  "#7c6ef5", "#f5866e", "#6ec7f5", "#f5c96e", "#6ef5b4",
  "#f56ebd", "#6e9df5", "#b4f56e",
];

export function coverColorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
}
