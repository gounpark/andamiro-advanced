import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import fortuneCookieClosedPng from "@/assets/report/fortune-cookie-closed.png";
import fortuneCookieCrackedPng from "@/assets/report/fortune-cookie-cracked.png";
import fortuneRaysPng from "@/assets/report/fortune-rays.png";
import fortunePaperPng from "@/assets/report/fortune-paper.png";
import cloverSpecialSvg from "@/assets/icons/clover-special.svg";

interface Props {
  isActive: boolean;
}

type FortuneState = "idle" | "shaking" | "cracked" | "revealed";

export function FortuneScene({ isActive }: Props) {
  const [state, setState] = useState<FortuneState>("idle");

  useEffect(() => {
    if (!isActive) {
      setState("idle");
      return;
    }
    const t1 = setTimeout(() => setState("shaking"), 1500);
    const t2 = setTimeout(() => setState("cracked"), 3000);
    const t3 = setTimeout(() => setState("revealed"), 4200);

    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [isActive]);

  const isDark = state === "revealed";

  return (
    <div
      className="w-full h-full flex flex-col relative overflow-hidden transition-colors duration-700"
      style={{ background: isDark ? "#0d0d0d" : "white" }}
    >
      {/* Status bar */}
      <div
        className="flex items-center justify-between px-5"
        style={{ height: 44, zIndex: 10, position: "relative" }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.7)" : "#222" }}>9:41</span>
      </div>

      {/* Header */}
      {!isDark && (
        <div
          className="flex items-center px-4 pb-3 shrink-0"
          style={{ borderBottom: "1px solid #f0f0f0", zIndex: 10, position: "relative" }}
        >
          <button type="button" style={{ width: 32, height: 32, display: "flex", alignItems: "center" }}>
            <ChevronLeft size={20} color="#444" />
          </button>
          <span
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 16,
              fontWeight: 700,
              color: "#111",
            }}
          >
            포춘쿠키
          </span>
        </div>
      )}

      {/* Rays background (idle/cracked) */}
      {!isDark && (
        <img
          src={fortuneRaysPng}
          alt=""
          className="absolute"
          style={{
            width: "120%",
            left: "-10%",
            top: "20%",
            opacity: state !== "idle" ? 0.3 : 0.15,
            transition: "opacity 0.5s ease",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Dark overlay for revealed */}
      {isDark && (
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 50% 40%, #1a2040 0%, #0d0d0d 70%)",
            zIndex: 1,
          }}
        />
      )}

      {/* Content */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-6 relative"
        style={{ zIndex: 5 }}
      >
        {/* Cookie */}
        {state !== "revealed" && (
          <div
            style={{
              animation:
                state === "shaking"
                  ? "cookieShake 0.15s ease-in-out infinite"
                  : "cookieFloat 2.4s ease-in-out infinite",
            }}
          >
            <img
              src={state === "cracked" ? fortuneCookieCrackedPng : fortuneCookieClosedPng}
              alt="포춘쿠키"
              style={{
                width: 160,
                height: 160,
                objectFit: "contain",
                filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.15))",
                transform: state === "cracked" ? "scale(1.05)" : "scale(1)",
                transition: "transform 0.3s ease",
              }}
            />
          </div>
        )}

        {/* Revealed state */}
        {state === "revealed" && (
          <div
            className="flex flex-col items-center gap-5 px-8"
            style={{
              opacity: 1,
              animation: "fadeIn 0.5s ease",
            }}
          >
            <img src={cloverSpecialSvg} alt="" style={{ width: 48, height: 48 }} />
            <img
              src={fortunePaperPng}
              alt=""
              style={{ width: 200, objectFit: "contain", filter: "drop-shadow(0 4px 20px rgba(255,255,255,0.1))" }}
            />
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "white",
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              오늘의 작은 용기가
              <br />
              내일의 큰 변화를 만듭니다 ✨
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
              #설렘 #성장 #긍정
            </p>
          </div>
        )}

        {/* Label */}
        {state === "idle" && (
          <div className="flex flex-col items-center gap-2">
            <p style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>오늘의 포춘쿠키</p>
            <p style={{ fontSize: 13, color: "#888", textAlign: "center" }}>탭하면 오늘의 행운 메시지가 열립니다</p>
            <div
              className="mt-2 rounded-full px-4 py-2"
              style={{ background: "#4B82F5", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span style={{ fontSize: 13, color: "white", fontWeight: 600 }}>쿠키 열기</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cookieFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes cookieShake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-6deg); }
          40% { transform: rotate(6deg); }
          60% { transform: rotate(-4deg); }
          80% { transform: rotate(4deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
