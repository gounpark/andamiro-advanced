import { useEffect, useState } from "react";
import logoSvg from "@/assets/icons/logo.svg";
import splashWebp from "@/assets/splash.webp";

interface Props {
  isActive: boolean;
}

export function IntroScene({ isActive }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 1200);
    const t3 = setTimeout(() => setStep(3), 2200);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [isActive]);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1a2f6e 0%, #0d1b3e 60%, #0a1428 100%)" }}
    >
      {/* Decorative circles */}
      <div
        className="absolute rounded-full opacity-10"
        style={{
          width: 400,
          height: 400,
          background: "#4B82F5",
          top: -80,
          right: -80,
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute rounded-full opacity-10"
        style={{
          width: 300,
          height: 300,
          background: "#11A858",
          bottom: -60,
          left: -60,
          filter: "blur(50px)",
        }}
      />

      {/* Splash animation image */}
      <div
        className="transition-all duration-700"
        style={{
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? "scale(1) translateY(0)" : "scale(0.85) translateY(20px)",
        }}
      >
        <img
          src={splashWebp}
          alt=""
          className="object-contain"
          style={{ width: 160, height: 160 }}
        />
      </div>

      {/* Logo */}
      <div
        className="mt-5 transition-all duration-700"
        style={{
          opacity: step >= 2 ? 1 : 0,
          transform: step >= 2 ? "translateY(0)" : "translateY(12px)",
          transitionDelay: "100ms",
        }}
      >
        <img src={logoSvg} alt="안다미로" style={{ height: 32, filter: "invert(1) brightness(10)" }} />
      </div>

      {/* Tagline */}
      <div
        className="mt-4 text-center px-8 transition-all duration-700"
        style={{
          opacity: step >= 3 ? 1 : 0,
          transform: step >= 3 ? "translateY(0)" : "translateY(10px)",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 18, fontWeight: 600, lineHeight: 1.5 }}>
          나를 안다, 안다미로
        </p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
          복잡한 감정을 더 분명하게
        </p>
      </div>

      {/* Floating dots */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + i * 2,
            height: 4 + i * 2,
            background: i % 2 === 0 ? "#4B82F5" : "#FFCA2D",
            opacity: step >= 2 ? 0.6 : 0,
            left: `${15 + i * 18}%`,
            bottom: `${15 + i * 8}%`,
            transition: `opacity 0.5s ease ${200 + i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}
