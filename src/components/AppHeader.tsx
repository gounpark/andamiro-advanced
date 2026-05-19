import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

type AppHeaderProps = {
  title: string;
  backTo: "/my" | "/exchange";
  rightAction?: ReactNode;
};

export function AppHeader({ title, backTo, rightAction }: AppHeaderProps) {
  return (
    <header className="relative shrink-0 bg-white" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
      <div className="relative flex h-[68px] items-center px-[10px]">
        <Link
          to={backTo}
          search={backTo === "/exchange" ? { invite: undefined } : undefined}
          className="grid h-11 w-11 place-items-center active:opacity-60 transition"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-7 w-7 text-[#222]" strokeWidth={2.2} />
        </Link>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[18px] font-semibold text-[#222] tracking-tight">
          {title}
        </h1>
        {rightAction && (
          <div className="absolute right-[10px] top-1/2 -translate-y-1/2">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}
