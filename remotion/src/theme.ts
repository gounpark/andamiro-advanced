export const COLORS = {
  bg: "#FFFFFF",
  framePad: "#F7F7F9",
  primary: "#3B6FFF",
  primaryLight: "#A6C0FF",
  cloverYellow: "#F5C84A",
  cloverGreen: "#11A757",
  text: "#1F2330",
  subtext: "#8a8d96",
  card: "#FFFFFF",
  divider: "#F0F0F0",
  skyGradient: "linear-gradient(180deg, #3B6FFF 0%, #A6C0FF 100%)",
};

import { loadFont as loadDodum } from "@remotion/google-fonts/GowunDodum";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// GowunDodum의 한글 subset은 chunk 키라서 subsets 옵션 생략 → 전체 로드
export const dodum = loadDodum("normal", { weights: ["400"] });
export const inter = loadInter("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const FF_KO = dodum.fontFamily;
export const FF_LATIN = inter.fontFamily;
