import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";

type AppHeaderProps = {
  title: string;
  backTo: "/my" | "/exchange";
  rightAction?: ReactNode;
};

/** AppHeader — PageHeader 기반으로 동일한 높이/여백 보장 */
export function AppHeader({ title, backTo, rightAction }: AppHeaderProps) {
  return (
    <PageHeader
      className="bg-white"
      title={title}
      left={
        <Link
          to={backTo}
          search={backTo === "/exchange" ? { invite: undefined } : undefined}
          className="grid h-11 w-11 place-items-center active:opacity-60 transition"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-7 w-7 text-[#222]" strokeWidth={2.2} />
        </Link>
      }
      right={rightAction}
    />
  );
}
