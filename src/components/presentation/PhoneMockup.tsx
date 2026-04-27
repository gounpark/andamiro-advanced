import { useEffect, useRef, useState } from "react";

interface PhoneMockupProps {
  children: React.ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    if (!screenRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      if (h > 0) setScale(h / 844);
    });
    obs.observe(screenRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="h-full flex items-center justify-center py-3">
      <div
        className="relative shrink-0"
        style={{
          height: "100%",
          maxHeight: 680,
          aspectRatio: "390/844",
        }}
      >
        {/* Outer frame */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: 44,
            background: "#1C1C1E",
            boxShadow:
              "0 0 0 1.5px #3a3a3c, 0 30px 80px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.25)",
          }}
        />
        {/* Side buttons */}
        <div
          className="absolute"
          style={{
            left: -3,
            top: "18%",
            width: 3,
            height: 28,
            background: "#3a3a3c",
            borderRadius: "3px 0 0 3px",
          }}
        />
        <div
          className="absolute"
          style={{
            left: -3,
            top: "26%",
            width: 3,
            height: 40,
            background: "#3a3a3c",
            borderRadius: "3px 0 0 3px",
          }}
        />
        <div
          className="absolute"
          style={{
            left: -3,
            top: "33%",
            width: 3,
            height: 40,
            background: "#3a3a3c",
            borderRadius: "3px 0 0 3px",
          }}
        />
        <div
          className="absolute"
          style={{
            right: -3,
            top: "22%",
            width: 3,
            height: 60,
            background: "#3a3a3c",
            borderRadius: "0 3px 3px 0",
          }}
        />

        {/* Screen area */}
        <div
          ref={screenRef}
          className="absolute overflow-hidden bg-white"
          style={{
            inset: 7,
            borderRadius: 38,
          }}
        >
          {/* Scaled scene content */}
          <div
            style={{
              position: "relative",
              width: 390,
              height: 844,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              flexShrink: 0,
            }}
          >
            {children}
          </div>
        </div>

        {/* Dynamic island / notch */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: 10,
            width: "32%",
            height: 22,
            background: "#1C1C1E",
            borderRadius: 12,
            zIndex: 10,
          }}
        />

        {/* Home indicator */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: 10,
            width: "28%",
            height: 4,
            background: "rgba(255,255,255,0.35)",
            borderRadius: 3,
            zIndex: 10,
          }}
        />
      </div>
    </div>
  );
}
