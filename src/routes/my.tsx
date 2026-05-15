import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Bell,
  Clock,
  Database,
  Megaphone,
  HelpCircle,
  FileText,
  BookOpen,
  BookMarked,
  Check,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import cloverActiveSvg from "@/assets/icons/clover-active.svg";
import bgShapeLargeSvg from "@/assets/icons/bg-shape-large.svg";
import { BottomNav } from "@/components/BottomNav";
import bgShapeSmallSvg from "@/assets/icons/bg-shape-small.svg";
import { getDiaryEntries, calcStreak, countThisMonth } from "@/lib/diaryStore";
import { getMyDiaries, getSharedDiaries } from "@/lib/exchangeStore";

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

const NOTIF_TIME_KEY = "andamiro_notif_time";
const NOTIF_ON_KEY = "andamiro_notif_on";

/** 브라우저 알림 권한 요청 */
async function requestNotifPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** 즉시 테스트 알림 발송 */
function sendTestNotif() {
  if (Notification.permission === "granted") {
    new Notification("안다미로 알림 🍀", {
      body: "오늘의 감정을 기록할 시간이에요!",
      icon: "/favicon.png",
    });
  }
}

function MyPage() {
  const entries = getDiaryEntries();
  const totalCount = entries.length;
  const streak = calcStreak(entries);
  const thisMonth = countThisMonth(entries);

  // 설정 상태 — localStorage에서 초기값 읽기
  const [notif, setNotif] = useState(() => localStorage.getItem(NOTIF_ON_KEY) !== "0");
  const [notifTime, setNotifTime] = useState(() => localStorage.getItem(NOTIF_TIME_KEY) ?? "21:00");
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeSaved, setTimeSaved] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // 알림 토글
  const handleNotifToggle = async (v: boolean) => {
    if (v) {
      const granted = await requestNotifPermission();
      setNotifPerm("Notification" in window ? Notification.permission : "unsupported");
      if (!granted) {
        // 권한 거부됨 — 토글은 켜지지 않음
        alert("브라우저 설정에서 알림 권한을 허용해 주세요.");
        return;
      }
      setNotif(true);
      localStorage.setItem(NOTIF_ON_KEY, "1");
      sendTestNotif();
    } else {
      setNotif(false);
      localStorage.setItem(NOTIF_ON_KEY, "0");
    }
  };

  // 알림 시간 저장
  const handleTimeSave = (time: string) => {
    setNotifTime(time);
    localStorage.setItem(NOTIF_TIME_KEY, time);
    setShowTimePicker(false);
    setTimeSaved(true);
    setTimeout(() => setTimeSaved(false), 2000);
  };

  // 알림 시간 체크 (앱 열릴 때 — 설정 시간 ±5분이면 알림 발송)
  useEffect(() => {
    if (notifPerm !== "granted" || !notif) return;
    const now = new Date();
    const parts = notifTime.split(":");
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const targetMin = hh * 60 + mm;
    if (Math.abs(nowMin - targetMin) <= 5) {
      const lastNotif = localStorage.getItem("andamiro_last_notif");
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (lastNotif !== today) {
        sendTestNotif();
        localStorage.setItem("andamiro_last_notif", today);
      }
    }
  }, [notif, notifTime, notifPerm]);

  const notifGranted = notifPerm === "granted";
  const notifDenied = notifPerm === "denied";

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col" style={{ background: "#f5f6f8" }}>
        <div className="absolute inset-0 overflow-y-auto pb-[126px]">
          {/* 그라디언트 헤더 */}
          <div
            className="relative overflow-hidden pt-6 pb-20 px-6"
            style={{ background: "var(--gradient-sky)" }}
          >
            <img
              src={bgShapeLargeSvg}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -top-2 -right-4 w-[260px] h-[275px] z-0"
            />
            <img
              src={bgShapeSmallSvg}
              alt=""
              aria-hidden
              className="pointer-events-none absolute top-[40px] -left-8 w-[142px] h-[196px] z-0"
            />
            <header className="relative z-10 flex items-center justify-center pb-2">
              <h1 className="font-semibold text-white text-[16px] tracking-tight">마이</h1>
            </header>
            <p className="relative z-10 mt-3 text-white/85 text-[13px] tracking-tight">
              안녕하세요,
            </p>
            <p className="relative z-10 mt-1 font-bold text-white text-[20px] leading-tight tracking-tight">
              안다미로 친구님 🍀
            </p>
          </div>

          {/* 프로필 카드 */}
          <div className="px-4 -mt-12 relative z-10">
            <div className="rounded-2xl bg-white p-4 shadow-[0_6px_24px_-10px_rgba(0,0,0,0.12)] flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--primary)]/10">
                <img src={cloverActiveSvg} alt="" className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-[15px] tracking-tight truncate">
                  안다미로 친구
                </p>
                <p className="text-[12px] text-[#999] truncate">감정 기록 중 🌱</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full bg-[#f4f6fa] px-3 py-1.5 text-[12px] font-medium text-[var(--primary)] active:scale-[0.97] transition"
              >
                프로필 편집
              </button>
            </div>
          </div>

          {/* 통계 — 실제 데이터 */}
          <section className="px-4 mt-4">
            <p className="px-1 mb-2 text-[12px] text-[#999] tracking-tight">나의 기록 요약</p>
            <div className="rounded-2xl bg-white p-3 shadow-sm grid grid-cols-3">
              <Stat value={String(totalCount)} label="전체 기록" />
              <Stat value={`${streak}일`} label="연속 기록" divided />
              <Stat value={String(thisMonth)} label="이번 달" divided />
            </div>
          </section>

          {/* 영상 일기 바로가기 */}
          <section className="px-4 mt-4">
            <p className="px-1 mb-2 text-[12px] text-[#999] tracking-tight">영상 일기</p>
            <Link
              to="/diary"
              className="flex items-center gap-3 rounded-2xl bg-white border border-[#f0f0f0] px-4 py-3.5 shadow-sm active:bg-[#f8f8f8] transition"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary)]/10">
                <BookOpen className="h-4.5 w-4.5 text-[var(--primary)]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-[14px] tracking-tight">
                  영상 일기 기록
                </p>
                <p className="text-[11px] text-[#999] mt-0.5 tracking-tight">
                  날짜별 감정 기록 모아보기
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#bbb]" />
            </Link>
          </section>

          {/* 교환 일기 바로가기 */}
          <ExchangeLink />

          {/* 설정 */}
          <section className="px-4 mt-5">
            <p className="px-1 mb-2 text-[12px] text-[#999] tracking-tight">설정</p>
            <div className="rounded-2xl bg-white border border-[#f0f0f0] overflow-hidden">
              {/* 알림 토글 */}
              <div className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#f5f5f5]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f4f6fa] text-[var(--primary)] shrink-0">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] text-foreground tracking-tight">알림 설정</span>
                  {notifDenied && (
                    <p className="text-[11px] text-red-400 mt-0.5 tracking-tight">
                      브라우저에서 권한이 거부됨
                    </p>
                  )}
                  {notifGranted && notif && (
                    <p className="text-[11px] text-green-500 mt-0.5 tracking-tight">
                      알림 허용됨 ✓
                    </p>
                  )}
                </div>
                <Switch
                  checked={notif && notifGranted}
                  onCheckedChange={handleNotifToggle}
                  disabled={notifDenied}
                />
              </div>

              {/* 알림 시간 */}
              <button
                type="button"
                onClick={() => setShowTimePicker(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#fafbfc] transition"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f4f6fa] text-[var(--primary)] shrink-0">
                  <Clock className="h-4 w-4" />
                </span>
                <span className="flex-1 text-[14px] text-foreground tracking-tight">
                  일기 알림 시간
                </span>
                <span className="flex items-center gap-1.5 text-[12.5px] text-[#999]">
                  {timeSaved && <Check className="h-3.5 w-3.5 text-green-500" />}
                  {notifTime}
                </span>
                <ChevronRight className="h-4 w-4 text-[#cbcbd1]" strokeWidth={2.2} />
              </button>
            </div>
          </section>

          {/* 기타 */}
          <section className="px-4 mt-5">
            <p className="px-1 mb-2 text-[12px] text-[#999] tracking-tight">기타</p>
            <div className="rounded-2xl bg-white border border-[#f0f0f0] overflow-hidden">
              <Row icon={<Database className="h-4 w-4" />} label="데이터 백업" />
              <Row icon={<Megaphone className="h-4 w-4" />} label="공지사항" />
              <Row icon={<HelpCircle className="h-4 w-4" />} label="도움말 / FAQ" />
              <Row icon={<FileText className="h-4 w-4" />} label="약관 및 개인정보 처리방침" />
              <Row
                icon={<FileText className="h-4 w-4" />}
                label="앱 버전"
                trailing="v0.2.0"
                hideChevron
                last
              />
            </div>
          </section>

          {/* 로그아웃 / 회원탈퇴 */}
          <div className="mt-6 mb-2 flex items-center justify-center gap-4 text-[12px] text-[#999]">
            <button type="button" className="px-2 py-1 active:text-foreground">
              로그아웃
            </button>
            <span className="h-3 w-px bg-[#e0e0e0]" />
            <button type="button" className="px-2 py-1 active:text-foreground">
              회원탈퇴
            </button>
          </div>
        </div>

        {/* 알림 시간 선택 바텀시트 */}
        {showTimePicker && (
          <div
            className="absolute inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowTimePicker(false)}
          >
            <div
              className="w-full rounded-t-[24px] bg-white px-5 pt-5 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-bold text-foreground text-[17px] tracking-tight">
                  일기 알림 시간
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTimePicker(false)}
                  className="text-[13px] text-[#999]"
                >
                  취소
                </button>
              </div>
              <p className="text-[13px] text-[#aaa] mb-5 tracking-tight">
                매일 이 시간에 알림을 드려요
              </p>

              <input
                ref={timeInputRef}
                type="time"
                defaultValue={notifTime}
                className="w-full rounded-xl border border-[#e8eaed] bg-[#f8f9fb] px-4 py-3.5 text-[16px] text-foreground font-semibold tracking-tight focus:outline-none focus:border-[var(--primary)]"
              />

              <button
                type="button"
                onClick={() => handleTimeSave(timeInputRef.current?.value ?? notifTime)}
                className="mt-4 w-full rounded-2xl py-3.5 font-bold text-white text-[15px] tracking-tight"
                style={{ background: "var(--primary)", touchAction: "manipulation" }}
              >
                저장
              </button>

              {/* 빠른 선택 */}
              <div className="mt-4 flex gap-2 flex-wrap">
                {["08:00", "12:00", "18:00", "21:00", "22:30"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTimeSave(t)}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium tracking-tight border transition ${
                      notifTime === t
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white text-foreground border-[#e8eaed]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <BottomNav active="my" />
      </div>
    </div>
  );
}

function ExchangeLink() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(getMyDiaries().length + getSharedDiaries().length);
  }, []);
  return (
    <section className="px-4 mt-3">
      <p className="px-1 mb-2 text-[12px] text-[#999] tracking-tight">교환 일기</p>
      <Link
        to="/exchange"
        className="flex items-center gap-3 rounded-2xl bg-white border border-[#f0f0f0] px-4 py-3.5 shadow-sm active:bg-[#f8f8f8] transition"
      >
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary)]/10">
          <BookMarked className="h-4.5 w-4.5 text-[var(--primary)]" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground text-[14px] tracking-tight">교환 일기</p>
          <p className="text-[11px] text-[#999] mt-0.5 tracking-tight">
            {count > 0 ? `공유 일기 ${count}개` : "소중한 사람과 감정 나누기"}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-[#bbb]" />
      </Link>
    </section>
  );
}

function Stat({ value, label, divided }: { value: string; label: string; divided?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-2 ${divided ? "border-l border-[#eeeeee]" : ""}`}
    >
      <span className="text-[22px] font-semibold text-foreground tracking-tight leading-none">
        {value}
      </span>
      <span className="mt-1.5 text-[11px] text-[#999] tracking-tight">{label}</span>
    </div>
  );
}

function Row({
  icon,
  label,
  trailing,
  hideChevron,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: string;
  hideChevron?: boolean;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#fafbfc] transition ${last ? "" : "border-b border-[#f5f5f5]"}`}
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f4f6fa] text-[var(--primary)] shrink-0">
        {icon}
      </span>
      <span className="flex-1 text-[14px] text-foreground tracking-tight">{label}</span>
      {trailing && <span className="text-[12.5px] text-[#999]">{trailing}</span>}
      {!hideChevron && <ChevronRight className="h-4 w-4 text-[#cbcbd1]" strokeWidth={2.2} />}
    </button>
  );
}
