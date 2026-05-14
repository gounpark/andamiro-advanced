import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, MoreHorizontal, Trash2, MessageCircle,
  Send, CornerDownRight, X, Lock,
} from "lucide-react";
import {
  getRoomById, getPosts, getComments, createComment, deleteComment,
  deletePost, deleteRoom, isRoomAuthorized, authorizeRoom, getMyId, relativeTime,
  type ExchangeRoom, type ExchangePost, type ExchangeComment,
} from "@/lib/exchangeStore";
import { InviteLinkButton } from "./exchange";

export const Route = createFileRoute("/exchange/$roomId")({
  head: () => ({
    meta: [
      { title: "교환일기 — 안다미로" },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  component: ExchangeRoomPage,
});

function ExchangeRoomPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const myId = typeof window !== "undefined" ? getMyId() : "";

  const [room, setRoom] = useState<ExchangeRoom | undefined>(undefined);
  const [posts, setPosts] = useState<ExchangePost[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  // 비번 인증 (직접 URL 진입 시)
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    const r = getRoomById(roomId);
    if (!r) { navigate({ to: "/exchange" }); return; }
    setRoom(r);
    setAuthorized(isRoomAuthorized(roomId));
    setPosts(getPosts(roomId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const refreshPosts = () => setPosts(getPosts(roomId));

  if (!room) return null;

  // 비번 인증 화면
  if (!authorized) {
    return (
      <div className="app-shell">
        <div className="app-frame flex flex-col items-center justify-center px-6" style={{ background: "#f5f6f8" }}>
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--primary)]/10 mb-4">
            <Lock className="h-7 w-7 text-[var(--primary)]" />
          </div>
          <p className="font-bold text-foreground text-[18px] tracking-tight mb-1 text-center">
            비밀번호를 입력해 주세요
          </p>
          <p className="text-[13px] text-[#aaa] mb-6 text-center tracking-tight">
            <span className="font-semibold text-foreground">"{room.name}"</span>에 참여하려면<br />비밀번호가 필요해요.
          </p>
          <div className="w-full flex items-center gap-2 rounded-xl bg-white border border-[#e8e8e8] px-4 py-3 mb-2">
            <Lock className="h-4 w-4 text-[#aaa] shrink-0" />
            <input
              type="password"
              placeholder="비밀번호"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(""); }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                if (pwInput !== room.password) { setPwError("비밀번호가 맞지 않아요."); return; }
                authorizeRoom(roomId);
                setAuthorized(true);
              }}
              className="flex-1 bg-transparent text-base text-foreground placeholder:text-[#bbb] outline-none"
              autoFocus
            />
          </div>
          {pwError && <p className="text-[12px] text-red-400 mb-2 self-start tracking-tight">{pwError}</p>}
          <button
            type="button"
            className="w-full mt-2 rounded-2xl py-3.5 font-bold text-white text-[15px] tracking-tight active:scale-[0.99] transition"
            style={{ background: "var(--primary)" }}
            onClick={() => {
              if (pwInput !== room.password) { setPwError("비밀번호가 맞지 않아요."); return; }
              authorizeRoom(roomId);
              setAuthorized(true);
            }}
          >
            입장하기
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/exchange" })}
            className="mt-2 w-full py-2.5 text-[14px] text-[#999] tracking-tight"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col" style={{ background: "#f5f6f8" }}>
        <div className="absolute inset-0 overflow-y-auto scrollbar-hide pb-8">
          {/* 헤더 */}
          <header className="sticky top-0 z-10 bg-white flex items-center gap-2 px-4 pt-[52px] pb-3 border-b border-[#f0f0f0]">
            <Link to="/exchange" className="p-1 -ml-1">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div className="flex-1 text-center">
              <p className="font-bold text-foreground text-[16px] tracking-tight">{room.name}</p>
              <p className="text-[11px] text-[#bbb] tracking-tight">{room.memberIds.length}명 참여 중</p>
            </div>
            <button type="button" onClick={() => setShowMenu(true)} className="p-1">
              <MoreHorizontal className="h-5 w-5 text-foreground" />
            </button>
          </header>

          {/* 게시글 목록 */}
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-24 pb-8 text-center px-6">
              <p className="text-[40px] mb-3">✉️</p>
              <p className="font-bold text-foreground text-[17px] tracking-tight mb-2">
                아직 게시글이 없어요
              </p>
              <p className="text-[13px] text-[#aaa] tracking-tight leading-relaxed">
                분석 결과에서 "공유일기로 공유하기"를 눌러<br />첫 번째 글을 올려보세요!
              </p>
            </div>
          ) : (
            <ul className="px-4 pt-4 flex flex-col gap-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  myId={myId}
                  onComment={() => setActivePostId(post.id)}
                  onDelete={() => {
                    deletePost(post.id);
                    refreshPosts();
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        {/* 방 메뉴 바텀시트 */}
        {showMenu && (
          <div
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setShowMenu(false)}
          >
            <div
              className="w-full rounded-t-[24px] bg-white px-5 pt-5 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-foreground text-[16px] tracking-tight mb-4">{room.name}</h3>

              <div className="rounded-2xl bg-[#f8f9fb] px-4 py-3 mb-4">
                <p className="text-[12px] text-[#999] tracking-tight mb-1">초대 링크</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] text-[#555] font-mono truncate flex-1">
                    /exchange?invite={room.inviteCode}
                  </p>
                  <InviteLinkButton room={room} />
                </div>
                <p className="text-[11px] text-[#bbb] mt-1 tracking-tight">비밀번호: {room.password}</p>
              </div>

              {room.ownerId === myId && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm("일기장을 삭제하면 모든 글과 댓글이 사라져요. 삭제할까요?")) return;
                    deleteRoom(room.id);
                    navigate({ to: "/exchange" });
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3 text-red-400 font-semibold text-[14px] tracking-tight active:scale-[0.99] transition"
                >
                  <Trash2 className="h-4 w-4" />
                  일기장 삭제
                </button>
              )}
            </div>
          </div>
        )}

        {/* 댓글 바텀시트 */}
        {activePostId && (
          <CommentSheet
            postId={activePostId}
            myId={myId}
            onClose={() => setActivePostId(null)}
          />
        )}
      </div>
    </div>
  );
}

