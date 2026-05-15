import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import emptyCloud from "@/assets/empty-cloud.webp";
import { BottomNav } from "@/components/BottomNav";

type Props = {
  /** 헤더 타이틀 */
  title: string;
  /** 활성 탭 */
  activeTab: "home" | "report" | "advice" | "my";
};

export function EmptyDiaryState({ title, activeTab }: Props) {
  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col">
        {/* 헤더 */}
        <header className="relative flex items-center justify-center px-4 pt-6 pb-3">
          <Link
            to="/"
            aria-label="뒤로"
            className="absolute left-3 top-5 grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:text-foreground"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
          </Link>
          <h1 className="font-semibold text-foreground text-[16px] tracking-tight">{title}</h1>
        </header>

        {/* 본문 */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32 -mt-4">
          <img
            src={emptyCloud}
            alt=""
            aria-hidden
            loading="eager"
            decoding="async"
            fetchPriority="high"
            width={360}
            height={272}
            className="h-[220px] w-[220px] object-contain"
          />
          <h2 className="mt-6 text-center font-bold text-foreground text-[20px] leading-[1.4] tracking-tight">
            당신의 하루를 들려주길
            <br />
            기다리고 있어요!
          </h2>
          <p className="mt-3 text-center text-[13px] text-[#8a8d96] tracking-tight">
            작은 기록이 모여 당신의 마음 지도가 완성돼요.
          </p>
          <Link
            to="/record"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#ececef] px-5 py-3 font-semibold text-foreground text-[14px] tracking-tight hover:bg-[#e2e2e6] transition"
          >
            일기쓰러 가기
          </Link>
        </div>

        {/* 하단 탭 */}
        <BottomNav active={activeTab} />
      </div>
    </div>
  );
}
