import { Link } from "@tanstack/react-router";
import tabHome from "@/assets/icons/tab-home.svg";
import tabHomeActive from "@/assets/icons/tab-home-active.svg";
import tabReport from "@/assets/icons/tab-report.svg";
import tabReportActive from "@/assets/icons/tab-report-active.svg";
import tabAdvice from "@/assets/icons/tab-advice.svg";
import tabAdviceActive from "@/assets/icons/tab-advice-active.svg";
import tabMy from "@/assets/icons/tab-my.svg";
import tabMyActive from "@/assets/icons/tab-my-active.svg";

type Tab = "home" | "report" | "advice" | "my";

export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav
      aria-label="하단 내비게이션"
      className="absolute bottom-0 left-0 right-0 z-20 flex min-h-[96px] w-full items-center justify-around bg-white px-6 pt-4 pb-9 shadow-[0_-2px_8px_0_rgba(221,221,221,0.25)]"
    >
      <NavItem
        to="/"
        label="홈"
        active={active === "home"}
        activeIcon={<img src={tabHomeActive} alt="" className="h-[26px] w-[26px]" />}
        inactiveIcon={<img src={tabHome} alt="" className="h-[26px] w-[26px]" />}
      />
      <NavItem
        to="/report"
        label="리포트"
        active={active === "report"}
        activeIcon={<img src={tabReportActive} alt="" className="h-[26px] w-[26px]" />}
        inactiveIcon={<img src={tabReport} alt="" className="h-[26px] w-[26px]" />}
      />
      <NavItem
        to="/advice"
        label="조언"
        active={active === "advice"}
        activeIcon={<img src={tabAdviceActive} alt="" className="h-[26px] w-[26px]" />}
        inactiveIcon={<img src={tabAdvice} alt="" className="h-[26px] w-[26px]" />}
      />
      <NavItem
        to="/my"
        label="마이"
        active={active === "my"}
        activeIcon={<img src={tabMyActive} alt="" className="h-[26px] w-[26px]" />}
        inactiveIcon={<img src={tabMy} alt="" className="h-[26px] w-[26px]" />}
      />
    </nav>
  );
}

function NavItem({
  to,
  label,
  active,
  activeIcon,
  inactiveIcon,
}: {
  to: "/" | "/report" | "/advice" | "/my";
  label: string;
  active: boolean;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
}) {
  const color = active ? "text-[var(--primary)]" : "text-[#b1b1b1]";
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1.5 ${color} transition-colors`}
    >
      {active ? activeIcon : inactiveIcon}
      <span className="text-[11px] font-medium tracking-tight">{label}</span>
    </Link>
  );
}