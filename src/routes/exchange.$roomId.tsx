import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, MoreHorizontal, Trash2, Send, CornerDownRight, X, Lock,
} from "lucide-react";
import {
  getDiaryById, getComments, createComment, deleteComment,
  deleteDiary, isDiaryAuthorized, authorizeDiary, addViewer,
  getMyId, relativeTime, coverColorForId,
  type ExchangeDiary, type ExchangeComment,
} from "@/lib/exchangeStore";
import { InviteLinkButton } from "./exchange";

export const Route = createFileRoute("/exchange/$roomId")({
  head: () => ({
    meta: [
      { title: "교환일기 — 안다미로" },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  component: ExchangeDiaryPage,
});

function ExchangeDiaryPage() {
  const { roomId: diaryId } = Route.useParams();
  const navigate = useNavigate();
  const myId = typeof window !== "undefined" ? getMyId() : "";

  const [diary, setDiary] = useState<ExchangeDiary | undefined>(undefined);
  const [comments, setComments] = useState<ExchangeComment[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [replyTo, setReplyTo] = useState<ExchangeComment | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);

  // 비번 인증 (직접 URL 진입 시)
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    const d = getDiaryById(diaryId);
    if (!d) { navigate({ to: "/exchange", search: {} }); return; }
    setDiary(d);
    const auth = isDiaryAuthorized(diaryId);
    setAuthorized(auth);
    if (auth) {
      addViewer(diaryId);
      setComments(getComments(diaryId));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaryId]);

  const refreshComments = () => setComments(getComments(diaryId));

  const handleAuthorize = () => {
    if (!diary) return;
    if (pwInput.trim() !== diary.password) {
      setPwError("비밀번호가 맞지 않아요.");
      return;
    }
    authorizeDiary(diaryId);
    addViewer(diaryId);
    setAuthorized(true);
    setComments(getComments(diaryId));
  };

  const handleSendComment = () => {
    if (!commentInput.trim()) return;
    createComment(diaryId, commentInput.trim(), replyTo?.id);
    setCommentInput("");
    setReplyTo(null);
    refreshComments();
  };

  if (!diary) return null;

  // ── 비번 인증 오버레이 ──────────────────────────────────────────────────
  if (!authorized) {
    return (
      <div className="app-shell">
        <div className="app-frame flex flex-col" style={{ background: "#f5f6f8" }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--primary)]/10 mb-4">
              <Lock className="h-7 w-7 text-[var(--primary)]" />
            </div>
            <p className="font-bold text-foreground text-[18px] tracking-tight mb-1 text-center">
              비밀번호를 입력해 주세요
            </p>
            <p className="text-[13px] text-[#aaa] mb-6 text-center tracking-tight leading-relaxed">
              <span className="font-semibold text-foreground">"{diary.title}"</span>을<br />
              읽으려면 비밀번호가 필요해요.
            </p>
            <div className="w-full flex items-center gap-2 rounded-xl bg-white border border-[#e8e8e8] px-4 py-3 mb-2">
              <Lock className="h-4 w-4 text-[#aaa] shrink-0" />
              <input
                type="password"
                placeholder="비밀번호"
                value={pwInput}
                onChange={(e) => { setPwInput(e.target.value); setPwError(""); }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                  handleAuthorize();
                }}
                className="flex-1 bg-transparent text-base text-foreground placeholder:text-[#bbb] outline-none"
                autoFocus
              />
            </div>
            {pwError && (
              <p className="text-[12px] text-red-400 mb-2 self-start tracking-tight">{pwError}</p>
            )}
            <button
              type="button"
              className="w-full mt-2 rounded-2xl py-3.5 font-bold text-white text-[15px] tracking-tight active:scale-[0.99] transition"
              style={{ background: "var(--primary)" }}
              onClick={handleAuthorize}
            >
              열람하기
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/exchange", search: {} })}
              className="mt-2 w-full py-2.5 text-[14px] text-[#999] tracking-tight"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAuthor = diary.authorId === myId;
  const color = coverColorForId(diary.id);
  const rootComments = comments.filter((c) => !c.parentId);
  const repliesOf = (pid: string) => comments.filter((c) => c.parentId === pid);

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col" style={{ background: "#f5f6f8" }}>
        {/* 스크롤 영역 */}
        <div className="absolute inset-0 overflow-y-auto scrollbar-hide pb-24">
          {/* 헤더 */}
          <header className="sticky top-0 z-10 bg-white flex items-center gap-2 px-4 pt-[52px] pb-3 border-b border-[#f0f0f0]">
            <button
              type="button"
              onClick={() => navigate({ to: "/exchange", search: {} })}
              className="p-1 -ml-1"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <p className="flex-1 font-bold text-foreground text-[16px] tracking-tight truncate">
              {diary.title}
            </p>
            <button type="button" onClick={() => setShowMenu(true)} className="p-1">
              <MoreHorizontal className="h-5 w-5 text-foreground" />
            </button>
          </header>

          {/* 일기 콘텐츠 */}
          <article>
            {/* 이미지 */}
            {diary.imageDataUrl ? (
              <img
                src={diary.imageDataUrl}
                alt=""
                className="w-full"
                style={{ maxHeight: 280, objectFit: "cover" }}
              />
            ) : (
              <div
                className="w-full flex items-center justify-center"
                style={{ height: 120, background: color }}
              >
                <span className="text-white text-[48px] font-bold opacity-30">
                  {diary.title.charAt(0)}
                </span>
              </div>
            )}

            <div className="px-4 pt-4 pb-2">
              {/* 작성자 + 날짜 */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="grid h-8 w-8 place-items-center rounded-full text-white text-[13px] font-bold shrink-0"
                  style={{ background: color }}
                >
                  {diary.authorName.charAt(0)}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground tracking-tight leading-tight">
                    {diary.authorName}
                  </p>
                  <p className="text-[11px] text-[#bbb] tracking-tight">
                    {relativeTime(diary.createdAt)}
                  </p>
                </div>
              </div>

              {/* 제목 */}
              <h1 className="font-bold text-foreground text-[20px] tracking-tight leading-snug mb-3">
                {diary.title}
              </h1>

              {/* 키워드 */}
              {diary.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {diary.keywords.map((k) => (
                    <span
                      key={k}
                      className="text-[12px] px-2.5 py-0.5 rounded-full font-medium tracking-tight"
                      style={{ background: "var(--primary)20", color: "var(--primary)" }}
                    >
                      #{k}
                    </span>
                  ))}
                </div>
              )}

              {/* 본문 */}
              <p className="text-[15px] text-[#333] leading-relaxed tracking-tight whitespace-pre-wrap">
                {diary.body}
              </p>
            </div>

            {/* 뷰어 섹션 */}
            {diary.viewerIds.length > 0 && (
              <div className="mx-4 mt-4 rounded-2xl bg-white border border-[#f0f0f0] px-4 py-3">
                <p className="text-[12px] text-[#bbb] tracking-tight mb-2">
                  {diary.viewerIds.length}명이 읽었어요
                </p>
                <div className="flex -space-x-1.5">
                  {diary.viewerIds.slice(0, 8).map((vid, i) => (
                    <div
                      key={vid}
                      className="grid h-7 w-7 place-items-center rounded-full text-white text-[11px] font-bold border-2 border-white"
                      style={{ background: coverColorForId(vid), zIndex: 10 - i }}
                    >
                      {vid.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {diary.viewerIds.length > 8 && (
                    <div
                      className="grid h-7 w-7 place-items-center rounded-full text-white text-[10px] font-bold border-2 border-white bg-[#bbb]"
                      style={{ zIndex: 2 }}
                    >
                      +{diary.viewerIds.length - 8}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 작성자: 초대 링크 복사 */}
            {isAuthor && (
              <div className="mx-4 mt-3 mb-2 flex justify-end">
                <InviteLinkButton diary={diary} />
              </div>
            )}
          </article>

          {/* 구분선 */}
          <div className="mx-4 mt-2 mb-4 border-t border-[#f0f0f0]" />

          {/* 댓글 목록 */}
          <section className="px-4 flex flex-col gap-4">
            <p className="text-[13px] font-semibold text-[#888] tracking-tight">
              댓글 {comments.length}
            </p>
            {rootComments.length === 0 && (
              <p className="text-[13px] text-[#bbb] tracking-tight py-4 text-center">
                첫 댓글을 남겨보세요
              </p>
            )}
            {rootComments.map((c) => (
              <div key={c.id}>
                <CommentItem
                  comment={c}
                  myId={myId}
                  onReply={() => {
                    setReplyTo(c);
                    commentInputRef.current?.focus();
                  }}
                  onDelete={() => {
                    deleteComment(c.id);
                    refreshComments();
                  }}
                />
                {repliesOf(c.id).map((r) => (
                  <div key={r.id} className="pl-9 mt-3">
                    <CommentItem
                      comment={r}
                      myId={myId}
                      isReply
                      onDelete={() => {
                        deleteComment(r.id);
                        refreshComments();
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </section>
        </div>

        {/* 하단 댓글 입력창 */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#f0f0f0]">
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
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            <input
              ref={commentInputRef}
              type="text"
              placeholder="댓글을 입력하세요..."
              value={commentInput}
              onChange={(e) => { if (!e.nativeEvent.isComposing) setCommentInput(e.target.value); }}
              onCompositionEnd={(e) => { setCommentInput((e.target as HTMLInputElement).value); }}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSendComment()}
              className="flex-1 rounded-full bg-[#f4f6fa] px-4 py-2.5 text-[14px] text-foreground placeholder:text-[#bbb] outline-none"
            />
            <button
              type="button"
              onClick={handleSendComment}
              disabled={!commentInput.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition disabled:opacity-30"
              style={{ background: "var(--primary)" }}
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* ⋯ 메뉴 바텀시트 */}
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
              <h3 className="font-bold text-foreground text-[16px] tracking-tight mb-4 truncate">
                {diary.title}
              </h3>

              <div className="rounded-2xl bg-[#f8f9fb] px-4 py-3 mb-4">
                <p className="text-[12px] text-[#999] tracking-tight mb-2">초대 링크</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] text-[#555] font-mono truncate flex-1">
                    /exchange?invite={diary.inviteCode}
                  </p>
                  <InviteLinkButton diary={diary} />
                </div>
                <p className="text-[11px] text-[#bbb] mt-2 tracking-tight">
                  비밀번호: <span className="font-semibold text-[#888]">{diary.password}</span>
                </p>
              </div>

              {isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm("이 일기를 삭제하면 댓글도 모두 사라져요. 삭제할까요?")) return;
                    deleteDiary(diaryId);
                    navigate({ to: "/exchange", search: {} });
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3 text-red-400 font-semibold text-[14px] tracking-tight active:scale-[0.99] transition"
                >
                  <Trash2 className="h-4 w-4" />
                  일기 삭제
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 댓글 아이템 ───────────────────────────────────────────────────────────────
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
        style={{ background: isReply ? "#b0b0b0" : "var(--primary)" }}
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
