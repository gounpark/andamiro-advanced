// ── 교환일기 데이터 스토어 ────────────────────────────────────────────────
// 모든 localStorage 접근은 SSR 가드 처리됨

export interface ExchangeRoom {
  id: string;
  name: string;
  password: string;
  description?: string;
  coverColor: string;
  inviteCode: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
}

export interface ExchangePost {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  keywords: string[];
  imageDataUrl?: string;
  createdAt: string;
}

export interface ExchangeComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  body: string;
  parentId?: string;
  createdAt: string;
}

// ── 스토리지 키 ──────────────────────────────────────────────────────────
const KEY_MY_ID = "andamiro_my_id";
const KEY_MY_NAME = "andamiro_my_name";
const KEY_ROOMS = "andamiro_exchange_rooms";
const KEY_POSTS = "andamiro_exchange_posts";
const KEY_COMMENTS = "andamiro_exchange_comments";
const KEY_AUTH_PREFIX = "andamiro_exchange_auth_";

// ── 유틸 ─────────────────────────────────────────────────────────────────
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

const COVER_COLORS = [
  "#4F7EF7", "#F76F4F", "#4FBF7E", "#A34FF7",
  "#F7C24F", "#4FC8F7", "#F74FA0", "#7EF74F",
];

// ── 유저 ID / 이름 ───────────────────────────────────────────────────────
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
  if (!isBrowser()) return "나";
  return localStorage.getItem(KEY_MY_NAME) ?? "나";
}

export function setMyName(name: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_MY_NAME, name);
}

// ── 방 ───────────────────────────────────────────────────────────────────
export function getRooms(): ExchangeRoom[] {
  if (!isBrowser()) return [];
  const all = load<ExchangeRoom[]>(KEY_ROOMS, []);
  const myId = getMyId();
  return all.filter((r) => r.memberIds.includes(myId));
}

export function getAllRooms(): ExchangeRoom[] {
  return load<ExchangeRoom[]>(KEY_ROOMS, []);
}

export function getRoomById(id: string): ExchangeRoom | undefined {
  return load<ExchangeRoom[]>(KEY_ROOMS, []).find((r) => r.id === id);
}

export function getRoomByInviteCode(code: string): ExchangeRoom | undefined {
  return load<ExchangeRoom[]>(KEY_ROOMS, []).find((r) => r.inviteCode === code);
}

export function createRoom(
  name: string,
  password: string,
  description?: string
): ExchangeRoom {
  const all = load<ExchangeRoom[]>(KEY_ROOMS, []);
  const myId = getMyId();
  const room: ExchangeRoom = {
    id: uid(),
    name,
    password,
    description,
    coverColor: COVER_COLORS[all.length % COVER_COLORS.length],
    inviteCode: uid().slice(0, 8),
    ownerId: myId,
    memberIds: [myId],
    createdAt: new Date().toISOString(),
  };
  save(KEY_ROOMS, [...all, room]);
  // 방장은 자동으로 인증 완료
  authorizeRoom(room.id);
  return room;
}

export function joinRoom(roomId: string): void {
  const all = load<ExchangeRoom[]>(KEY_ROOMS, []);
  const myId = getMyId();
  const updated = all.map((r) =>
    r.id === roomId && !r.memberIds.includes(myId)
      ? { ...r, memberIds: [...r.memberIds, myId] }
      : r
  );
  save(KEY_ROOMS, updated);
}

export function deleteRoom(roomId: string): void {
  const all = load<ExchangeRoom[]>(KEY_ROOMS, []);
  save(KEY_ROOMS, all.filter((r) => r.id !== roomId));
  // 연관 데이터 정리
  const posts = load<ExchangePost[]>(KEY_POSTS, []);
  const postIds = posts.filter((p) => p.roomId === roomId).map((p) => p.id);
  save(KEY_POSTS, posts.filter((p) => p.roomId !== roomId));
  const comments = load<ExchangeComment[]>(KEY_COMMENTS, []);
  save(KEY_COMMENTS, comments.filter((c) => !postIds.includes(c.postId)));
}

// ── 비번 인증 ─────────────────────────────────────────────────────────────
export function isRoomAuthorized(roomId: string): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(KEY_AUTH_PREFIX + roomId) === "1";
}

export function authorizeRoom(roomId: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_AUTH_PREFIX + roomId, "1");
}

// ── 게시글 ────────────────────────────────────────────────────────────────
export function getPosts(roomId: string): ExchangePost[] {
  return load<ExchangePost[]>(KEY_POSTS, [])
    .filter((p) => p.roomId === roomId)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export function createPost(
  roomId: string,
  title: string,
  body: string,
  keywords: string[],
  imageDataUrl?: string
): ExchangePost {
  const all = load<ExchangePost[]>(KEY_POSTS, []);
  const post: ExchangePost = {
    id: uid(),
    roomId,
    authorId: getMyId(),
    authorName: getMyName(),
    title,
    body,
    keywords,
    imageDataUrl,
    createdAt: new Date().toISOString(),
  };
  save(KEY_POSTS, [post, ...all]);
  return post;
}

export function deletePost(postId: string): void {
  const posts = load<ExchangePost[]>(KEY_POSTS, []);
  save(KEY_POSTS, posts.filter((p) => p.id !== postId));
  const comments = load<ExchangeComment[]>(KEY_COMMENTS, []);
  save(KEY_COMMENTS, comments.filter((c) => c.postId !== postId));
}

// ── 댓글 ──────────────────────────────────────────────────────────────────
export function getComments(postId: string): ExchangeComment[] {
  return load<ExchangeComment[]>(KEY_COMMENTS, [])
    .filter((c) => c.postId === postId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export function createComment(
  postId: string,
  body: string,
  parentId?: string
): ExchangeComment {
  const all = load<ExchangeComment[]>(KEY_COMMENTS, []);
  const comment: ExchangeComment = {
    id: uid(),
    postId,
    authorId: getMyId(),
    authorName: getMyName(),
    body,
    parentId,
    createdAt: new Date().toISOString(),
  };
  save(KEY_COMMENTS, [...all, comment]);
  return comment;
}

export function deleteComment(commentId: string): void {
  const all = load<ExchangeComment[]>(KEY_COMMENTS, []);
  save(KEY_COMMENTS, all.filter((c) => c.id !== commentId && c.parentId !== commentId));
}

// ── 시간 포맷 ─────────────────────────────────────────────────────────────
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
