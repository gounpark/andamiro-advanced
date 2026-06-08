import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { MoreHorizontal, Trash2, ArrowUp, CornerDownRight, X, Lock, Copy, Check } from "lucide-react";
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
import { PageShell, PageHeader, BackButton, LoadingScreen, BottomSheet, SheetItem } from "@/components";
import exchangeCharacters from "@/assets/exchange-created-characters.webp";

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
  const [shareSheetMode, setShareSheetMode] = useState<"created" | "share" | null>(null);
  const [copied, setCopied] = useState(false);
  const [replyTo, setReplyTo] = useState<ExchangeComment | null>(null);
  const [showReaders, setShowReaders] = useState(false);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);

  const pwInputRef = useRef<HTMLInputElement>(null);
  const [pwError, setPwError] = useState("");

  const buildShareText = (d: ExchangeDiary) => {
    const url = `${getAppOrigin()}/exchange?invite=${d.inviteCode}`;
    return { url, text: `내 일기 보러올래? 🌱\n비밀번호: ${d.password}\n${url}` };
  };

  const handleCopyLink = async (d: ExchangeDiary) => {
    const { text } = buildShareText(d);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* 무시 */ }
  };

  const handleShareDiary = async (d: ExchangeDiary) => {
    setShareSheetMode(null);
    const { text } = buildShareText(d);
    await new Promise((r) => setTimeout(r, 200)); // 시트 닫힘 대기
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* dismissed */ }
    } else {
      const { text: t } = buildShareText(d);
      await navigator.clipboard.writeText(t).catch(() => undefined);
    }
  };

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
      // 방금 생성한 일기인지 확인
      const justCreated = sessionStorage.getItem("exchange_just_created");
      if (justCreated === diaryId) {
        sessionStorage.removeItem("exchange_just_created");
        setShareSheetMode("created");
      }
      // 작성자 본인 / 이미 비밀번호 인증 / 공유받은 뷰어인 경우 바로 열람
      const isAuthor = d.authorId === myId;
      const isViewer = d.viewerIds.includes(myId);
      if (isViewer && !isDiaryAuthorized(diaryId)) {
        authorizeDiary(diaryId); // 뷰어는 한 번 캐시해두면 다음에도 패스
      }
      const auth = isAuthor || isViewer || isDiaryAuthorized(diaryId);
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
    const comment = commentText;
    if (!comment.trim()) return;
    await createComment(diaryId, comment.trim(), replyTo?.id);
    setCommentText("");
    setReplyTo(null);
    await refreshComments();
  };

  if (loading) return <LoadingScreen />;

  if (!diary) return null;

  // ── 비번 인증 오버레이 ──────────────────────────────────────────────────
  if (!authorized) {
    return (
      <PageShell bg="#f5f6f8">
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--primary)]/10 mb-4">
              <Lock className="h-7 w-7 text-[var(--primary)]" />
            </div>
            <p className="font-bold text-foreground text-[18px] mb-1 text-center">
              비밀번호를 입력해 주세요
            </p>
            <p className="text-[14px] text-[#aaa] mb-6 text-center leading-relaxed">
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
              <p className="text-[12px] text-red-400 mb-2 self-start">{pwError}</p>
            )}
            <button
              type="button"
              className="w-full mt-2 rounded-2xl py-3.5 font-bold text-white text-[16px] active:scale-[0.99] transition"
              style={{ background: "var(--primary)" }}
              onClick={handleAuthorize}
            >
              열람하기
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/exchange", search: { invite: undefined } })}
              className="mt-2 w-full py-2.5 text-[14px] text-[#999]"
            >
              돌아가기
            </button>
          </div>
      </PageShell>
    );
  }

  const isAuthor = diary.authorId === myId;
  const color = coverColorForId(diary.id);
  const rootComments = comments.filter((c) => !c.parentId);
  const repliesOf = (pid: string) => comments.filter((c) => c.parentId === pid);

  return (
    <PageShell bg="#f5f6f8">
        <PageHeader
          title="공유일기 상세"
          left={<BackButton onClick={() => navigate({ to: "/exchange", search: { invite: undefined } })} />}
          right={
            <button type="button" onClick={() => setShowMenu(true)} className="grid h-11 w-11 place-items-center active:opacity-60 transition" aria-label="메뉴 열기">
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
                  className="grid h-8 w-8 place-items-center rounded-full text-white text-[14px] font-bold shrink-0"
                  style={{ background: color }}
                >
                  {diary.authorName.charAt(0)}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[#222] leading-tight">
                    {diary.authorName}
                  </p>
                  <p className="text-[14px] text-[#666]">
                    {relativeTime(diary.createdAt)}
                  </p>
                </div>
              </div>

              <h1 className="mb-3 text-[20px] font-bold leading-[26px] text-[#222]">
                {diary.title}
              </h1>

              {diary.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {diary.keywords.map((k) => (
                    <span
                      key={k}
                      className="text-[12px] px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: "var(--primary)20", color: "var(--primary)" }}
                    >
                      #{k}
                    </span>
                  ))}
                </div>
              )}

              <p className="whitespace-pre-wrap text-[16px] leading-[25.5px] text-[#333]">
                {diary.body}
              </p>

              {isAuthor && (
                <div className="mt-5 flex justify-end">
                  <InviteCopyPill diary={diary} />
                </div>
              )}

              {diary.viewerIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReaders(true)}
                  className="mt-5 flex items-center gap-2 active:opacity-70 transition"
                >
                  <div className="flex -space-x-2">
                    {diary.viewerIds.slice(0, 3).map((vid, i) => (
                      <ReaderAvatar
                        key={vid}
                        id={vid}
                        name={diary.viewerNames[i] ?? vid}
                        avatar={diary.viewerAvatars[i]}
                        size={28}
                        zIndex={10 - i}
                      />
                    ))}
                  </div>
                  <span className="text-[14px] text-[#666]">
                    {diary.viewerIds.length}명이 읽었어요
                  </span>
                </button>
              )}
            </div>
          </article>

          <div className="mx-6 border-t border-[#ececec]" />

          <section className="flex flex-col gap-3 px-6 pt-3">
            <p className="text-[14px] font-medium text-[#999]">
              댓글 {comments.length}
            </p>
            {rootComments.length === 0 && (
              <p className="py-5 text-center text-[14px] text-[#bbb]">
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

        <div
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#eee] px-4 pt-5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
        >
          {/* 답글 대상 표시 */}
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <CornerDownRight className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
              <span className="text-[12px] text-[#666] flex-1 truncate">
                {replyTo.authorName}에게 답글
              </span>
              <button type="button" onClick={() => setReplyTo(null)}>
                <X className="h-4 w-4 text-[#bbb]" />
              </button>
            </div>
          )}

          {/* Figma: 단일 pill — input + 전송 버튼 내장 */}
          <div className="flex h-[46px] items-center justify-between rounded-full bg-[#f5f6f8] pl-[14px] pr-[10px]">
            <input
              ref={commentInputRef}
              type="text"
              placeholder="댓글을 입력하세요..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                handleSendComment();
              }}
              className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-[#999] outline-none"
            />
            <button
              type="button"
              onClick={handleSendComment}
              className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full transition"
              style={{ background: commentText.trim() ? "var(--primary)" : "#e0e0e0" }}
            >
              <ArrowUp className="h-[14px] w-[14px] text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ⋯ 메뉴 바텀시트 */}
        <BottomSheet open={showMenu} onClose={() => setShowMenu(false)} title={diary.title}>
          <SheetItem
            icon={<Copy />}
            label="공유하기"
            onClick={() => { setShowMenu(false); setShareSheetMode("share"); }}
          />
          {isAuthor && (
            <SheetItem
              icon={<Trash2 />}
              label="삭제하기"
              danger
              onClick={async () => {
                setShowMenu(false);
                if (!confirm("이 일기를 삭제하면 댓글도 모두 사라져요. 삭제할까요?")) return;
                await deleteDiary(diaryId);
                navigate({ to: "/exchange", search: { invite: undefined } });
              }}
            />
          )}
        </BottomSheet>

        {/* 공유 바텀시트 (생성 완료 / 공유하기 공용) */}
        {shareSheetMode && diary && (
          <div className="absolute inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => shareSheetMode === "share" && setShareSheetMode(null)}>
            <div className="relative w-full rounded-t-[20px] bg-white flex flex-col" style={{ height: 396 }} onClick={(e) => e.stopPropagation()}>
              <div className="px-6 pt-[38px] shrink-0">
                <h3 className="text-center text-[22px] font-bold leading-[26px] text-[#111]">
                  {shareSheetMode === "created" ? "공유 일기가 만들어졌어요!" : "친구에게 공유하기"}
                </h3>
                <p className="mt-[6px] text-center text-[14px] leading-[19.5px] text-[#999]">
                  {shareSheetMode === "created" ? "초대 링크를 보내서 친구에게 공유해 보세요." : "초대 링크로 친구를 일기에 초대해 보세요."}
                </p>
              </div>
              <div className="flex-1 flex items-end justify-center overflow-hidden">
                <img src={exchangeCharacters} alt="" className="w-[260px] object-contain object-bottom" />
              </div>
              <div className="px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shrink-0 flex gap-[10px]">
                <button
                  type="button"
                  onClick={() => handleCopyLink(diary)}
                  className="flex h-[52px] flex-1 items-center justify-center gap-1.5 rounded-[12px] border border-[#4283f3] bg-white text-[16px] font-medium text-[#4283f3] active:scale-[0.99] transition"
                >
                  {copied ? <Check className="h-4 w-4" /> : null}
                  {copied ? "복사됨" : "링크 복사"}
                </button>
                <button
                  type="button"
                  onClick={() => handleShareDiary(diary)}
                  className="flex h-[52px] w-[198px] shrink-0 items-center justify-center rounded-[12px] bg-[#4283f3] text-[16px] font-medium text-white active:scale-[0.99] transition"
                >
                  친구에게 공유
                </button>
              </div>
            </div>
          </div>
        )}

        {showReaders && (
          <ReadersSheet diary={diary} onClose={() => setShowReaders(false)} />
        )}
    </PageShell>
  );
}

