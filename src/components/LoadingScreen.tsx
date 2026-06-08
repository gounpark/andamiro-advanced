import { PageShell } from "@/components/PageShell";

interface LoadingScreenProps {
  /** 로딩 메시지 (기본 "불러오는 중...") */
  message?: string;
  /** app-frame 배경색 */
  bg?: string;
}

/**
 * 전체 화면 로딩 상태
 *
 * ```tsx
 * if (loading) return <LoadingScreen />;
 * ```
 */
export function LoadingScreen({
  message = "불러오는 중...",
  bg = "#f5f6f8",
}: LoadingScreenProps) {
  return (
    <PageShell bg={bg} className="items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        {/* 스피너 */}
        <div
          className="h-7 w-7 rounded-full border-[3px] border-[#ddd] animate-spin"
          style={{ borderTopColor: "var(--primary, #4B82F5)" }}
        />
        <p className="text-[14px] text-[#aaa]">{message}</p>
      </div>
    </PageShell>
  );
}
