import { Link } from "@tanstack/react-router";
import emptyCloud from "@/assets/empty-cloud.webp";

interface EmptyStateAction {
  label: string;
  /** TanStack Router의 to 경로 */
  to: string;
}

interface EmptyStateProps {
  /** 큰 타이틀 (기본: 당신의 하루를 들려주길 기다리고 있어요!) */
  title?: string;
  /** 설명 텍스트 */
  description?: string;
  /** 액션 버튼 */
  action?: EmptyStateAction;
  /** 커스텀 이미지 src (기본: empty-cloud) */
  image?: string;
  /** 이미지 크기 px (기본 200) */
  imageSize?: number;
}

/**
 * 공통 빈 상태 컴포넌트 — 데이터가 없을 때 중앙에 표시
 *
 * ```tsx
 * // flex-1 스크롤 영역 안에 넣어서 사용
 * <div className="flex-1 overflow-y-auto">
 *   <EmptyState
 *     title="아직 일기가 없어요"
 *     description="첫 일기를 써보세요."
 *     action={{ label: "일기 쓰기", to: "/record" }}
 *   />
 * </div>
 * ```
 */
export function EmptyState({
  title = "당신의 하루를 들려주길\n기다리고 있어요!",
  description = "작은 기록이 모여 당신의 마음 지도가 완성돼요.",
  action,
  image = emptyCloud,
  imageSize = 200,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-12">
      <img
        src={image}
        alt=""
        aria-hidden
        loading="eager"
        decoding="async"
        style={{ width: imageSize, height: imageSize }}
        className="object-contain"
      />

      {title && (
        <h2 className="mt-6 whitespace-pre-line text-center font-bold text-foreground text-[20px] leading-[1.4] tracking-tight">
          {title}
        </h2>
      )}

      {description && (
        <p className="mt-3 text-center text-[13px] text-[#8a8d96] tracking-tight leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <Link
          to={action.to as "/"}
          search={{} as never}
          className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#ececef] px-6 py-3 font-semibold text-foreground text-[14px] tracking-tight hover:bg-[#e2e2e6] transition active:scale-[0.98]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
