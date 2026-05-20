import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  /** 아이콘 색상 (기본 #222) */
  color?: string;
  "aria-label"?: string;
}

/**
 * 공통 뒤로가기 버튼 (PageHeader left 슬롯에 사용)
 *
 * ```tsx
 * <PageHeader
 *   title="설정"
 *   left={<BackButton onClick={() => navigate({ to: "/my" })} />}
 * />
 * ```
 */
export function BackButton({
  onClick,
  color = "#222",
  "aria-label": ariaLabel = "뒤로가기",
}: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="grid h-11 w-11 place-items-center rounded-full active:opacity-60 transition"
    >
      <ChevronLeft className="h-7 w-7" style={{ color }} strokeWidth={2.2} />
    </button>
  );
}