// ── 게시글 카드 ───────────────────────────────────────────────────────────
function PostCard({
  post,
  myId,
  onComment,
  onDelete,
}: {
  post: ExchangePost;
  myId: string;
  onComment: () => void;
  onDelete: () => void;
}) {
  const comments = getComments(post.id);
  const [expanded, setExpanded] = useState(false);
  const TRUNCATE = 100;

  return (
    <li className="rounded-2xl bg-white border border-[#f0f0f0] shadow-sm overflow-hidden">
      {/* 이미지 */}
      {post.imageDataUrl && (
        <img
          src={post.imageDataUrl}
          alt=""
          className="w-full h-[160px] object-cover"
        />
      )}

      <div className="px-4 pt-4 pb-3">
        {/* 작성자 + 시간 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="grid h-7 w-7 place-items-center rounded-full text-white text-[12px] font-bold shrink-0"
              style={{ background: "var(--primary)" }}
            >
              {post.authorName.charAt(0)}
            </div>
            <span className="text-[13px] font-semibold text-foreground tracking-tight">{post.authorName}</span>
            <span className="text-[11px] text-[#bbb]">{relativeTime(post.createdAt)}</span>
          </div>
          {post.authorId === myId && (
            <button type="button" onClick={onDelete} className="p-1">
              <Trash2 className="h-3.5 w-3.5 text-[#ccc]" />
            </button>
          )}
        </div>

        {/* 제목 */}
        <p className="font-bold text-foreground text-[15px] tracking-tight mb-1.5">{post.title}</p>

        {/* 키워드 */}
        {post.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.keywords.map((k) => (
              <span
                key={k}
                className="text-[11px] px-2 py-0.5 rounded-full font-medium tracking-tight"
                style={{ background: "var(--primary)15", color: "var(--primary)" }}
              >
                #{k}
              </span>
            ))}
          </div>
        )}

        {/* 본문 */}
        <p className="text-[13px] text-[#555] leading-relaxed tracking-tight">
          {expanded || post.body.length <= TRUNCATE
            ? post.body
            : post.body.slice(0, TRUNCATE) + "..."}
        </p>
        {post.body.length > TRUNCATE && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[12px] text-[var(--primary)] mt-1 tracking-tight"
          >
            {expanded ? "접기" : "더 보기"}
          </button>
        )}
      </div>

      {/* 댓글 버튼 */}
      <div className="border-t border-[#f5f5f5] mx-4" />
      <button
        type="button"
        onClick={onComment}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[13px] text-[#999] active:bg-[#fafafa] transition"
      >
        <MessageCircle className="h-4 w-4" />
        댓글 {comments.length > 0 ? comments.length : "달기"}
      </button>
    </li>
  );
}

