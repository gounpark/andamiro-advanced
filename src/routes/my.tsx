import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Bell, Moon, Clock, Database, Megaphone, HelpCircle, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import cloverActiveSvg from "@/assets/icons/clover-active.svg";
import bgShapeLargeSvg from "@/assets/icons/bg-shape-large.svg";
import { BottomNav } from "@/components/BottomNav";
import bgShapeSmallSvg from "@/assets/icons/bg-shape-small.svg";

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
  const [notif, setNotif] = useState(true);
  const [dark, setDark] = useState(false);

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col" style={{ background: "#f5f6f8" }}>
        <div className="absolute inset-0 overflow-y-auto pb-[126px]">
          {/* 그라데이션 헤더 */}
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
                <p className="text-[12px] text-[#999] truncate">someone@email.com</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full bg-[#f4f6fa] px-3 py-1.5 text-[12px] font-medium text-[var(--primary)] active:scale-[0.97] transition"
              >
                프로필 편집
              </button>
            </div>
          </div>

          {/* 통계 */}
          <section className="px-4 mt-4">
            <p className="px-1 mb-2 text-[12px] text-[#999] tracking-tight">나의 기록 요약</p>
            <div className="rounded-2xl bg-white p-3 shadow-sm grid grid-cols-3">
              <Stat value="12" label="작성한 일기" />
              <Stat value="5" label="연속 기록" divided />
              <Stat value="3" label="이번 달" divided />
            </div>
          </section>

          {/* 설정 */}
          <section className="px-4 mt-5">
            <p className="px-1 mb-2 text-[12px] text-[#999] tracking-tight">설정</p>
            <div className="rounded-2xl bg-white border border-[#f0f0f0] overflow-hidden">
              <RowToggle icon={<Bell className="h-4 w-4" />} label="알림 설정" checked={notif} onChange={setNotif} />
              <RowToggle icon={<Moon className="h-4 w-4" />} label="다크 모드" checked={dark} onChange={setDark} />
              <Row icon={<Clock className="h-4 w-4" />} label="일기 알림 시간" trailing="21:00" />
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
              <Row icon={<FileText className="h-4 w-4" />} label="앱 버전" trailing="v0.1.0" hideChevron last />
            </div>
          </section>

          {/* 로그아웃 / 회원탈퇴 */}
          <div className="mt-6 mb-2 flex items-center justify-center gap-4 text-[12px] text-[#999]">
            <button type="button" className="px-2 py-1 active:text-foreground">로그아웃</button>
            <span className="h-3 w-px bg-[#e0e0e0]" />
            <button type="button" className="px-2 py-1 active:text-foreground">회원탈퇴</button>
          </div>
        </div>

        {/* 하단 탭 */}
        <BottomNav active="my" />
      </div>
    </div>
  );
}

function Stat({ value, label, divided }: { value: string; label: string; divided?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-2 ${
        divided ? "border-l border-[#eeeeee]" : ""
      }`}
    >
      <span className="text-[22px] font-semibold text-foreground tracking-tight leading-none">{value}</span>
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
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#fafbfc] transition ${
        last ? "" : "border-b border-[#f5f5f5]"
      }`}
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

function RowToggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#f5f5f5]">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f4f6fa] text-[var(--primary)] shrink-0">
        {icon}
      </span>
      <span className="flex-1 text-[14px] text-foreground tracking-tight">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

