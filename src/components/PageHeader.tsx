import type { ReactNode } from "react";

const HEADER_STYLE = {
  paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
} as const;

interface PageHeaderProps {
  /** 가운데 타이틀 */
  title?: ReactNode;
  /** 왼쪽 슬롯 — BackButton 등 */
  left?: ReactNode;
  /** 오른쪽 슬롯 — 완료·메뉴 버튼 등 */
  right?: ReactNode;
  /** 헤더 배경 (기본 bg-white) */
  className?: string;
  /** 타이틀 색상 클래스 (기본 text-foreground) */
  titleColor?: string;
  /** 하단 구분선 표시 여부 */
  border?: boolean;
}

/**
 * 앱 전체 공통 페이지 헤더
 *
 * - 상단 여백: `calc(safe-area-inset-top + 8px)` — iOS 노치·Dynamic Island 대응
 * - 콘텐츠 높이: 68px 고정
 * - 타이틀: 16px / SemiBold
 *
 * ```tsx
 * <PageHeader
 *   title="교환일기"
 *   left={<BackButton onClick={() => navigate({ to: "/" })} />}
 *   right={<button>완료</button>}
 * />
 * ```
 */
export function PageHeader({
  title,
  left,
  right,
  className = "bg-white",
  titleColor = "text-foreground",
  border = false,
}: PageHeaderProps) {
  return (
    <header
      className={`relative shrink-0 ${className} ${border ? "border-b border-[var(--border,#E1E8F0)]" : ""}`}
      style={HEADER_STYLE}
    >
      <div className="relative flex h-[68px] items-center justify-center px-3">
        {left && (
          <div className="absolute left-3 flex items-center">{left}</div>
        )}
        {title && (
          <span
            className={`font-semibold ${titleColor} text-[16px] tracking-tight`}
          >
            {title}
          </span>
        )}
        {right && (
          <div className="absolute right-3 flex items-center">{right}</div>
        )}
      </div>
    </header>
  );
}
