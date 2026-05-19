import type { ReactNode } from "react";

const HEADER_STYLE = {
  paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
} as const;

type PageHeaderProps = {
  /** 가운데 타이틀 (없으면 생략) */
  title?: ReactNode;
  /** 왼쪽 버튼 (뒤로가기 등) */
  left?: ReactNode;
  /** 오른쪽 버튼 (삭제, 완료 등) */
  right?: ReactNode;
  /** 헤더 배경 클래스 (기본 bg-white) */
  className?: string;
};

/**
 * 앱 전체 공통 페이지 헤더
 * - 상단 여백: calc(safe-area-inset-top + 16px) — 웹/모바일 통일
 * - 콘텐츠 영역 높이: 68px 고정
 */
export function PageHeader({ title, left, right, className = "bg-white" }: PageHeaderProps) {
  return (
    <header className={`relative shrink-0 ${className}`} style={HEADER_STYLE}>
      <div className="relative flex h-[68px] items-center justify-center px-3">
        {left && <div className="absolute left-3 flex items-center">{left}</div>}
        {title && (
          <span className="font-semibold text-foreground text-[16px] tracking-tight">
            {title}
          </span>
        )}
        {right && <div className="absolute right-3 flex items-center">{right}</div>}
      </div>
    </header>
  );
}