// ── 댓글 바텀시트 ─────────────────────────────────────────────────────────
function CommentSheet({
  postId,
  myId,
  onClose,
}: {
  postId: string;
  myId: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<ExchangeComment[]>(() => getComments(postId));
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<ExchangeComment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setComments(getComments(postId));

  const handleSend = () => {
    if (!input.trim()) return;
    createComment(postId, input.trim(), replyTo?.id);
    setInput("");
    setReplyTo(null);
    refresh();
  };

  const roots = comments.filter((c) => !c.parentId);
  const replies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-[24px] bg-white flex flex-col"
        style={{ maxHeight: "75%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 + 헤더 */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#f0f0f0]">
          <div className="w-8 h-1 rounded-full bg-[#e0e0e0] mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <span className="font-bold text-foreground text-[16px] tracking-tight">댓글</span>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-[#bbb]" /></button>
        </div>

        {/* 댓글 목록 */}
        <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-4 scrollbar-hide">
          {roots.length === 0 && (
            <p className="text-center text-[13px] text-[#bbb] py-6 tracking-tight">
              첫 댓글을 남겨보세요
            </p>
          )}
          {roots.map((c) => (
            <div key={c.id}>
              <CommentItem
                comment={c}
                myId={myId}
                onReply={() => {
                  setReplyTo(c);
                  inputRef.current?.focus();
                }}
                onDelete={() => {
                  deleteComment(c.id);
                  refresh();
                }}
              />
              {replies(c.id).map((r) => (
                <div key={r.id} className="pl-8 mt-2">
                  <CommentItem
                    comment={r}
                    myId={myId}
                    isReply
                    onDelete={() => {
                      deleteComment(r.id);
                      refresh();
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 답글 중 표시 */}
        {replyTo && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#f4f6fa]">
            <CornerDownRight className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
            <span className="text-[12px] text-[#666] flex-1 truncate tracking-tight">
              {replyTo.authorName}에게 답글
            </span>
            <button type="button" onClick={() => setReplyTo(null)}>
              <X className="h-4 w-4 text-[#bbb]" />
            </button>
          </div>
        )}

        {/* 입력창 */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#f0f0f0] pb-[env(safe-area-inset-bottom,12px)]">
          <input
            ref={inputRef}
            type="text"
            placeholder="댓글을 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-full bg-[#f4f6fa] px-4 py-2.5 text-[14px] text-foreground placeholder:text-[#bbb] outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition disabled:opacity-30"
            style={{ background: "var(--primary)" }}
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 댓글 아이템 ───────────────────────────────────────────────────────────
function CommentItem({
  comment,
  myId,
  isReply = false,
  onReply,
  onDelete,
}: {
  comment: ExchangeComment;
  myId: string;
  isReply?: boolean;
  onReply?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2.5">
      <div
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white text-[12px] font-bold mt-0.5"
        style={{ background: isReply ? "#a0a0a0" : "var(--primary)" }}
      >
        {comment.authorName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[13px] font-semibold text-foreground tracking-tight">
            {comment.authorName}
          </span>
          <span className="text-[11px] text-[#bbb]">{relativeTime(comment.createdAt)}</span>
        </div>
        <p className="text-[13px] text-[#444] leading-relaxed tracking-tight">{comment.body}</p>
        <div className="flex items-center gap-3 mt-1">
          {!isReply && onReply && (
            <button
              type="button"
              onClick={onReply}
              className="text-[11px] text-[var(--primary)] tracking-tight"
            >
              답글 달기
            </button>
          )}
          {comment.authorId === myId && (
            <button
              type="button"
              onClick={onDelete}
              className="text-[11px] text-[#ccc] tracking-tight"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
