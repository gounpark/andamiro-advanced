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

            {/* ── Status bar overlay ── */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 44,
                zIndex: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                background: "white",
                pointerEvents: "none",
              }}
            >
              {/* Time */}
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1C1C1E",
                  letterSpacing: "-0.4px",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                9:41
              </span>
              {/* Icons */}
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {/* Signal */}
                <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
                  <rect x="0" y="7" width="3" height="5" rx="0.8" fill="#1C1C1E" />
                  <rect x="4.5" y="5" width="3" height="7" rx="0.8" fill="#1C1C1E" />
                  <rect x="9" y="3" width="3" height="9" rx="0.8" fill="#1C1C1E" />
                  <rect x="13.5" y="0" width="3" height="12" rx="0.8" fill="#1C1C1E" />
                </svg>
                {/* Wifi */}
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <path d="M8 9.5a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" fill="#1C1C1E" />
                  <path d="M4.5 7C5.7 5.8 7 5.2 8 5.2s2.3.6 3.5 1.8" stroke="#1C1C1E" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                  <path d="M1.5 4.2C3.3 2.4 5.5 1.4 8 1.4s4.7 1 6.5 2.8" stroke="#1C1C1E" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                </svg>
                {/* Battery */}
                <div style={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <div
                    style={{
                      width: 25,
                      height: 12,
                      borderRadius: 3,
                      border: "1.5px solid #1C1C1E",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: "1.5px",
                        width: "80%",
                        background: "#1C1C1E",
                        borderRadius: 1.5,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 2,
                      height: 5,
                      background: "#1C1C1E",
                      borderRadius: "0 1px 1px 0",
                      opacity: 0.5,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── Home indicator overlay ── */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 34,
                zIndex: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 134,
                  height: 5,
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 3,
                }}
              />
            </div>
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
      </div>
    </div>
  );
}
