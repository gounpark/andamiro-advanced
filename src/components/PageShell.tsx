import type { CSSProperties, ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  /** app-frame 배경색 (기본 white) */
  bg?: string;
  /** app-frame 추가 style */
  style?: CSSProperties;
  /** app-frame 추가 className */
  className?: string;
}

/**
 * 모든 앱 화면을 감싸는 공통 셸
 *
 * ```tsx
 * <PageShell>
 *   <PageHeader ... />
 *   <div className="flex-1 overflow-y-auto">...</div>
 * </PageShell>
 * ```
 */
export function PageShell({ children, bg = "white", style, className = "" }: PageShellProps) {
  return (
    <div className="app-shell">
      <div
        className={`app-frame flex flex-col ${className}`}
        style={{ background: bg, ...style }}
      >
        {children}
      </div>
    </div>
  );
}