function ReaderAvatar({
  id,
  name,
  avatar,
  size,
  zIndex,
}: {
  id: string;
  name: string;
  avatar?: string;
  size: number;
  zIndex?: number;
}) {
  const style: React.CSSProperties = { width: size, height: size };
  if (zIndex != null) style.zIndex = zIndex;
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="rounded-full border-2 border-white object-cover"
        style={style}
      />
    );
  }
  return (
    <div
      className="grid place-items-center rounded-full border-2 border-white font-bold text-white"
      style={{
        ...style,
        background: coverColorForId(id),
        fontSize: Math.max(10, Math.floor(size * 0.42)),
      }}
    >
      {name.charAt(0)}
    </div>
  );
}

function ReadersSheet({
  diary,
  onClose,
}: {
  diary: ExchangeDiary;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="rounded-t-2xl bg-white pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-h-[70%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <h3 className="text-[16px] font-bold text-[#222]">
            이 일기를 읽은 사람 ({diary.viewerIds.length})
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#666] active:bg-[#f4f4f4] transition"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-2">
          {diary.viewerIds.map((vid, i) => {
            const name = diary.viewerNames[i] ?? vid;
            const avatar = diary.viewerAvatars[i];
            return (
              <div key={vid} className="flex items-center gap-3 py-2.5">
                <ReaderAvatar id={vid} name={name} avatar={avatar} size={40} />
                <span className="text-[16px] text-[#333]">{name}</span>
              </div>
            );
          })}
        </div>
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
      className="flex h-9 items-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-3.5 text-[14px] font-medium text-[var(--primary)] active:scale-[0.97] transition"
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
  // Figma: root=28px rounded-[14px], reply=24px rounded-[12px]
  const avatarCls = isReply
    ? "h-6 w-6 text-[10px] rounded-[12px]"
    : "h-7 w-7 text-[12px] rounded-[14px]";
  const avatarBg = isReply ? "#b0b0b0" : "var(--primary)";

  return (
    <div className="flex gap-[10px]">
      {comment.authorAvatar ? (
        <img
          src={comment.authorAvatar}
          alt={comment.authorName}
          className={`${isReply ? "h-6 w-6" : "h-7 w-7"} mt-0.5 shrink-0 rounded-full border border-[#f0f0f0] object-cover`}
        />
      ) : (
        <div
          className={`mt-0.5 grid shrink-0 place-items-center font-bold text-white ${avatarCls}`}
          style={{ background: avatarBg }}
        >
          {comment.authorName.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {/* 작성자 이름 + 시간 — Figma: 16px bold #222, 14px regular #666 */}
        <div className="flex items-center gap-[6px] py-[2px] mb-[2px]">
          <span className="text-[16px] font-bold text-[#222] whitespace-nowrap">
            {comment.authorName}
          </span>
          <span className="text-[14px] text-[#666]">{relativeTime(comment.createdAt)}</span>
        </div>
        {/* 댓글 본문 — Figma: 16px regular #444, line-height 19.5px */}
        <p className="text-[16px] text-[#444] leading-[19.5px] break-words overflow-hidden">
          {comment.body}
        </p>
        {/* 액션 — Figma: 14px */}
        <div className="flex items-center gap-3 mt-[6px]">
          {!isReply && onReply && (
            <button
              type="button"
              onClick={onReply}
              className="text-[14px] text-[#4283f3]"
            >
              답글 달기
            </button>
          )}
          {comment.authorId === myId && (
            <button
              type="button"
              onClick={onDelete}
              className="text-[14px] text-[#999]"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
