import { createFileRoute, Link, Outlet, useNavigate, useMatches } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, BookOpen, Lock, Check, MessageCircle, Eye } from "lucide-react";
import {
  getMyDiaries,
  getSharedDiaries,
  getDiaryByInviteCode,
  isDiaryAuthorized,
  authorizeDiary,
  addViewer,
  getComments,
  relativeTime,
  coverColorForId,
  type ExchangeDiary,
} from "@/lib/exchangeStore";

export const Route = createFileRoute("/exchange")({
  head: () => ({
    meta: [
      { title: "교환 일기 — 안다미로" },
      { name: "description", content: "소중한 사람과 일기를 나눠보세요." },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { invite?: string } => ({
    invite: typeof search.invite === "string" ? search.invite : undefined,
  }),
  component: ExchangePage,
});

type TabId = "my" | "shared";

// 라우터: 자식 라우트면 Outlet, 아니면 목록 페이지
function ExchangePage() {
  const matches = useMatches();
  const isChildRoute = matches.some(
    (m) => m.routeId === "/exchange/$roomId" || m.routeId === "/exchange/create"
  );
  return isChildRoute ? <Outlet /> : <ExchangeListPage />;
}

function ExchangeListPage() {
  const { invite } = Route.useSearch();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabId>("my");
  const [myDiaries, setMyDiaries] = useState<ExchangeDiary[]>([]);
  const [sharedDiaries, setSharedDiaries] = useState<ExchangeDiary[]>([]);

  const refresh = () => {
    setMyDiaries(getMyDiaries());
    setSharedDiaries(getSharedDiaries());
  };

  useEffect(() => {
    refresh();
  }, []);

  // ── 초대 링크 처리 ──────────────────────────────────────────────────────
  const [inviteDiary, setInviteDiary] = useState<ExchangeDiary | null>(null);
  const [invitePw, setInvitePw] = useState("");
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (!invite) return;
    const diary = getDiaryByInviteCode(invite);
    if (!diary) {
      alert("유효하지 않은 초대 링크예요.");
      return;
    }
    if (isDiaryAuthorized(diary.id)) {
      addViewer(diary.id);
      navigate({ to: "/exchange/$roomId", params: { roomId: diary.id } });
    } else {
      setInviteDiary(diary);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite]);

  const handleJoinConfirm = () => {
    if (!inviteDiary) return;
    if (invitePw.trim() !== inviteDiary.password) {
      setInviteError("비밀번호가 맞지 않아요.");
      return;
    }
    authorizeDiary(inviteDiary.id);
    addViewer(inviteDiary.id);
    refresh();
    navigate({ to: "/exchange/$roomId", params: { roomId: inviteDiary.id } });
  };

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col" style={{ background: "#f5f6f8" }}>
        <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
          {/* 헤더 */}
          <header className="sticky top-0 z-10 bg-white flex items-center gap-2 px-4 pt-[52px] pb-3 border-b border-[#f0f0f0]">
            <Link to="/my" className="p-1 -ml-1">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </Link>
            <h1 className="flex-1 font-bold text-foreground text-[18px] tracking-tight">교환 일기</h1>
            <Link
              to="/exchange/create"
              className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3.5 py-1.5 active:scale-[0.97] transition"
            >
              <Plus className="h-4 w-4 text-white" strokeWidth={2.5} />
              <span className="text-[13px] font-semibold text-white">새 일기</span>
            </Link>
          </header>

          {/* 탭 */}
          <div className="sticky top-[103px] z-10 bg-white flex border-b border-[#f0f0f0]">
            {(["my", "shared"] as TabId[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-[14px] font-semibold tracking-tight transition ${
                  tab === t
                    ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                    : "text-[#bbb]"
                }`}
              >
                {t === "my" ? "내가 공유한" : "공유 받은"}
              </button>
            ))}
          </div>

          <div className="pb-8">
            {tab === "my" ? (
              myDiaries.length === 0 ? (
                <EmptyMy />
              ) : (
                <ul className="px-4 pt-4 flex flex-col gap-3">
                  {myDiaries.map((d) => (
                    <DiaryCard key={d.id} diary={d} showAuthor={false} />
                  ))}
                </ul>
              )
            ) : sharedDiaries.length === 0 ? (
              <EmptyShared />
            ) : (
              <ul className="px-4 pt-4 flex flex-col gap-3">
                {sharedDiaries.map((d) => (
                  <DiaryCard key={d.id} diary={d} showAuthor={true} />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 초대 비밀번호 바텀시트 */}
        {inviteDiary && (
          <div
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <div className="w-full rounded-t-[24px] bg-white px-5 pt-6 pb-10">
              <h3 className="font-bold text-foreground text-[18px] tracking-tight mb-1">
                교환일기 열람하기
              </h3>
              <p className="text-[13px] text-[#999] mb-5 tracking-tight">
                <span className="font-semibold text-foreground">"{inviteDiary.title}"</span>을
                읽으려면 비밀번호를 입력해 주세요.
              </p>
              <div className="flex items-center gap-2 rounded-xl bg-[#f4f6fa] px-4 py-3 mb-2">
                <Lock className="h-4 w-4 text-[#aaa] shrink-0" />
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={invitePw}
                  onChange={(e) => { setInvitePw(e.target.value); setInviteError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) handleJoinConfirm();
                  }}
                  className="flex-1 bg-transparent text-base text-foreground placeholder:text-[#bbb] outline-none"
                  autoFocus
                />
              </div>
              {inviteError && (
                <p className="text-[12px] text-red-400 mb-2 tracking-tight">{inviteError}</p>
              )}
              <button
                type="button"
                onClick={handleJoinConfirm}
                className="mt-3 w-full rounded-2xl py-3.5 font-bold text-white text-[15px] tracking-tight active:scale-[0.99] transition"
                style={{ background: "var(--primary)" }}
              >
                열람하기
              </button>
              <button
                type="button"
                onClick={() => setInviteDiary(null)}
                className="mt-2 w-full rounded-2xl py-2.5 text-[14px] text-[#999] tracking-tight"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 빈 상태 ──────────────────────────────────────────────────────────────────
function EmptyMy() {
  return (
    <div className="flex flex-col items-center justify-center px-6 pt-20 pb-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--primary)]/10 mb-5">
        <BookOpen className="h-9 w-9 text-[var(--primary)]" />
      </div>
      <p className="text-[17px] font-bold text-foreground tracking-tight mb-2">
        아직 공유한 일기가 없어요
      </p>
      <p className="text-[13px] text-[#aaa] tracking-tight leading-relaxed mb-8">
        일기를 만들고 소중한 사람에게<br />초대 링크를 공유해 보세요.
      </p>
      <Link
        to="/exchange/create"
        className="flex items-center gap-2 rounded-2xl px-6 py-3.5 font-bold text-white text-[15px] tracking-tight active:scale-[0.98] transition shadow-md"
        style={{ background: "var(--primary)" }}
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        새 일기 공유하기
      </Link>
    </div>
  );
}

function EmptyShared() {
  return (
    <div className="flex flex-col items-center justify-center px-6 pt-20 pb-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-[#f4f6fa] mb-5">
        <BookOpen className="h-9 w-9 text-[#bbb]" />
      </div>
      <p className="text-[17px] font-bold text-foreground tracking-tight mb-2">
        아직 공유받은 일기가 없어요
      </p>
      <p className="text-[13px] text-[#aaa] tracking-tight leading-relaxed">
        초대 링크를 받으면 여기에 표시돼요.
      </p>
    </div>
  );
}

// ── 일기 카드 ─────────────────────────────────────────────────────────────────
function DiaryCard({
  diary,
  showAuthor,
}: {
  diary: ExchangeDiary;
  showAuthor: boolean;
}) {
  const commentCount = getComments(diary.id).length;
  const color = coverColorForId(diary.id);

  return (
    <Link
      to="/exchange/$roomId"
      params={{ roomId: diary.id }}
      className="flex items-center gap-3 rounded-2xl bg-white border border-[#f0f0f0] px-4 py-4 shadow-sm active:bg-[#f8f8f8] transition"
    >
      {/* 썸네일 */}
      {diary.imageDataUrl ? (
        <img
          src={diary.imageDataUrl}
          alt=""
          className="h-14 w-14 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-white font-bold text-[22px]"
          style={{ background: color }}
        >
          {diary.title.charAt(0)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-[15px] tracking-tight truncate">
          {diary.title}
        </p>

        <div className="flex items-center gap-2 mt-0.5">
          {showAuthor ? (
            <span className="text-[12px] text-[#999] tracking-tight truncate">
              {diary.authorName}
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-[#bbb]" />
              <span className="text-[12px] text-[#999] tracking-tight">
                {diary.viewerIds.length}명이 읽었어요
              </span>
            </div>
          )}
          <span className="text-[#ddd]">·</span>
          <span className="text-[12px] text-[#bbb] tracking-tight">
            {relativeTime(diary.createdAt)}
          </span>
        </div>

        {commentCount > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <MessageCircle className="h-3 w-3 text-[#bbb]" />
            <span className="text-[12px] text-[#bbb] tracking-tight">댓글 {commentCount}개</span>
          </div>
        )}
      </div>

      <ChevronRight className="h-4 w-4 text-[#bbb] shrink-0" />
    </Link>
  );
}

// ── 초대 링크 복사 버튼 (상세 페이지에서 재사용) ────────────────────────────
export function InviteLinkButton({ diary }: { diary: ExchangeDiary }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/exchange?invite=${diary.inviteCode}`;
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
      className="flex items-center gap-1.5 rounded-full bg-[#f4f6fa] px-3 py-1.5 active:scale-[0.97] transition"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <svg className="h-3.5 w-3.5 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      <span className="text-[12px] font-medium text-foreground tracking-tight">
        {copied ? "복사됨!" : "초대 링크 복사"}
      </span>
    </button>
  );
}
