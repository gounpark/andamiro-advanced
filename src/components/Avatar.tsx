import { coverColorForId } from "@/lib/exchangeStore";

interface AvatarProps {
  /** 프로필 이미지 URL (없으면 이니셜 폴백) */
  src?: string;
  /** 표시할 이름 (이니셜 추출에도 사용) */
  name: string;
  /**
   * 배경색 생성에 사용할 ID (없으면 name으로 대체)
   * exchange diary의 userId나 diaryId를 넘기면 일관된 색상이 나옵니다.
   */
  id?: string;
  /** 아바타 크기 (px, 기본 32) */
  size?: number;
  /** 추가 className */
  className?: string;
  /** 보더 (기본 2px white) */
  bordered?: boolean;
}

/**
 * 공통 아바타 컴포넌트
 * - src가 있으면 이미지, 없으면 이니셜 + 색상 원
 * - coverColorForId로 id/name 기반 일관된 색상 생성
 *
 * ```tsx
 * <Avatar src={user.avatar} name={user.name} id={user.id} size={40} />
 * ```
 */
export function Avatar({
  src,
  name,
  id,
  size = 32,
  className = "",
  bordered = false,
}: AvatarProps) {
  const color = coverColorForId(id ?? name);
  const fontSize = Math.max(9, Math.floor(size * 0.4));
  const borderStyle = bordered
    ? { border: "2px solid white" }
    : undefined;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size, ...borderStyle }}
      />
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${className}`}
      style={{ width: size, height: size, background: color, fontSize, ...borderStyle }}
      aria-label={name}
    >
      {name.charAt(0)}
    </div>
  );
}
