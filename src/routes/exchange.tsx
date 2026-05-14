import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, ChevronRight, BookOpen, Lock, Users, Copy, Check, ChevronLeft } from "lucide-react";
import {
  getRooms, createRoom, getRoomByInviteCode, joinRoom,
  isRoomAuthorized, authorizeRoom, getPosts, relativeTime,
  type ExchangeRoom,
} from "@/lib/exchangeStore";

export const Route = createFileRoute("/exchange")({
  head: () => ({
    meta: [
      { title: "교환일기 — 안다미로" },
      { name: "description", content: "소중한 사람과 교환일기를 써보세요." },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    invite: typeof search.invite === "string" ? search.invite : undefined,
  }),
  component: ExchangePage,
});

function ExchangePage() {
  const { invite } = Route.useSearch();
  const navigate = useNavigate();

  // 방 목록 (클라이언트에서만)
  const [rooms, setRooms] = useState<ExchangeRoom[]>([]);
  useEffect(() => {
    setRooms(getRooms());
  }, []);

  const [showCreate, setShowCreate] = useState(false);

  // 초대 링크 처리
  const [inviteRoom, setInviteRoom] = useState<ExchangeRoom | null>(null);
  const [invitePw, setInvitePw] = useState("");
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (!invite) return;
    const room = getRoomByInviteCode(invite);
    if (!room) {
      alert("유효하지 않은 초대 링크예요.");
      return;
    }
    if (isRoomAuthorized(room.id)) {
      joinRoom(room.id);
      setRooms(getRooms());
      navigate({ to: "/exchange/$roomId", params: { roomId: room.id } });
    } else {
      setInviteRoom(room);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite]);

  const handleJoinConfirm = () => {
    if (!inviteRoom) return;
    if (invitePw.trim() !== inviteRoom.password) {
      setInviteError("비밀번호가 맞지 않아요.");
      return;
    }
    joinRoom(inviteRoom.id);
    authorizeRoom(inviteRoom.id);
    setRooms(getRooms());
    navigate({ to: "/exchange/$roomId", params: { roomId: inviteRoom.id } });
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
            <h1 className="flex-1 font-bold text-foreground text-[18px] tracking-tight">교환 일기장</h1>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3.5 py-1.5 active:scale-[0.97] transition"
            >
              <Plus className="h-4 w-4 text-white" strokeWidth={2.5} />
              <span className="text-[13px] font-semibold text-white">새 일기장</span>
            </button>
          </header>

          <div className="pb-8">
            {rooms.length === 0 ? (
              <EmptyState onCreateClick={() => setShowCreate(true)} />
            ) : (
              <ul className="px-4 pt-4 flex flex-col gap-3">
                {rooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 새 일기장 만들기 바텀시트 */}
        {showCreate && (
          <CreateRoomSheet
            onClose={() => setShowCreate(false)}
            onCreate={(room) => {
              setRooms(getRooms());
              setShowCreate(false);
              navigate({ to: "/exchange/$roomId", params: { roomId: room.id } });
            }}
          />
        )}

        {/* 초대 비밀번호 인증 바텀시트 */}
        {inviteRoom && (
          <div
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <div className="w-full rounded-t-[24px] bg-white px-5 pt-6 pb-10">
              <h3 className="font-bold text-foreground text-[18px] tracking-tight mb-1">
                교환일기 참여하기
              </h3>
              <p className="text-[13px] text-[#999] mb-5 tracking-tight">
                <span className="font-semibold text-foreground">"{inviteRoom.name}"</span>에
                참여하려면 비밀번호를 입력해 주세요.
              </p>
              <div className="flex items-center gap-2 rounded-xl bg-[#f4f6fa] px-4 py-3 mb-2">
                <Lock className="h-4 w-4 text-[#aaa] shrink-0" />
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={invitePw}
                  onChange={(e) => { setInvitePw(e.target.value); setInviteError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinConfirm()}
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
                참여하기
              </button>
              <button
                type="button"
                onClick={() => setInviteRoom(null)}
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

// ── 빈 상태 ───────────────────────────────────────────────────────────────
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 pt-24 pb-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--primary)]/10 mb-5">
        <BookOpen className="h-9 w-9 text-[var(--primary)]" />
      </div>
      <p className="text-[18px] font-bold text-foreground tracking-tight mb-2">
        아직 일기장이 없어요 😢
      </p>
      <p className="text-[13px] text-[#aaa] tracking-tight leading-relaxed mb-8">
        소중한 사람과 감정을 나눠보세요.<br />
        일기장을 만들고 링크로 초대하면 돼요.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="flex items-center gap-2 rounded-2xl px-6 py-3.5 font-bold text-white text-[15px] tracking-tight active:scale-[0.98] transition shadow-md"
        style={{ background: "var(--primary)" }}
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        새 일기장 만들기
      </button>
    </div>
  );
}

// ── 방 카드 ───────────────────────────────────────────────────────────────
function RoomCard({ room }: { room: ExchangeRoom }) {
  const posts = getPosts(room.id);
  const latest = posts[0];

  return (
    <Link
      to="/exchange/$roomId"
      params={{ roomId: room.id }}
      className="flex items-center gap-3 rounded-2xl bg-white border border-[#f0f0f0] px-4 py-4 shadow-sm active:bg-[#f8f8f8] transition"
    >
      <div
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white font-bold text-[18px]"
        style={{ background: room.coverColor }}
      >
        {room.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-[15px] tracking-tight truncate">{room.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Users className="h-3 w-3 text-[#bbb]" />
          <span className="text-[12px] text-[#999] tracking-tight">{room.memberIds.length}명 참여 중</span>
          {latest && (
            <>
              <span className="text-[#ddd]">·</span>
              <span className="text-[12px] text-[#bbb] tracking-tight truncate">
                {relativeTime(latest.createdAt)}
              </span>
            </>
          )}
        </div>
        {latest && (
          <p className="text-[12px] text-[#aaa] mt-1 truncate tracking-tight">{latest.title}</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-[#bbb] shrink-0" />
    </Link>
  );
}

// ── 새 일기장 만들기 바텀시트 ─────────────────────────────────────────────
function CreateRoomSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (room: ExchangeRoom) => void;
}) {
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!name.trim()) { setError("일기장 이름을 입력해 주세요."); return; }
    if (!pw.trim()) { setError("비밀번호를 입력해 주세요."); return; }
    const room = createRoom(name.trim(), pw.trim(), desc.trim() || undefined);
    onCreate(room);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-[24px] bg-white px-5 pt-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-foreground text-[18px] tracking-tight mb-5">새 일기장 만들기</h3>

        <label className="block mb-3">
          <span className="text-[13px] font-medium text-[#666] tracking-tight mb-1.5 block">일기장 이름</span>
          <input
            type="text"
            placeholder="예: 우리 둘만의 일기"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            className="w-full rounded-xl bg-[#f4f6fa] px-4 py-3 text-base text-foreground placeholder:text-[#bbb] outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          />
        </label>

        <label className="block mb-3">
          <span className="text-[13px] font-medium text-[#666] tracking-tight mb-1.5 block">비밀번호</span>
          <div className="flex items-center gap-2 rounded-xl bg-[#f4f6fa] px-4 py-3">
            <Lock className="h-4 w-4 text-[#aaa] shrink-0" />
            <input
              type="text"
              placeholder="초대받은 사람이 입력할 비밀번호"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(""); }}
              className="flex-1 bg-transparent text-base text-foreground placeholder:text-[#bbb] outline-none"
            />
          </div>
        </label>

        <label className="block mb-4">
          <span className="text-[13px] font-medium text-[#666] tracking-tight mb-1.5 block">소개 (선택)</span>
          <input
            type="text"
            placeholder="간단한 소개를 써주세요"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full rounded-xl bg-[#f4f6fa] px-4 py-3 text-base text-foreground placeholder:text-[#bbb] outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          />
        </label>

        {error && <p className="text-[12px] text-red-400 mb-2 tracking-tight">{error}</p>}

        <button
          type="button"
          onClick={handleCreate}
          className="w-full rounded-2xl py-3.5 font-bold text-white text-[15px] tracking-tight active:scale-[0.99] transition"
          style={{ background: "var(--primary)" }}
        >
          만들기
        </button>
      </div>
    </div>
  );
}

// ── 초대 링크 복사 버튼 (room detail에서 재사용) ──────────────────────────
export function InviteLinkButton({ room }: { room: ExchangeRoom }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/exchange?invite=${room.inviteCode}`;
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
        <Copy className="h-3.5 w-3.5 text-[var(--primary)]" />
      )}
      <span className="text-[12px] font-medium text-foreground tracking-tight">
        {copied ? "복사됨!" : "초대 링크 복사"}
      </span>
    </button>
  );
}
