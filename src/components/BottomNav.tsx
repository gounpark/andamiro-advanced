import { Link } from "@tanstack/react-router";
import tabHome from "@/assets/icons/tab-home.svg";
import tabHomeActive from "@/assets/icons/tab-home-active.svg";
import tabReport from "@/assets/icons/tab-report.svg";
import tabReportActive from "@/assets/icons/tab-report-active.svg";
import tabAdvice from "@/assets/icons/tab-advice.svg";
import tabAdviceActive from "@/assets/icons/tab-advice-active.svg";
import tabMy from "@/assets/icons/tab-my.svg";
import tabMyActive from "@/assets/icons/tab-my-active.svg";

export type BottomNavTab = "home" | "report" | "advice" | "my";

const TABS = [
  { key: "home",   to: "/",        label: "홈",     active: tabHomeActive,   inactive: tabHome },
  { key: "report", to: "/report",  label: "리포트",  active: tabReportActive, inactive: tabReport, id: "nav-tab-report" },
  { key: "advice", to: "/advice",  label: "조언",    active: tabAdviceActive, inactive: tabAdvice, id: "nav-tab-advice" },
  { key: "my",     to: "/my",      label: "마이",    active: tabMyActive,     inactive: tabMy },
] as const;

/**
 * 메인 탭 하단 내비게이션
 *
 * ```tsx
 * <BottomNav active="home" />
 * ```
 */
export function BottomNav({ active }: { active: BottomNavTab }) {
  return (
    <nav
      aria-label="하단 내비게이션"
      className="shrink-0 z-20 flex min-h-[96px] w-full items-center justify-around bg-white px-6 pt-4 pb-9 shadow-[0_-2px_8px_0_rgba(221,221,221,0.25)]"
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            to={tab.to}
            id={"id" in tab ? tab.id : undefined}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center gap-1.5 transition-colors ${isActive ? "text-[var(--primary)]" : "text-[#b1b1b1]"}`}
          >
            <img
              src={isActive ? tab.active : tab.inactive}
              alt=""
              aria-hidden
              className="h-[26px] w-[26px]"
            />
            <span className="text-[11px] font-medium tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
