import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  Bell,
  Database,
  Megaphone,
  HelpCircle,
  FileText,
  BookMarked,
  X,
  LogIn,
  Camera,
  Check,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/PageHeader";
import cloverActiveSvg from "@/assets/icons/clover-active.svg";
import bgShapeLargeSvg from "@/assets/icons/bg-shape-large.svg";
import { BottomNav } from "@/components/BottomNav";
import bgShapeSmallSvg from "@/assets/icons/bg-shape-small.svg";
import { getDiaryEntries, countThisMonth } from "@/lib/diaryStore";
import { getMyDiaries, getSharedDiaries } from "@/lib/exchangeStore";
import { getCachedUser, getAuthDisplayName, setDisplayName, signOut, deleteAccount } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  EXCHANGE_NOTIF_ON_KEY,
  NOTIF_ON_KEY,
  getNotificationPermission,
  enableExchangePushNotifications,
  disableExchangePushNotifications,
  isWebPushSupported,
  sendExchangeTestNotification,
} from "@/lib/notifications";

export const Route = createFileRoute("/my")({
  head: () => ({
    meta: [
      { title: "마이 — 안다미로" },
      { name: "description", content: "내 프로필과 앱 설정을 관리하세요." },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  component: MyPage,
});

function MyPage() {
  const navigate = useNavigate();
  const entries = getDiaryEntries();
  const totalCount = entries.length;
  const thisMonth = countThisMonth(entries);

  // ── 로그인 상태 ───────────────────────────────────────────────────────────
  const [user, setUser] = useState(getCachedUser());
  const [displayName, setDisplayNameState] = useState(getAuthDisplayName() ?? "안다미로 친구");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setDisplayNameState(
        (u?.user_metadata?.display_name as string | undefined) ??
        (u?.user_metadata?.full_name as string | undefined) ??
        (u?.user_metadata?.name as string | undefined) ??
        "안다미로 친구"
      );
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── 닉네임 편집 ───────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const openNameEdit = () => {
    setNameInput(displayName);
    setEditingName(true);
  };

  const handleNameSave = async () => {
    if (!nameInput.trim() || nameInput.trim() === displayName) {
      setEditingName(false);
      return;
    }
    setNameSaving(true);
    try {
      await setDisplayName(nameInput.trim());
      setDisplayNameState(nameInput.trim());
    } catch {
      alert("닉네임 저장에 실패했어요.");
    } finally {
      setNameSaving(false);
      setEditingName(false);
    }
  };

  // ── 로그아웃 ─────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    if (!confirm("로그아웃 하시겠어요?")) return;
    await signOut();
    navigate({ to: "/my" });
  };

  const handleDeleteAccount = async () => {
    if (!confirm("회원탈퇴 하시겠어요?")) return;
    await deleteAccount();
    navigate({ to: "/my" });
  };

  // ── 알림 설정 ─────────────────────────────────────────────────────────────
  const [notif, setNotif] = useState(() => localStorage.getItem(NOTIF_ON_KEY) !== "0");
  const [exchangeNotif, setExchangeNotif] = useState(
    () => localStorage.getItem(EXCHANGE_NOTIF_ON_KEY) !== "0",
  );
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">(
    getNotificationPermission,
  );
  const [showNotifSuccess, setShowNotifSuccess] = useState(false);

  const handleExchangeNotifToggle = async (v: boolean) => {
    if (v) {
      const granted = await enableExchangePushNotifications();
      setNotifPerm(getNotificationPermission());
      if (!granted) {
        alert(
          isWebPushSupported()
            ? "푸시 알림 설정에 실패했어요. VAPID 공개키와 브라우저 권한을 확인해 주세요."
            : "이 브라우저는 푸시 알림을 지원하지 않아요.",
        );
        return;
      }
      setNotif(true);
      setExchangeNotif(true);
      setShowNotifSuccess(true);
      sendExchangeTestNotification();
    } else {
      await disableExchangePushNotifications();
      setExchangeNotif(false);
    }
  };

  const notifGranted = notifPerm === "granted";
  const notifDenied = notifPerm === "denied";

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col" style={{ background: "#f5f6f8" }}>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* 그라디언트 헤더 */}
          <div
            className="relative overflow-hidden pb-20"
            style={{ background: "var(--gradient-sky)" }}
          >
            <img src={bgShapeLargeSvg} alt="" aria-hidden className="pointer-events-none absolute -top-2 -right-4 w-[260px] h-[275px] z-0" />
            <img src={bgShapeSmallSvg} alt="" aria-hidden className="pointer-events-none absolute top-[40px] -left-8 w-[142px] h-[196px] z-0" />
            <PageHeader className="bg-transparent" title="마이" titleColor="text-white" />
            <p className="relative z-10 mt-3 px-6 text-white/85 text-[14px]">
              {user ? "안녕하세요," : "로그인하고 더 많은 기능을 사용해보세요"}
            </p>
            <p className="relative z-10 mt-1 px-6 font-bold text-white text-[20px] leading-tight">
              {user ? `${displayName}님` : "안다미로"}
            </p>
          </div>

          {/* 프로필 카드 */}
          <div className="px-4 -mt-12 relative z-10">
            <div className="rounded-2xl bg-white p-4 shadow-[0_6px_24px_-10px_rgba(0,0,0,0.12)] flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--primary)]/10">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url as string}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <img src={cloverActiveSvg} alt="" className="h-8 w-8" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-[16px] truncate">
                  {user ? displayName : "로그인이 필요해요"}
                </p>
                <p className="text-[12px] text-[#999] truncate">
                  {user ? (user.email ?? "감정 기록 중 🌱") : "구글 계정으로 간편 로그인"}
                </p>
              </div>
              {user ? (
                <button
                  type="button"
                  onClick={openNameEdit}
                  className="shrink-0 flex items-center gap-1 rounded-full bg-[#f4f6fa] px-3 py-1.5 text-[12px] font-medium text-[var(--primary)] active:scale-[0.97] transition"
                >
                  프로필 편집
                </button>
              ) : (
                <Link
                  to="/login"
                  search={{ redirect: "/my" }}
                  className="shrink-0 flex items-center gap-1 rounded-full bg-[var(--primary)] px-3 py-1.5 text-[12px] font-medium text-white active:scale-[0.97] transition"
                >
                  <LogIn className="h-3 w-3" />
                  로그인
                </Link>
              )}
            </div>
          </div>

          {/* 통계 */}
          <section className="px-4 mt-4">
            <p className="px-1 mb-2 text-[12px] text-[#999]">활동요약</p>
            <div className="rounded-2xl bg-white p-3 shadow-sm grid grid-cols-3">
              <Stat value={String(totalCount)} label="전체 일기" />
              <Stat value={String(thisMonth)} label="이번 달 일기" divided />
              <ExchangeCountStat divided />
            </div>
          </section>

          {/* 바로가기 */}
          <section className="px-4 mt-5">
            <div className="rounded-2xl bg-white border border-[#f0f0f0] overflow-hidden shadow-sm">
              <MenuLinkRow to="/exchange" icon={<BookMarked className="h-4 w-4" />} label="공유 일기" />
              <div className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-[#f5f5f5]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f4f6fa] text-[var(--primary)] shrink-0">
                  <Bell className="h-4 w-4" />
                </span>
                <span className="flex-1 text-[14px] text-foreground">푸시 알림</span>
                <Switch
                  checked={exchangeNotif && notif && notifGranted}
                  onCheckedChange={handleExchangeNotifToggle}
                  disabled={notifDenied || notifPerm === "unsupported" || !isWebPushSupported()}
                />
              </div>
            </div>
          </section>

          {/* 기타 */}
          <section className="px-4 mt-5">
            <div className="rounded-2xl bg-white border border-[#f0f0f0] overflow-hidden">
              <Row icon={<Database className="h-4 w-4" />} label="데이터 백업" onClick={() => navigate({ to: "/backup" })} />
              <Row icon={<Megaphone className="h-4 w-4" />} label="공지사항" />
              <Row icon={<HelpCircle className="h-4 w-4" />} label="도움말 / FAQ" />
              <Row icon={<FileText className="h-4 w-4" />} label="약관 및 개인정보 처리방침" />
              <Row icon={<FileText className="h-4 w-4" />} label="앱 버전" trailing="v0.1.0" hideChevron last />
            </div>
          </section>

          {/* 로그아웃 */}
          {user && (
            <div className="mt-6 mb-2 flex items-center justify-center gap-4 text-[12px] text-[#999]">
              <button type="button" onClick={handleSignOut} className="px-2 py-1 active:text-foreground">
                로그아웃
              </button>
              <span className="h-3 w-px bg-[#e0e0e0]" />
              <button type="button" onClick={handleDeleteAccount} className="px-2 py-1 active:text-foreground">
                회원탈퇴
              </button>
            </div>
          )}
        </div>

        {/* 닉네임 편집 바텀시트 */}
        {editingName && (
          <div
            className="absolute inset-0 z-50 flex flex-col"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setEditingName(false)}
          >
            {/* 시트 */}
            <div
              className="mt-auto w-full rounded-t-[28px] bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 핸들 */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-[#E5E7EB]" />
              </div>

              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-[#F3F4F6]">
                <h3 className="font-bold text-foreground text-[18px]">프로필 편집</h3>
                <button type="button" onClick={() => setEditingName(false)}
                  className="rounded-full p-1.5 hover:bg-[#F3F4F6] transition">
                  <X className="h-5 w-5 text-[#999]" />
                </button>
              </div>

              {/* 아바타 */}
              <div className="flex flex-col items-center pt-7 pb-5">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-[var(--primary)]/10 flex items-center justify-center">
                    {user?.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url as string}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img src={cloverActiveSvg} alt="" className="h-10 w-10" />
                    )}
                  </div>
                  {/* 카메라 배지 */}
                  <div className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-[#F3F4F6] border-2 border-white flex items-center justify-center">
                    <Camera className="h-3.5 w-3.5 text-[#6B7280]" />
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] text-[#C5CAD3]">Google 계정 프로필 사진</p>
              </div>

              {/* 이름 필드 */}
              <div className="px-5 pb-3">
                <label className="block text-[12px] font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">닉네임</label>
                <div className="relative">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) handleNameSave();
                    }}
                    maxLength={20}
                    placeholder="닉네임을 입력해 주세요"
                    className="w-full rounded-2xl border border-[#E8EAED] bg-[#F8F9FB] px-4 py-3.5 text-[16px] text-foreground focus:outline-none focus:border-[var(--primary)] focus:bg-white transition pr-12"
                    autoFocus
                  />
                  {nameInput.trim() && nameInput.trim() !== displayName && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center"
                      style={{ background: "var(--primary)" }}>
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[#C5CAD3] text-right mt-1">{nameInput.length}/20</p>
              </div>

              {/* 이메일 필드 (읽기 전용) */}
              <div className="px-5 pb-6">
                <label className="block text-[12px] font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide">이메일</label>
                <div className="w-full rounded-2xl border border-[#F0F0F0] bg-[#F8F9FB] px-4 py-3.5 flex items-center gap-2">
                  <span className="text-[16px] text-[#B0B7C3] flex-1 truncate">
                    {user?.email ?? "—"}
                  </span>
                  <span className="shrink-0 rounded-full bg-[#F0F0F0] px-2 py-0.5 text-[10px] font-semibold text-[#B0B7C3]">변경 불가</span>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="px-5 pb-10">
                <button
                  type="button"
                  onClick={handleNameSave}
                  disabled={nameSaving || !nameInput.trim()}
                  className="w-full rounded-2xl py-4 font-bold text-white text-[16px] disabled:opacity-40 transition active:scale-[0.98]"
                  style={{ background: "var(--primary)" }}
                >
                  {nameSaving ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </div>
          </div>
        )}

        <BottomNav active="my" />

        {/* 알림 허용 성공 모달 — app-frame 안에 위치해야 PC에서 프레임 안에 표시됨 */}
        {showNotifSuccess && (
          <div
            className="absolute inset-0 z-50 flex items-end justify-center bg-black/30"
            onClick={() => setShowNotifSuccess(false)}
          >
            <div
              className="w-full bg-white rounded-t-[20px] px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[48px] leading-none">🔔</span>
              <p className="text-[18px] font-bold text-foreground">알림이 허용되었어요</p>
              <p className="text-[14px] text-[#999]">새 알림이 오면 알려드릴게요.</p>
              <button
                type="button"
                onClick={() => setShowNotifSuccess(false)}
                className="mt-2 w-full h-[52px] rounded-[12px] bg-[#4B82F5] text-white text-[16px] font-semibold"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExchangeCountStat({ divided }: { divided?: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    Promise.all([getMyDiaries(), getSharedDiaries()]).then(([mine, shared]) =>
      setCount(mine.length + shared.length)
    );
  }, []);
  return <Stat value={String(count)} label="공유 일기" divided={divided} />;
}

function MenuLinkRow({
  to,
  icon,
  label,
}: {
  to: "/diary" | "/exchange";
  icon: React.ReactNode;
  label: string;
}) {
  const content = (
    <>
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f4f6fa] text-[var(--primary)] shrink-0">
        {icon}
      </span>
      <span className="flex-1 text-[14px] text-foreground">{label}</span>
      <ChevronRight className="h-4 w-4 text-[#cbcbd1]" strokeWidth={2.2} />
    </>
  );

  if (to === "/exchange") {
    return (
      <Link
        to="/exchange"
        search={{ invite: undefined }}
        className="flex items-center gap-3 px-4 py-3.5 border-t border-[#f5f5f5] active:bg-[#fafbfc] transition"
      >
        {content}
      </Link>
    );
  }

  return (
    <Link
      to="/diary"
      className="flex items-center gap-3 px-4 py-3.5 active:bg-[#fafbfc] transition"
    >
      {content}
    </Link>
  );
}

function Stat({ value, label, divided }: { value: string; label: string; divided?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center py-2 ${divided ? "border-l border-[#eeeeee]" : ""}`}>
      <span className="text-[22px] font-semibold text-foreground leading-none">{value}</span>
      <span className="mt-1.5 text-[12px] text-[#999]">{label}</span>
    </div>
  );
}

function Row({
  icon, label, trailing, hideChevron, last, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: string;
  hideChevron?: boolean;
  last?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#fafbfc] transition ${last ? "" : "border-b border-[#f5f5f5]"}`}
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f4f6fa] text-[var(--primary)] shrink-0">{icon}</span>
      <span className="flex-1 text-[14px] text-foreground">{label}</span>
      {trailing && <span className="text-[12.5px] text-[#999]">{trailing}</span>}
      {!hideChevron && <ChevronRight className="h-4 w-4 text-[#cbcbd1]" strokeWidth={2.2} />}
    </button>
  );
}
