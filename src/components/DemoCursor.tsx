import cursor3d from "@/assets/icons/cursor-3d.png";

interface DemoCursorProps {
  x: number;
  y: number;
  tapping?: boolean;
  visible?: boolean;
}

/** 데모 모드에서 클릭 위치를 시각적으로 표시하는 3D 블루 커서 */
export function DemoCursor({ x, y, tapping = false, visible = true }: DemoCursorProps) {
  if (!visible) return null;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: x - 10,
        top: y - 8,
        zIndex: 9999,
        pointerEvents: "none",
        width: 44,
        height: 44,
        userSelect: "none",
        transition:
          "left 0.45s cubic-bezier(0.4,0,0.2,1), top 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.12s ease, opacity 0.3s",
        transform: tapping ? "scale(0.72)" : "scale(1)",
        opacity: 1,
        filter: "drop-shadow(0 4px 10px rgba(0,80,200,0.4))",
      }}
    >
      <img
        src={cursor3d}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
