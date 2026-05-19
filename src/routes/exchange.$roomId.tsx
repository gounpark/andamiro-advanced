import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { MoreHorizontal, Trash2, Send, CornerDownRight, X, Lock, Copy, Check } from "lucide-react";
import {
  getDiaryById,
  getComments,
  createComment,
  deleteComment,
  deleteDiary,
  isDiaryAuthorized,
  authorizeDiary,
  addViewer,
  getMyId,
  relativeTime,
  coverColorForId,
  type ExchangeDiary,
  type ExchangeComment,
} from "@/lib/exchangeStore";
import { getAppOrigin } from "@/lib/navigate";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/exchange/$roomId")({
  head: () => ({
    meta: [{ title: "교환일기 — 안다미로" }, { name: "theme-color", content: "#ffffff" }],
  }),
  component: ExchangeDiaryPage,
});

function ExchangeDiaryPage() {
  const { roomId: diaryId } = Route.useParams();
  const navigate = useNavigate();
  const myId = typeof window !== "undefined" ? getMyId() : "";

  const [diary, setDiary] = useState<ExchangeDiary | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<ExchangeComment[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [replyTo, setReplyTo] = useState<ExchangeComment | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const pwInputRef = useRef<HTMLInputElement>(null);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const d = await getDiaryById(diaryId);
      setLoading(false);
      if (!d) {
        navigate({ to: "/exchange", search: { invite: undefined } });
        return;
      }
      setDiary(d);
      // 작성자 본인이거나 이미 비밀번호 인증한 경우 바로 열람
      const isAuthor = d.authorId === myId;
      const auth = isAuthor || isDiaryAuthorized(diaryId);
      setAuthorized(auth);
      if (auth) {
        await addViewer(diaryId);
        setComments(await getComments(diaryId));
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaryId]);

  const refreshComments = async () => setComments(await getComments(diaryId));

  const handleAuthorize = async () => {
    if (!diary) return;
    const password = pwInputRef.current?.value ?? "";
    if (password.trim() !== diary.password) {
      setPwError("비밀번호가 맞지 않아요.");
      return;
    }
    authorizeDiary(diaryId);
    await addViewer(diaryId);
    setAuthorized(true);
    setComments(await getComments(diaryId));
  };

  const handleSendComment = async () => {
    const input = commentInputRef.current;
    const comment = input?.value ?? "";
    if (!comment.trim()) return;
    await createComment(diaryId, comment.trim(), replyTo?.id);
    if (input) input.value = "";
    setReplyTo(null);
    await refreshComments();
  };

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-frame flex flex-col items-center justify-center" style={{ background: "#f5f6f8" }}>
          <p className="text-[15px] text-[#aaa] tracking-tight">불러오는 중...</p>
        </div>
      </div>
    );
  }

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
                ref={pwInputRef}
                type="password"
                placeholder="비밀번호"
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                  e.preventDefault();
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
              onClick={() => navigate({ to: "/exchange", search: { invite: undefined } })}
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
        <AppHeader
          title="공유일기 상세"
          backTo="/exchange"
          rightAction={
            <button
              type="button"
              onClick={() => setShowMenu(true)}
              className="grid h-11 w-11 place-items-center active:opacity-60 transition"
              aria-label="메뉴 열기"
            >
              <MoreHorizontal className="h-7 w-7 text-[#222]" strokeWidth={2.2} />
            </button>
          }
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24">
          <article>
            {diary.imageDataUrl ? (
              <img
                src={diary.imageDataUrl}
                alt=""
                className="h-[252px] w-full object-cover"
              />
            ) : (
              <div
                className="flex h-[252px] w-full items-center justify-center"
                style={{ background: color }}
              >
                <span className="text-white text-[48px] font-bold opacity-30">
                  {diary.title.charAt(0)}
                </span>
              </div>
            )}

            <div className="px-6 pt-4 pb-5">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="grid h-8 w-8 place-items-center rounded-full text-white text-[13px] font-bold shrink-0"
                  style={{ background: color }}
                >
                  {diary.authorName.charAt(0)}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#222] tracking-tight leading-tight">
                    {diary.authorName}
                  </p>
                  <p className="text-[12px] text-[#bbb] tracking-tight">
                    {relativeTime(diary.createdAt)}
                  </p>
                </div>
              </div>

              <h1 className="mb-3 text-[20px] font-bold leading-[26px] tracking-tight text-[#111]">
                {diary.title}
              </h1>

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

              <p className="whitespace-pre-wrap text-[15px] leading-[25.5px] tracking-tight text-[#333]">
                {diary.body}
              </p>

              {isAuthor && (
                <div className="mt-5 flex justify-end">
                  <InviteCopyPill diary={diary} />
                </div>
              )}

              {diary.viewerIds.length > 0 && (
                <div className="mt-5 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {diary.viewerIds.slice(0, 3).map((vid, i) => {
                      const name = diary.viewerNames[i] ?? vid;
                      const avatar = diary.viewerAvatars[i];
                      return avatar ? (
                        <img
                          key={vid}
                          src={avatar}
                          alt={name}
                          className="h-7 w-7 rounded-full border-2 border-white object-cover"
                          style={{ zIndex: 10 - i }}
                        />
                      ) : (
                        <div
                          key={vid}
                          className="grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[11px] font-bold text-white"
                          style={{ background: coverColorForId(vid), zIndex: 10 - i }}
                        >
                          {name.charAt(0)}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[14px] text-[#999] tracking-tight">
                    {diary.viewerIds.length}명이 읽었어요
                  </span>
                </div>
              )}
            </div>
          </article>

          <div className="mx-6 border-t border-[#ececec]" />

          <section className="flex flex-col gap-4 px-6 pt-4">
            <p className="text-[13px] font-semibold text-[#888] tracking-tight">
              댓글 {comments.length}
            </p>
            {rootComments.length === 0 && (
              <p className="py-5 text-center text-[13px] tracking-tight text-[#bbb]">
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
                  onDelete={async () => {
                    await deleteComment(c.id);
                    await refreshComments();
                  }}
                />
                {repliesOf(c.id).map((r) => (
                  <div key={r.id} className="pl-9 mt-3">
                    <CommentItem
                      comment={r}
                      myId={myId}
                      isReply
                      onDelete={async () => {
                        await deleteComment(r.id);
                        await refreshComments();
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </section>
        </div>

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
            className="flex items-center gap-2 px-4 pt-[11px]"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <input
              ref={commentInputRef}
              type="text"
              placeholder="댓글을 입력하세요..."
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                handleSendComment();
              }}
              className="h-[39px] flex-1 rounded-full bg-[#f4f6fa] px-4 text-[14px] text-foreground placeholder:text-[#bbb] outline-none"
            />
            <button
              type="button"
              onClick={handleSendComment}
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
                  <InviteCopyPill diary={diary} />
                </div>
                <p className="text-[11px] text-[#bbb] mt-2 tracking-tight">
                  비밀번호: <span className="font-semibold text-[#888]">{diary.password}</span>
                </p>
              </div>

              {isAuthor && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("이 일기를 삭제하면 댓글도 모두 사라져요. 삭제할까요?")) return;
                    await deleteDiary(diaryId);
                    navigate({ to: "/exchange", search: { invite: undefined } });
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

function InviteCopyPill({ diary }: { diary: ExchangeDiary }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${getAppOrigin()}/exchange?invite=${diary.inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("아래 링크를 복사해 주세요:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex h-9 items-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-3.5 text-[13px] font-medium tracking-tight text-[var(--primary)] active:scale-[0.97] transition"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "복사됨" : "초대 링크 복사"}
    </button>
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
  const avatarSize = isReply ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[12px]";

  return (
    <div className="flex gap-2.5">
      {comment.authorAvatar ? (
        <img
          src={comment.authorAvatar}
          alt={comment.authorName}
          className={`${isReply ? "h-6 w-6" : "h-7 w-7"} mt-0.5 shrink-0 rounded-full border border-[#f0f0f0] object-cover`}
        />
      ) : (
        <div
          className={`mt-0.5 grid shrink-0 place-items-center rounded-full font-bold text-white ${avatarSize}`}
          style={{ background: isReply ? "#b0b0b0" : "var(--primary)" }}
        >
          {comment.authorName.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`${isReply ? "text-[12px]" : "text-[13px]"} font-semibold text-[#222] tracking-tight`}>
            {comment.authorName}
          </span>
          <span className="text-[11px] text-[#bbb]">{relativeTime(comment.createdAt)}</span>
        </div>
        <p className="text-[13px] text-[#444] leading-[19.5px] tracking-tight break-words overflow-hidden">{comment.body}</p>
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
