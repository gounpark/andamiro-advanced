import type { ReactNode } from "react";

/* ── BottomSheet ─────────────────────────────────────────────────────────────
 * app-frame 위에 렌더링되는 공통 바텀시트 컨테이너
 *
 * ```tsx
 * <BottomSheet open={open} onClose={() => setOpen(false)} title="제목">
 *   <SheetItem icon={<Share2 />} label="공유하기" onClick={handleShare} />
 *   <SheetItem icon={<Trash2 />} label="삭제하기" danger onClick={handleDelete} />
 * </BottomSheet>
 * ```
 * ─────────────────────────────────────────────────────────────────────────── */

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** 시트 상단 타이틀 */
  title?: ReactNode;
  /** 타이틀 아래 서브텍스트 */
  subtitle?: string;
  children: ReactNode;
  /** 오버레이 z-index (기본 50) */
  zIndex?: number;
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  zIndex = 50,
}: BottomSheetProps) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 flex items-end"
      style={{ zIndex, background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-[24px] bg-white px-5 pt-5"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className="mb-[14px] px-1">
            {title && (
              <h3 className="font-bold text-[#454545] text-[18px] truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[14px] text-[#999]">{subtitle}</p>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2">{children}</div>
      </div>
    </div>
  );
}

/* ── SheetItem ───────────────────────────────────────────────────────────────
 * BottomSheet 안의 개별 메뉴 아이템
 * ─────────────────────────────────────────────────────────────────────────── */

interface SheetItemProps {
  /** 왼쪽 아이콘 (Lucide 컴포넌트 권장, size=16) */
  icon: ReactNode;
  label: string;
  description?: string;
  /** 빨간색 위험 스타일 */
  danger?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function SheetItem({
  icon,
  label,
  description,
  danger = false,
  onClick,
  disabled = false,
}: SheetItemProps) {
  const rich = !!description; // description 있을 때 → 큰 아이콘 스타일 (42px)

  const bg        = danger ? "bg-[#fff8f9] active:bg-red-100" : "bg-[#f8f9fb] active:bg-[#f0f2f6]";
  const iconBg    = danger ? "bg-[#ffe1e2]" : "bg-[#ecf3fe]";
  const iconColor = danger ? "text-red-400" : "text-[var(--primary)]";
  const textColor = danger ? "text-[#ff5461]" : "text-[#454545]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-[10px] rounded-[20px] px-[14px] py-[16px] text-left transition active:scale-[0.99] disabled:opacity-40 ${bg}`}
    >
      {/* 아이콘 컨테이너: description 있으면 42px, 없으면 30px */}
      <div
        className={`grid shrink-0 place-items-center rounded-full ${iconBg} ${
          rich ? "size-[42px]" : "size-[30px]"
        }`}
      >
        <span
          className={`flex items-center justify-center ${iconColor} ${
            rich ? "[&>svg]:h-[19px] [&>svg]:w-[19px]" : "[&>svg]:h-4 [&>svg]:w-4"
          }`}
        >
          {icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`${textColor} ${
            rich ? "text-[16px] font-semibold" : "text-[14px] font-medium"
          }`}
        >
          {label}
        </p>
        {description && (
          <p className={`text-[14px] mt-[2px] ${danger ? "text-red-300" : "text-[#666]"}`}>
            {description}
          </p>
        )}
      </div>
    </button>
  );
}
