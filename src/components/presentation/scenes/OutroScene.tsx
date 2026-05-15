import { useEffect, useState } from "react";
import logoSvg from "@/assets/icons/logo.svg";
import cloverSpecialSvg from "@/assets/icons/clover-special.svg";

interface Props {
  isActive: boolean;
}

export function OutroScene({ isActive }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1000);
    const t3 = setTimeout(() => setStep(3), 2000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [isActive]);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1a2f6e 0%, #0d1b3e 100%)" }}
    >
      {/* Glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: 350,
          height: 350,
          background: "radial-gradient(circle, rgba(75,130,245,0.3) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Clover icon */}
      <div
        className="transition-all duration-700"
        style={{
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? "scale(1)" : "scale(0.6)",
        }}
      >
        <img src={cloverSpecialSvg} alt="" style={{ width: 64, height: 64 }} />
      </div>

      {/* Logo */}
      <div
        className="mt-6 transition-all duration-700"
        style={{
          opacity: step >= 2 ? 1 : 0,
          transform: step >= 2 ? "translateY(0)" : "translateY(10px)",
        }}
      >
        <img
          src={logoSvg}
          alt="안다미로"
          style={{ height: 28, filter: "invert(1) brightness(10)" }}
        />
      </div>

      {/* Message */}
      <div
        className="mt-5 text-center px-10 transition-all duration-700"
        style={{
          opacity: step >= 3 ? 1 : 0,
          transform: step >= 3 ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <p
          style={{ color: "rgba(255,255,255,0.9)", fontSize: 20, fontWeight: 700, lineHeight: 1.5 }}
        >
          안다미로와 함께
        </p>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, marginTop: 8, lineHeight: 1.7 }}>
          나를 더 분명하게 이해해보세요
        </p>
        <div
          className="mx-auto mt-6 rounded-full px-5 py-2.5"
          style={{
            background: "rgba(75,130,245,0.25)",
            border: "1px solid rgba(75,130,245,0.4)",
            display: "inline-block",
          }}
        >
          <p style={{ color: "#7BA7FF", fontSize: 12, fontWeight: 500 }}>
            복잡해도 괜찮아, 길은 있어 :)
          </p>
        </div>
      </div>
    </div>
  );
}
