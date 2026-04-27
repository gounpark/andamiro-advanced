import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../theme";

export const Frame: React.FC<{ children: React.ReactNode; bg?: string }> = ({
  children,
  bg = COLORS.bg,
}) => {
  return (
    <AbsoluteFill style={{ background: COLORS.framePad }}>
      <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
