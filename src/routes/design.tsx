import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Home, BookOpen, ArrowLeftRight, User, Bell, ChevronLeft, ChevronRight,
  Send, MoreHorizontal, Eye, MessageCircle, Lock, Copy, Check, Trash2,
  Search, Settings, Heart, Star, Plus, X, ArrowLeft, Share2, Download,
  AlertCircle, Info, Loader2, Camera, Image, Mic, Edit3, RefreshCw,
  LogOut, Shield, HelpCircle, Moon, Sun, Zap, Filter, MoreVertical,
} from "lucide-react";

export const Route = createFileRoute("/design")({
  head: () => ({ meta: [{ title: "안다미로 디자인 시스템" }] }),
  component: DesignPage,
});

/* ─────────────────────────────────────────────────────────────
   WCAG 대비율
   ───────────────────────────────────────────────────────────── */
function luminance(hex: string) {
  const n = (s: string) => parseInt(s, 16) / 255;
  const lin = (v: number) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const r = lin(n(hex.slice(1, 3)));
  const g = lin(n(hex.slice(3, 5)));
  const b = lin(n(hex.slice(5, 7)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [L1, L2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return +((L1 + 0.05) / (L2 + 0.05)).toFixed(2);
}
function wcagLevel(ratio: number, large = false) {
  if (large) return ratio >= 3 ? (ratio >= 4.5 ? "AAA" : "AA") : "Fail";
  return ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA Large" : "Fail";
}
function isLight(hex: string) { return luminance(hex) > 0.35; }

/* ─────────────────────────────────────────────────────────────
   hex ↔ oklch
   ───────────────────────────────────────────────────────────── */
function hexToOklch(hex: string): [number, number, number] {
  const lin = (v: number) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const r = lin(parseInt(hex.slice(1, 3), 16) / 255);
  const g = lin(parseInt(hex.slice(3, 5), 16) / 255);
  const b = lin(parseInt(hex.slice(5, 7), 16) / 255);
  const l_ = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3);
  const m_ = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3);
  const s_ = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.004072047 * s_;
  const a = 1.977998495 * l_ - 2.428592205 * m_ + 0.450593710 * s_;
  const bv = 0.025904037 * l_ + 0.782771766 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(a * a + bv * bv);
  const H = ((Math.atan2(bv, a) * 180) / Math.PI + 360) % 360;
  return [+L.toFixed(3), +C.toFixed(3), +H.toFixed(1)];
}

/* ─────────────────────────────────────────────────────────────
   토큰 정의 (oklch → hex 직접 계산)
   ───────────────────────────────────────────────────────────── */
interface ColorToken {
  key: string; label: string; hex: string;
  oklch: string; description: string; usage: string[];
  group: "brand" | "semantic" | "neutral" | "chart";
}

const COLORS: ColorToken[] = [
  /* ── 브랜드 ── */
  {
    key: "primary", label: "Primary", hex: "#4B82F5",
    oklch: "oklch(0.624 0.197 263.5)",
    description: "브랜드 핵심 색상. 모든 주요 인터랙션에 사용됩니다.",
    usage: ["index", "record", "analysis", "diary", "chat", "advice", "exchange", "exchange.create", "exchange.$roomId", "fortune", "login", "my", "video-record", "BottomNav", "BottomSheet", "Splash"],
    group: "brand",
  },
  {
    key: "primary-foreground", label: "Primary Foreground", hex: "#F8FAFF",
    oklch: "oklch(0.984 0.003 247.858)",
    description: "Primary 배경 위 텍스트. 버튼 안의 흰 글자색입니다.",
    usage: ["__root"],
    group: "brand",
  },
  {
    key: "primary-light", label: "Primary Light", hex: "#A4C1FA",
    oklch: "oklch(0.81 0.087 263.5)",
    description: "Primary의 밝은 변형. 배경 강조·그라디언트 끝색에 사용됩니다.",
    usage: [],
    group: "brand",
  },
  {
    key: "brand-clover-active", label: "Clover Active", hex: "#F9B602",
    oklch: "oklch(0.83 0.17 84)",
    description: "채워진 클로버 리프. 기록이 있는 날짜에 사용됩니다.",
    usage: ["index", "my", "HomeScene", "FortuneScene", "OutroScene"],
    group: "brand",
  },
  {
    key: "brand-clover-special", label: "Clover Special", hex: "#009A51",
    oklch: "oklch(0.62 0.17 155)",
    description: "오늘 날짜 클로버. 현재 날짜를 가장 강하게 강조합니다.",
    usage: ["index", "my", "HomeScene", "FortuneScene", "OutroScene"],
    group: "brand",
  },
  {
    key: "brand-clover-empty", label: "Clover Empty", hex: "#E9EBEE",
    oklch: "oklch(0.94 0.005 250)",
    description: "기록 없는 날짜의 빈 클로버 및 앱 외부 배경.",
    usage: ["index", "my", "HomeScene", "FortuneScene", "OutroScene"],
    group: "brand",
  },
  {
    key: "brand-day-muted", label: "Day Muted", hex: "#8B95AC",
    oklch: "oklch(0.66 0.015 270)",
    description: "달력 미래 날짜 숫자 색상. 아직 도래하지 않은 날짜를 흐리게 표현합니다.",
    usage: ["index"],
    group: "brand",
  },

  /* ── 시맨틱 ── */
  {
    key: "destructive", label: "Destructive", hex: "#E7000B",
    oklch: "oklch(0.577 0.245 27.325)",
    description: "위험·삭제·오류 전용 색상. 남용하지 않습니다.",
    usage: ["__root"],
    group: "semantic",
  },

  /* ── 뉴트럴 ── */
  {
    key: "foreground", label: "Foreground", hex: "#020618",
    oklch: "oklch(0.129 0.042 264.695)",
    description: "기본 텍스트 색상. 최고 대비율로 가독성을 보장합니다.",
    usage: ["index", "record", "analysis", "diary", "chat", "advice", "exchange", "exchange.$roomId", "fortune", "login", "my", "report", "backup", "PageHeader", "EmptyState", "EmptyDiaryState"],
    group: "neutral",
  },
  {
    key: "muted-foreground", label: "Muted Foreground", hex: "#62748E",
    oklch: "oklch(0.554 0.046 257.417)",
    description: "보조 텍스트. 메타 정보·설명·플레이스홀더에 사용됩니다.",
    usage: ["index", "__root"],
    group: "neutral",
  },
  {
    key: "background", label: "Background", hex: "#FFFFFF",
    oklch: "oklch(1 0 0)",
    description: "앱 전체 기본 배경색. 카드·모달·시트에도 사용됩니다.",
    usage: ["__root", "ui/switch"],
    group: "neutral",
  },
  {
    key: "card", label: "Card", hex: "#FFFFFF",
    oklch: "oklch(1 0 0)",
    description: "카드 컴포넌트 배경. Background와 동일하나 컴포넌트 의미론적 구분용.",
    usage: [],
    group: "neutral",
  },
  {
    key: "secondary", label: "Secondary", hex: "#F1F3F9",
    oklch: "oklch(0.968 0.007 247.896)",
    description: "보조 버튼·배경. 살짝 파란기가 도는 밝은 회색입니다.",
    usage: [],
    group: "neutral",
  },
  {
    key: "muted", label: "Muted Surface", hex: "#F1F3F9",
    oklch: "oklch(0.968 0.007 247.896)",
    description: "흐린 배경 표면. 코드 블록·비활성 영역·에러 페이지 배경에 사용됩니다.",
    usage: ["router"],
    group: "neutral",
  },
  {
    key: "accent", label: "Accent", hex: "#F1F3F9",
    oklch: "oklch(0.968 0.007 247.896)",
    description: "hover 상태 배경. 버튼·리스트 항목의 인터랙티브 hover 표면입니다.",
    usage: ["router"],
    group: "neutral",
  },
  {
    key: "input", label: "Input", hex: "#E1E8F0",
    oklch: "oklch(0.929 0.013 255.508)",
    description: "입력 필드 테두리 색상. Border와 동일한 값이지만 입력 전용 의미 토큰입니다.",
    usage: ["router", "ui/switch"],
    group: "neutral",
  },
  {
    key: "border", label: "Border", hex: "#E1E8F0",
    oklch: "oklch(0.929 0.013 255.508)",
    description: "구분선 및 외곽선.",
    usage: ["analysis", "my", "__root"],
    group: "neutral",
  },
  {
    key: "ring", label: "Ring", hex: "#8A9AB8",
    oklch: "oklch(0.704 0.04 256.788)",
    description: "포커스 링 색상. 접근성을 위한 키보드 포커스 테두리에 사용됩니다.",
    usage: ["ui/switch", "exchange.create"],
    group: "neutral",
  },

  /* ── 차트 ── */
  {
    key: "chart-1", label: "Chart 1", hex: "#E8713B",
    oklch: "oklch(0.646 0.222 41.116)",
    description: "차트 첫 번째 시리즈 색상. 따뜻한 오렌지 계열.",
    usage: [],
    group: "chart",
  },
  {
    key: "chart-2", label: "Chart 2", hex: "#3AAFA0",
    oklch: "oklch(0.6 0.118 184.704)",
    description: "차트 두 번째 시리즈 색상. 청록 계열.",
    usage: [],
    group: "chart",
  },
  {
    key: "chart-3", label: "Chart 3", hex: "#3A5875",
    oklch: "oklch(0.398 0.07 227.392)",
    description: "차트 세 번째 시리즈 색상. 짙은 스틸 블루.",
    usage: [],
    group: "chart",
  },
  {
    key: "chart-4", label: "Chart 4", hex: "#F0C040",
    oklch: "oklch(0.828 0.189 84.429)",
    description: "차트 네 번째 시리즈 색상. 밝은 골든 옐로우.",
    usage: [],
    group: "chart",
  },
  {
    key: "chart-5", label: "Chart 5", hex: "#F0A830",
    oklch: "oklch(0.769 0.188 70.08)",
    description: "차트 다섯 번째 시리즈 색상. 앰버 오렌지.",
    usage: [],
    group: "chart",
  },
];

const COVER_COLORS = [
  { hex: "#7C6EF5", name: "라벤더" }, { hex: "#F5866E", name: "코랄" },
  { hex: "#6EC7F5", name: "스카이" }, { hex: "#F5C96E", name: "골드" },
  { hex: "#6EF5B4", name: "민트" },  { hex: "#F56EBD", name: "핑크" },
  { hex: "#6E9DF5", name: "인디고" }, { hex: "#B4F56E", name: "라임" },
];

/* ─────────────────────────────────────────────────────────────
   타이포그래피
   ───────────────────────────────────────────────────────────── */
const TYPE_SCALE = [
  { name: "Display",        size: 28, weight: 700, lh: 1.25, ls: "0", usage: "온보딩·빈 상태 헤드라인", files: ["record", "analysis"] },
  { name: "Title 1",        size: 22, weight: 700, lh: 1.30, ls: "0", usage: "일기 제목·모달 헤드라인",  files: ["index", "exchange", "exchange.$roomId", "video-record", "backup", "report", "my"] },
  { name: "Title 2",        size: 18, weight: 700, lh: 1.35, ls: "0", usage: "페이지 헤더·섹션 제목",    files: ["index", "record", "exchange", "exchange.create", "video-record", "advice", "exchange.$roomId", "my", "analysis", "BottomSheet"] },
  { name: "Body Strong",    size: 16, weight: 600, lh: 1.40, ls: "0", usage: "버튼·카드 제목·리스트",    files: ["index", "record", "exchange", "exchange.create", "exchange.$roomId", "video-record", "diary", "fortune", "backup", "analysis", "my", "login", "Splash", "EmptyDiaryState", "PageHeader", "BottomSheet", "FaceAnalysisOverlay"] },
  { name: "Body",           size: 16, weight: 400, lh: 1.70, ls: "0", usage: "본문 텍스트·댓글",         files: ["index", "record", "exchange", "exchange.create", "exchange.$roomId", "video-record", "diary", "fortune", "backup", "analysis", "my"] },
  { name: "Caption Strong", size: 14, weight: 500, lh: 1.40, ls: "0", usage: "배지·칩·레이블",           files: ["index", "exchange", "exchange.$roomId", "video-record", "fortune", "advice", "chat", "login", "report", "analysis", "my", "backup", "BottomSheet", "EmptyDiaryState", "EmptyState", "FaceAnalysisOverlay", "LoadingScreen"] },
  { name: "Caption",        size: 14, weight: 400, lh: 1.45, ls: "0", usage: "서브타이틀·설명",          files: ["index", "exchange", "exchange.$roomId", "video-record", "fortune", "advice", "diary", "chat", "report", "analysis", "my", "BottomSheet", "EmptyDiaryState", "EmptyState", "FaceAnalysisOverlay"] },
  { name: "Micro Bold",     size: 12, weight: 700, lh: 1.30, ls: "0", usage: "배지 레이블·CAPS 섹션명",  files: ["analysis", "video-record", "diary", "advice", "report", "my", "BottomNav", "FaceAnalysisOverlay"] },
  { name: "Micro",          size: 12, weight: 400, lh: 1.45, ls: "0", usage: "타임스탬프·메타 (최솟값)", files: ["index", "record", "exchange", "exchange.create", "exchange.$roomId", "video-record", "advice", "diary", "chat", "report", "analysis", "my", "backup"] },
];

const TYPE_SAMPLES: Record<string, string> = {
  "Display": "말하지 못한 것들에 대하여",
  "Title 1": "봄날의 산책 일기",
  "Title 2": "교환일기",
  "Body Strong": "Google 로 로그인",
  "Body Semi": "말하지 못한 것들에 대하여",
  "Body": "오늘은 유난히 봄바람이 따뜻했다. 점심을 먹고 나서 공원을 한 바퀴 돌았는데 벚꽃이 한창이었다.",
  "Caption Strong": "3명이 읽었어요",
  "Caption": "AI 감정일기 & 교환일기",
  "Micro": "방금 전 · 댓글 2개",
  "Micro Bold": "브랜드 COLOR",
};

/* ─────────────────────────────────────────────────────────────
   간격 스케일
   ───────────────────────────────────────────────────────────── */
const SPACING = [
  { px: 2, tw: "0.5" }, { px: 4, tw: "1" }, { px: 6, tw: "1.5" },
  { px: 8, tw: "2" },   { px: 12, tw: "3" }, { px: 16, tw: "4" },
  { px: 20, tw: "5" }, { px: 24, tw: "6" }, { px: 32, tw: "8" },
  { px: 40, tw: "10" }, { px: 48, tw: "12" }, { px: 64, tw: "16" },
  { px: 80, tw: "20" }, { px: 96, tw: "24" },
];

/* ─────────────────────────────────────────────────────────────
   고도 (Elevation)
   ───────────────────────────────────────────────────────────── */
const ELEVATIONS = [
  { level: 0, label: "Flat", token: "shadow-none",   shadow: "none",                                          usage: "배경·구분선" },
  { level: 1, label: "Raised", token: "shadow-sm",   shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)", usage: "카드·리스트 아이템" },
  { level: 2, label: "Overlay", token: "shadow-md",  shadow: "0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)", usage: "드롭다운·팝오버" },
  { level: 3, label: "Modal", token: "shadow-xl",    shadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)", usage: "바텀시트·모달" },
  { level: 4, label: "Toast", token: "shadow-2xl",   shadow: "0 16px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.10)", usage: "토스트·플로팅 버튼" },
];

/* ─────────────────────────────────────────────────────────────
   아이콘 카탈로그
   ───────────────────────────────────────────────────────────── */
const ICON_GROUPS = [
  {
    label: "내비게이션",
    icons: [
      { C: Home, name: "Home" }, { C: BookOpen, name: "BookOpen" },
      { C: ArrowLeftRight, name: "ArrowLeftRight" }, { C: User, name: "User" },
      { C: ChevronLeft, name: "ChevronLeft" }, { C: ChevronRight, name: "ChevronRight" },
      { C: ArrowLeft, name: "ArrowLeft" },
    ],
  },
  {
    label: "액션",
    icons: [
      { C: Plus, name: "Plus" }, { C: X, name: "X" }, { C: Search, name: "Search" },
      { C: Settings, name: "Settings" }, { C: Edit3, name: "Edit3" },
      { C: Copy, name: "Copy" }, { C: Check, name: "Check" },
      { C: Download, name: "Download" }, { C: Share2, name: "Share2" },
      { C: Trash2, name: "Trash2" }, { C: RefreshCw, name: "RefreshCw" },
      { C: Filter, name: "Filter" }, { C: LogOut, name: "LogOut" },
      { C: Camera, name: "Camera" }, { C: Image, name: "Image" },
      { C: Mic, name: "Mic" },
    ],
  },
  {
    label: "상태 / 피드백",
    icons: [
      { C: Bell, name: "Bell" }, { C: AlertCircle, name: "AlertCircle" },
      { C: Info, name: "Info" }, { C: Lock, name: "Lock" },
      { C: Shield, name: "Shield" }, { C: HelpCircle, name: "HelpCircle" },
      { C: Loader2, name: "Loader2" }, { C: Zap, name: "Zap" },
    ],
  },
  {
    label: "소셜 / 감정",
    icons: [
      { C: Heart, name: "Heart" }, { C: Star, name: "Star" },
      { C: MessageCircle, name: "MessageCircle" }, { C: Send, name: "Send" },
      { C: Eye, name: "Eye" }, { C: Moon, name: "Moon" }, { C: Sun, name: "Sun" },
    ],
  },
  {
    label: "UI 컨트롤",
    icons: [
      { C: MoreHorizontal, name: "MoreHorizontal" }, { C: MoreVertical, name: "MoreVertical" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   모션 토큰
   ───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   라우트 매핑 — 파일명 → 실제 경로 + 레이블
   ───────────────────────────────────────────────────────────── */
const ROUTE_MAP: Record<string, { path: string; label: string }> = {
  "index":               { path: "/",               label: "홈" },
  "record":              { path: "/record",          label: "기록" },
  "analysis":            { path: "/analysis",        label: "분석" },
  "exchange":            { path: "/exchange",         label: "교환일기" },
  "exchange.create":     { path: "/exchange/create", label: "교환일기 만들기" },
  "exchange.$roomId":    { path: "/exchange",        label: "교환일기 방" },
  "my":                  { path: "/my",              label: "마이" },
  "video-record":        { path: "/video-record",    label: "영상 기록" },
  "diary":               { path: "/diary",           label: "일기" },
  "fortune":             { path: "/fortune",         label: "포춘" },
  "advice":              { path: "/advice",          label: "조언" },
  "chat":                { path: "/chat",            label: "채팅" },
  "report":              { path: "/report",          label: "리포트" },
  "backup":              { path: "/backup",          label: "백업" },
  "login":               { path: "/login",           label: "로그인" },
  "BottomNav":           { path: "/",               label: "홈 (내비)" },
  "BottomSheet":         { path: "/exchange",        label: "교환일기 (시트)" },
  "Splash":              { path: "/login",           label: "로그인 (스플래시)" },
  "PageHeader":          { path: "/record",          label: "기록 (헤더)" },
  "EmptyDiaryState":     { path: "/",               label: "홈 (빈 상태)" },
  "EmptyState":          { path: "/exchange",        label: "교환일기 (빈 상태)" },
  "FaceAnalysisOverlay": { path: "/record",          label: "기록 (얼굴 분석)" },
  "LoadingScreen":       { path: "/login",           label: "로그인 (로딩)" },
  "HomeScene":           { path: "/",               label: "홈 (3D)" },
  "FortuneScene":        { path: "/fortune",         label: "포춘 (3D)" },
  "OutroScene":          { path: "/fortune",         label: "포춘 (아웃트로)" },
  "__root":              { path: "/",               label: "루트 레이아웃" },
  "ui/switch":           { path: "/my",             label: "마이 (스위치)" },
};

/* ─────────────────────────────────────────────────────────────
   토큰 사용 위치 — 토큰ID → 파일 → 구체적 요소 목록
   ───────────────────────────────────────────────────────────── */
const USAGE_NOTES: Record<string, Record<string, string[]>> = {
  /* ── 컬러 토큰 ── */
  "primary": {
    "index":            ["홈 헤더 배경 그라디언트", "오늘 기록하기 CTA 버튼 배경", "BottomNav 활성 탭 아이콘·텍스트"],
    "record":           ["AI 촬영 시작 버튼 배경", "감정 저장 버튼 배경"],
    "analysis":         ["차트 진행 바 색상", "섹션 강조 텍스트"],
    "diary":            ["공유·메뉴 아이콘 강조색"],
    "chat":             ["메시지 전송 버튼 배경", "내 말풍선 배경"],
    "advice":           ["조언 강조 텍스트 색상"],
    "exchange":         ["탭 활성 인디케이터 하단 라인", "공유 아이콘 강조"],
    "exchange.create":  ["만들기 버튼 배경"],
    "exchange.$roomId": ["댓글 전송 버튼 배경", "내 댓글 배경색"],
    "fortune":          ["운세 강조 포인트 색상"],
    "login":            ["온보딩 포인트 색상", "Google 로그인 버튼 보조"],
    "my":               ["설정 토글 활성 색상", "프로필 수정 버튼"],
    "video-record":     ["촬영 버튼 배경", "진행 인디케이터"],
    "BottomNav":        ["활성 탭 아이콘 + 레이블 텍스트 색상"],
    "BottomSheet":      ["액션 아이템 아이콘 배경 원"],
    "Splash":           ["앱 로고 배경 원"],
  },
  "brand-clover-active": {
    "index":       ["기록 있는 날짜 — 클로버 잎 + 줄기 색상 (노란색)"],
    "my":          ["달력 기록 날짜 클로버 색상"],
    "HomeScene":   ["3D 홈 씬 채워진 클로버 리프 색상"],
    "FortuneScene":["3D 포춘 씬 클로버 장식"],
    "OutroScene":  ["성취 아웃트로 클로버 연출"],
  },
  "brand-clover-special": {
    "index":       ["오늘 날짜 — 클로버 색상 (녹색, 가장 강조)"],
    "my":          ["오늘 날짜 클로버 강조"],
    "HomeScene":   ["3D 씬 오늘 날짜 클로버"],
    "FortuneScene":["3D 포춘 씬 특별 날짜 클로버"],
    "OutroScene":  ["성취 아웃트로 특별 클로버"],
  },
  "brand-clover-empty": {
    "index":       ["기록 없는 날짜 빈 클로버 (회색)", "달력 외부 앱 배경색"],
    "my":          ["기록 없는 날짜 빈 클로버"],
    "HomeScene":   ["3D 씬 빈 클로버 리프"],
    "FortuneScene":["3D 포춘 씬 배경 클로버"],
    "OutroScene":  ["아웃트로 배경 클로버"],
  },
  "foreground": {
    "index":            ["달력 날짜 숫자", "월·년 헤더 텍스트 '2026. 06'"],
    "record":           ["일기 본문 입력 텍스트", "제목 입력 필드"],
    "analysis":         ["분석 수치 텍스트", "카드 헤더"],
    "diary":            ["일기 내용 텍스트", "날짜 표시"],
    "chat":             ["채팅 메시지 텍스트"],
    "advice":           ["조언 본문 텍스트"],
    "exchange":         ["교환일기 목록 제목"],
    "exchange.$roomId": ["일기 본문", "댓글 텍스트"],
    "fortune":          ["운세 내용 텍스트"],
    "login":            ["환영 헤드라인 텍스트"],
    "my":               ["설정 항목 텍스트", "프로필 이름"],
    "report":           ["리포트 본문 텍스트"],
    "backup":           ["백업 안내 텍스트"],
    "PageHeader":       ["페이지 제목 텍스트"],
    "EmptyState":       ["빈 상태 안내 텍스트"],
    "EmptyDiaryState":  ["일기 없음 안내 텍스트"],
  },
  "muted-foreground": {
    "index":  ["요일 헤더(일·월·화·수·목·금·토)", "보조 안내 문구"],
    "__root": ["전역 서브텍스트 기본값 (앱 전체 적용)"],
  },
  "background": {
    "__root":    ["앱 전체 배경 + 카드·모달 배경 (전역 기본값)"],
    "ui/switch": ["스위치 컴포넌트 활성 배경"],
  },
  "border": {
    "analysis": ["분석 카드 구분선", "섹션 경계선"],
    "my":       ["리스트 아이템 구분선", "설정 섹션 테두리"],
    "__root":   ["전역 border 기본값 (앱 전체 적용)"],
  },
  "primary-foreground": {
    "__root": ["Primary 버튼 위 텍스트 색상 (흰색에 가까운 아이보리)", "에러 페이지 '홈으로' 버튼 텍스트"],
  },
  "brand-day-muted": {
    "index": ["미래 날짜 숫자 색상 (클로버 없이 숫자만 표시되는 날짜)"],
  },
  "destructive": {
    "__root": ["삭제 버튼 배경", "오류 상태 텍스트 (전역 기본값)"],
  },
  "muted": {
    "router": ["에러 페이지 — 오류 코드 블록 배경 (bg-muted)"],
  },
  "accent": {
    "router": ["에러 페이지 — '다시 시도' 버튼 hover 배경 (hover:bg-accent)"],
  },
  "input": {
    "router":    ["에러 페이지 버튼 테두리 (border-input)"],
    "ui/switch": ["스위치 비활성 상태 배경 (data-[state=unchecked]:bg-input)"],
  },
  "ring": {
    "ui/switch":       ["스위치 포커스 링 (focus-visible:ring-ring)"],
    "exchange.create": ["제목·본문·비밀번호 입력 필드 포커스 링 (focus:ring-[var(--ring)])"],
  },

  /* ── 타이포그래피 토큰 ── */
  "type:Display": {
    "record":   ["기록 화면 빈 상태 헤드라인 '오늘의 감정을 기록해보세요'"],
    "analysis": ["감정 분석 결과 메인 헤드라인"],
  },
  "type:Title 1": {
    "index":            ["월·년 헤더 '2026. 06'"],
    "exchange":         ["교환일기 목록 페이지 헤더"],
    "exchange.$roomId": ["공유 일기 제목"],
    "video-record":     ["영상 기록 결과 제목"],
    "backup":           ["백업 페이지 헤더"],
    "report":           ["감정 리포트 헤더"],
    "my":               ["프로필 이름 텍스트"],
  },
  "type:Title 2": {
    "index":            ["섹션 소제목"],
    "record":           ["기록 폼 섹션 제목"],
    "exchange":         ["탭 섹션 레이블"],
    "exchange.create":  ["교환일기 만들기 폼 제목"],
    "video-record":     ["촬영 섹션 레이블"],
    "advice":           ["조언 카드 제목"],
    "exchange.$roomId": ["날짜 그룹 헤더"],
    "my":               ["설정 섹션 그룹 제목"],
    "analysis":         ["분석 카테고리 제목 (에너지·안정감·집중력·긍정성)"],
    "BottomSheet":      ["바텀시트 상단 일기 제목"],
  },
  "type:Body Strong": {
    "index":            ["오늘 기록하기 CTA 버튼 텍스트"],
    "record":           ["저장 버튼, 감정 선택 항목"],
    "exchange":         ["공유 버튼, 탭 레이블"],
    "exchange.create":  ["입력 레이블, 확인 버튼"],
    "exchange.$roomId": ["작성자 이름"],
    "video-record":     ["촬영 버튼 레이블"],
    "diary":            ["일기 제목 텍스트"],
    "fortune":          ["운세 강조 문구"],
    "backup":           ["백업 버튼 텍스트"],
    "analysis":         ["수치 강조 텍스트 (예: 72/100)"],
    "my":               ["메뉴 항목 텍스트"],
    "login":            ["로그인 버튼 레이블"],
    "Splash":           ["앱 이름 'ANDAMIRO'"],
    "EmptyDiaryState":  ["빈 상태 CTA 버튼"],
    "PageHeader":       ["페이지 타이틀"],
    "BottomSheet":      ["액션 항목 레이블 (공유하기, 삭제 등)"],
    "FaceAnalysisOverlay": ["분석 중 안내 텍스트"],
  },
  "type:Body": {
    "index":            ["날짜별 일기 미리보기 텍스트"],
    "record":           ["일기 본문 입력 텍스트"],
    "exchange":         ["공지·안내 텍스트"],
    "exchange.create":  ["안내 설명 텍스트"],
    "exchange.$roomId": ["댓글 본문"],
    "video-record":     ["안내 텍스트"],
    "diary":            ["일기 본문 내용"],
    "fortune":          ["운세 본문 텍스트"],
    "backup":           ["백업 설명 텍스트"],
    "analysis":         ["분석 설명 텍스트"],
    "my":               ["설정 설명 텍스트"],
  },
  "type:Caption Strong": {
    "index":            ["날짜 숫자 (클로버 위)"],
    "exchange":         ["읽음 표시 '3명이 읽었어요'"],
    "exchange.$roomId": ["댓글 수·조회 수 배지"],
    "video-record":     ["촬영 힌트 레이블"],
    "fortune":          ["운세 카테고리 레이블"],
    "advice":           ["조언 태그 배지"],
    "chat":             ["채팅 상태 표시"],
    "login":            ["약관 동의 레이블"],
    "report":           ["리포트 항목 레이블"],
    "analysis":         ["지표 이름 레이블 (에너지, 집중력 등)"],
    "my":               ["설정 항목 서브 레이블"],
    "backup":           ["백업 상태 레이블"],
    "BottomSheet":      ["시트 아이템 설명 텍스트"],
    "EmptyDiaryState":  ["빈 상태 서브 텍스트"],
    "EmptyState":       ["빈 상태 설명 텍스트"],
    "FaceAnalysisOverlay": ["분석 진행 안내 텍스트"],
    "LoadingScreen":    ["로딩 중 안내 텍스트"],
  },
  "type:Caption": {
    "index":            ["달력 날짜 아래 보조 텍스트"],
    "exchange":         ["일기 작성 날짜, 보조 설명"],
    "exchange.$roomId": ["댓글 시간, 작성자 보조 정보"],
    "video-record":     ["촬영 설명 텍스트"],
    "fortune":          ["운세 날짜 정보"],
    "advice":           ["조언 출처·날짜"],
    "diary":            ["일기 메타 정보"],
    "chat":             ["메시지 시간 표시"],
    "report":           ["리포트 기간 정보"],
    "analysis":         ["분석 보조 설명"],
    "my":               ["설정 항목 설명 텍스트"],
    "BottomSheet":      ["시트 아이템 부제목"],
    "EmptyDiaryState":  ["빈 상태 안내 설명"],
    "EmptyState":       ["빈 목록 안내 설명"],
    "FaceAnalysisOverlay": ["분석 부가 텍스트"],
  },
  "type:Micro Bold": {
    "analysis":         ["차트 축 레이블, 수치 단위 (예: /100)"],
    "video-record":     ["타임코드 레이블"],
    "diary":            ["날짜 배지"],
    "advice":           ["조언 태그 CAPS"],
    "report":           ["섹션명 CAPS 레이블"],
    "my":               ["설정 그룹 CAPS 헤더"],
    "BottomNav":        ["탭 이름 텍스트 (홈·기록·교환·마이)"],
    "FaceAnalysisOverlay": ["촬영 중 REC 배지 텍스트"],
  },
  "type:Micro": {
    "index":            ["미래 날짜 숫자 (옅은 회색 표시)"],
    "record":           ["입력 힌트, 글자 수 카운터"],
    "exchange":         ["목록 날짜 타임스탬프"],
    "exchange.create":  ["입력 가이드 텍스트"],
    "exchange.$roomId": ["댓글 타임스탬프 '방금 전'"],
    "video-record":     ["촬영 시간 표시"],
    "advice":           ["출처 날짜"],
    "diary":            ["작성 시간 타임스탬프"],
    "chat":             ["읽음 확인 타임스탬프"],
    "report":           ["기간 날짜 텍스트"],
    "analysis":         ["차트 하단 날짜 레이블"],
    "my":               ["최근 업데이트 날짜"],
    "backup":           ["백업 날짜 타임스탬프"],
  },
};

const DURATIONS = [100, 150, 200, 300, 500];
const EASINGS = [
  { name: "ease-out", value: "cubic-bezier(0, 0, 0.2, 1)", usage: "대부분의 UI 전환" },
  { name: "ease-in-out", value: "cubic-bezier(0.4, 0, 0.2, 1)", usage: "슬라이드 인/아웃" },
  { name: "spring", value: "cubic-bezier(0.34, 1.56, 0.64, 1)", usage: "버튼 탭·팝업 등장" },
  { name: "linear", value: "linear", usage: "로딩 스피너·회전" },
];

/* ─────────────────────────────────────────────────────────────
   로컬스토리지
   ───────────────────────────────────────────────────────────── */
const LS_KEY = "andamiro_ds_v3";
function loadSaved() { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Record<string,string>; } catch { return {}; } }
function saveTo(o: Record<string,string>) { localStorage.setItem(LS_KEY, JSON.stringify(o)); }
function applyAll(o: Record<string,string>) { Object.entries(o).forEach(([k,v]) => document.documentElement.style.setProperty(`--${k}`,v)); }

/* ─────────────────────────────────────────────────────────────
   섹션 ID 목록
   ───────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "color",      label: "컬러",         sub: [] },
  { id: "typography", label: "타이포그래피",  sub: [] },
  { id: "spacing",    label: "간격",          sub: [] },
  { id: "elevation",  label: "고도",          sub: [] },
  { id: "radius",     label: "모서리 반경",   sub: [] },
  { id: "components", label: "컴포넌트",      sub: ["버튼", "입력", "카드", "탭", "시트", "모달"] },
  { id: "icons",      label: "아이콘",        sub: [] },
  { id: "motion",     label: "모션",          sub: [] },
];

/* ═══════════════════════════════════════════════════════════
   메인 페이지
   ═══════════════════════════════════════════════════════════ */
export default function DesignPage() {
  const [hexMap, setHexMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(COLORS.map((t) => [t.key, t.hex]))
  );
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [radius, setRadius] = useState(10);
  const [activeSection, setActiveSection] = useState("color");
  const [editKey, setEditKey] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  /* 화면 미리보기 드로어 */
  const [drawer, setDrawer] = useState<{
    name: string; desc?: string; color?: string; files: string[]; tokenId: string;
  } | null>(null);
  const [drawerFile, setDrawerFile] = useState("");
  const openDrawer = (token: { name: string; desc?: string; color?: string; files: string[]; tokenId: string }, file?: string) => {
    if (!token.files.length) return;
    setDrawer(token);
    setDrawerFile(file ?? token.files[0]);
  };

  /* 초기화 */
  useEffect(() => {
    const s = loadSaved();
    applyAll(s);
    setSaved(s);
    if (s["radius"]) setRadius(Math.round(parseFloat(s["radius"]) * 16));

    /* IntersectionObserver로 활성 섹션 추적 */
    const els = NAV_ITEMS.map(n => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleColor = useCallback((key: string, hex: string) => {
    setHexMap(p => ({ ...p, [key]: hex }));
    const [l,c,h] = hexToOklch(hex);
    const oklch = `oklch(${l} ${c} ${h})`;
    document.documentElement.style.setProperty(`--${key}`, oklch);
    const next = { ...saved, [key]: oklch };
    setSaved(next); saveTo(next);
  }, [saved]);

  const handleRadius = useCallback((px: number) => {
    setRadius(px);
    const rem = `${(px/16).toFixed(4)}rem`;
    document.documentElement.style.setProperty("--radius", rem);
    const next = { ...saved, radius: rem };
    setSaved(next); saveTo(next);
  }, [saved]);

  const handleReset = useCallback(() => {
    COLORS.forEach(t => document.documentElement.style.removeProperty(`--${t.key}`));
    document.documentElement.style.removeProperty("--radius");
    localStorage.removeItem(LS_KEY);
    setHexMap(Object.fromEntries(COLORS.map(t => [t.key, t.hex])));
    setSaved({}); setRadius(10);
  }, []);

  const handleExport = useCallback(() => {
    if (!Object.keys(saved).length) return;
    navigator.clipboard.writeText([":root {", ...Object.entries(saved).map(([k,v]) => `  --${k}: ${v};`), "}"].join("\n"));
    setExported(true); setTimeout(() => setExported(false), 2000);
  }, [saved]);

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(`var(--${token})`);
    setCopiedToken(token); setTimeout(() => setCopiedToken(null), 1500);
  };

  const primary = hexMap["primary"] ?? "#4B82F5";
  const hasChanges = Object.keys(saved).length > 0;

  return (
    <div className="min-h-screen bg-[#F7F8FA]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', sans-serif" }}>

      {/* ── 화면 미리보기 드로어 ── */}
      {drawer && (
        <TokenDrawer
          token={drawer}
          activeFile={drawerFile}
          onFileChange={setDrawerFile}
          onClose={() => setDrawer(null)}
        />
      )}

      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-50 border-b border-[#EAECF0] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1380px] items-center gap-6 px-6 h-[60px]">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: primary }}>
              <div className="h-3 w-3 rounded-full bg-white/90" />
            </div>
            <span className="text-[15px] font-bold text-[#111]">안다미로</span>
            <span className="rounded-md border border-[#E5E7EB] px-1.5 py-0.5 text-[10px] font-semibold text-[#9CA3AF]">Design System</span>
          </div>

          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {NAV_ITEMS.map(n => (
              <a key={n.id} href={`#${n.id}`}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium transition"
                style={{ color: activeSection === n.id ? primary : "#6B7280",
                         background: activeSection === n.id ? `${primary}12` : "transparent" }}>
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {hasChanges && (
              <span className="hidden sm:block rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: `${primary}15`, color: primary }}>
                {Object.keys(saved).length}개 수정됨
              </span>
            )}
            {hasChanges && (
              <button onClick={handleReset}
                className="rounded-lg border border-[#E5E7EB] bg-white h-8 px-3.5 text-[12px] font-medium text-[#666] transition hover:border-[#CCC]">
                초기화
              </button>
            )}
            <button onClick={handleExport} disabled={!hasChanges}
              className="rounded-lg h-8 px-4 text-[12px] font-semibold text-white transition hover:opacity-90 disabled:opacity-30"
              style={{ background: primary }}>
              {exported ? "복사 완료 ✓" : "CSS 내보내기"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1380px]">

        {/* ── 사이드바 ── */}
        <aside className="hidden xl:block w-[220px] shrink-0">
          <div className="sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto py-8 pr-4">
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map(n => (
                <a key={n.id} href={`#${n.id}`}
                  className="flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition"
                  style={{ color: activeSection === n.id ? primary : "#6B7280",
                           background: activeSection === n.id ? `${primary}10` : "transparent" }}>
                  <span className="h-1 w-1 rounded-full mr-2.5 shrink-0 transition"
                    style={{ background: activeSection === n.id ? primary : "#D1D5DB" }} />
                  {n.label}
                </a>
              ))}
            </nav>

            {hasChanges && (
              <div className="mt-8 rounded-xl border border-[#E5E7EB] bg-white p-4">
                <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">수정된 변수</p>
                {Object.entries(saved).slice(0, 6).map(([k]) => (
                  <div key={k} className="flex items-center gap-2 py-1">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ background: hexMap[k] ?? primary }} />
                    <span className="font-mono text-[10px] text-[#6B7280] truncate">--{k}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── 메인 콘텐츠 ── */}
        <main className="flex-1 min-w-0 px-6 lg:px-8 py-10 space-y-24">

          {/* ══ 히어로 ═══════════════════════════════════════════════ */}
          <div className="relative overflow-hidden rounded-3xl p-10" style={{
            background: `linear-gradient(135deg, ${primary} 0%, ${hexMap["primary-light"] ?? "#A4C1FA"} 100%)`
          }}>
            <div className="relative z-10">
              <p className="text-white/70 text-[13px] font-semibold tracking-widest uppercase mb-3">Andamiro Design System</p>
              <h1 className="text-white text-[40px] font-bold leading-tight tracking-tight mb-3">
                디자인의 기준을<br />코드로 정의합니다.
              </h1>
              <p className="text-white/80 text-[16px] leading-relaxed max-w-[480px]">
                컬러·타이포그래피·간격·컴포넌트까지 — 안다미로의 모든 시각적 언어를 한 곳에서 확인하고 수정할 수 있습니다.
              </p>
              <div className="mt-6 flex items-center gap-4">
                <span className="rounded-full bg-white/20 border border-white/30 px-4 py-1.5 text-[13px] font-semibold text-white">
                  oklch · Tailwind v4 · CSS Custom Properties
                </span>
              </div>
            </div>
            {/* 데코 서클 */}
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/8" />
            <div className="absolute -right-6 -bottom-20 h-48 w-48 rounded-full bg-white/6" />
          </div>

          {/* ══ 컬러 ═══════════════════════════════════════════════ */}
          <section id="color">
            <SecHeader tag="Color" title="컬러 시스템"
              desc="모든 색상은 oklch 색공간으로 정의됩니다. 스와치를 클릭하면 실시간으로 편집되며 CSS 변수에 즉시 반영됩니다." />

            {/* 숨김 color picker */}
            <input ref={pickerRef} type="color" className="sr-only"
              value={editKey ? (hexMap[editKey] ?? "#000") : "#000"}
              onChange={e => { if (editKey) handleColor(editKey, e.target.value); }} />

            {(["brand","semantic","neutral","chart"] as const).map(group => {
              const tokens = COLORS.filter(t => t.group === group);
              const labels = { brand: "브랜드", semantic: "시맨틱", neutral: "뉴트럴", chart: "차트" };
              return (
                <div key={group} className="mb-12">
                  <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">{labels[group]}</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {tokens.map(token => {
                      const hex = hexMap[token.key] ?? token.hex;
                      const light = isLight(hex);
                      const fg = light ? "#111827" : "#FFFFFF";
                      const sub = light ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.6)";
                      const cr = contrast(hex, "#FFFFFF");
                      const wLevel = wcagLevel(cr);
                      const changed = saved[token.key] !== undefined;
                      const hasScreens = token.usage.length > 0;
                      return (
                        <div key={token.key} className="group rounded-2xl bg-white border border-[#F3F4F6] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          {/* 스와치 */}
                          <button type="button"
                            onClick={() => { setEditKey(token.key); setTimeout(() => pickerRef.current?.click(), 0); }}
                            className="relative w-full cursor-pointer focus:outline-none"
                            style={{ height: 104, background: hex }}>
                            {/* 편집 오버레이 */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.18)" }}>
                              <div className="rounded-full bg-white/95 px-3.5 py-1 text-[12px] font-semibold text-[#111] shadow-sm flex items-center gap-1.5">
                                <Edit3 size={11} /> 편집
                              </div>
                            </div>
                            {/* WCAG 배지 */}
                            <div className="absolute top-2.5 right-2.5">
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                wLevel === "AAA" ? "bg-green-500 text-white" :
                                wLevel === "AA" ? "bg-blue-500 text-white" :
                                wLevel === "AA Large" ? "bg-yellow-400 text-[#333]" : "bg-red-500 text-white"
                              }`}>{wLevel} {cr}:1</span>
                            </div>
                            {/* 수정됨 */}
                            {changed && (
                              <div className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold" style={{ color: primary }}>
                                수정됨
                              </div>
                            )}
                          </button>

                          {/* 정보 */}
                          <div className="p-3.5">
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-[13px] font-bold text-[#111] leading-tight">{token.label}</p>
                              <button type="button" onClick={() => copyToken(token.key)}
                                className="ml-1 rounded p-0.5 text-[#CBD5E1] hover:text-[#6B7280] transition shrink-0 mt-0.5">
                                {copiedToken === token.key ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                              </button>
                            </div>
                            <p className="font-mono text-[10px] text-[#9CA3AF] mb-0.5">--{token.key}</p>
                            <p className="font-mono text-[11px] font-semibold text-[#374151] mb-2">{hex.toUpperCase()}</p>
                            <p className="text-[11px] text-[#6B7280] leading-relaxed mb-2">{token.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {token.usage.length === 0 ? (
                                <span className="rounded-full border border-[#FEE2E2] bg-[#FFF5F5] px-2 py-0.5 text-[10px] text-[#F87171]">미사용</span>
                              ) : token.usage.map(u => (
                                <button key={u} type="button"
                                  onClick={() => openDrawer({ name: token.label, desc: token.description, color: hexMap[token.key] ?? token.hex, files: token.usage, tokenId: token.key }, u)}
                                  className="rounded-full border border-[#F3F4F6] bg-[#F9FAFB] px-2 py-0.5 text-[10px] text-[#6B7280] hover:border-[var(--primary,#4B82F5)] hover:text-[var(--primary,#4B82F5)] hover:bg-[#EEF4FF] transition cursor-pointer">
                                  {u}
                                </button>
                              ))}
                            </div>
                            {hasScreens && (
                              <button type="button"
                                onClick={() => openDrawer({ name: token.label, desc: token.description, color: hexMap[token.key] ?? token.hex, files: token.usage, tokenId: token.key })}
                                className="mt-2.5 w-full flex items-center justify-center gap-1 rounded-lg border border-[#F3F4F6] py-1.5 text-[11px] font-medium text-[#9CA3AF] hover:border-[var(--primary,#4B82F5)] hover:text-[var(--primary,#4B82F5)] hover:bg-[#EEF4FF] transition">
                                <Eye size={11} /> 화면 보기
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* 그라디언트 */}
            <div className="mb-10">
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">그라디언트</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden">
                  <div className="h-24" style={{ background: `linear-gradient(180deg, ${hexMap["primary"] ?? "#4B82F5"} 0%, ${hexMap["primary-light"] ?? "#A4C1FA"} 100%)` }} />
                  <div className="bg-white border border-t-0 border-[#F3F4F6] rounded-b-2xl p-3.5">
                    <p className="text-[12px] font-bold text-[#111]">Sky Gradient</p>
                    <p className="font-mono text-[10px] text-[#9CA3AF] mt-0.5">--gradient-sky</p>
                    <p className="text-[11px] text-[#6B7280] mt-1">앱 배경·헤더 등 주요 그라디언트</p>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <div className="h-24 flex" style={{ background: `linear-gradient(135deg, ${hexMap["brand-clover-active"] ?? "#F9B602"} 0%, ${hexMap["brand-clover-special"] ?? "#009A51"} 100%)` }} />
                  <div className="bg-white border border-t-0 border-[#F3F4F6] rounded-b-2xl p-3.5">
                    <p className="text-[12px] font-bold text-[#111]">Clover Gradient</p>
                    <p className="font-mono text-[10px] text-[#9CA3AF] mt-0.5">클로버 Active → Special</p>
                    <p className="text-[11px] text-[#6B7280] mt-1">클로버 성취·보상 화면용</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 커버 팔레트 */}
            <div>
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">커버 팔레트 — 일기 썸네일</p>
              <div className="rounded-2xl bg-white border border-[#F3F4F6] p-6 shadow-sm">
                <div className="flex flex-wrap gap-4">
                  {COVER_COLORS.map(({ hex, name }) => (
                    <div key={hex} className="flex flex-col items-center gap-2">
                      <div className="h-16 w-16 rounded-2xl border border-black/[0.06] shadow-sm" style={{ background: hex }} />
                      <div className="text-center">
                        <p className="text-[12px] font-semibold text-[#374151]">{name}</p>
                        <p className="font-mono text-[10px] text-[#9CA3AF]">{hex}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{contrast(hex, "#FFFFFF")}:1</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[12px] text-[#9CA3AF]">커버 팔레트는 <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-[11px]">coverColorForId(id)</code> 함수로 일기 ID 기반 자동 배정됩니다. 사용자가 직접 바꿀 수 없는 고정 팔레트입니다.</p>
              </div>
            </div>
          </section>

          {/* ══ 타이포그래피 ═══════════════════════════════════════════ */}
          <section id="typography">
            <SecHeader tag="Typography" title="타이포그래피 스케일"
              desc="시스템 폰트(Pretendard → Apple SD Gothic → 기본)를 사용합니다. 모든 텍스트에 tracking-tight(-0.02em)를 기본 적용합니다." />

            <div className="rounded-2xl bg-white border border-[#F3F4F6] overflow-hidden shadow-sm">
              <div className="hidden md:grid grid-cols-[160px_1fr_80px_80px_80px_80px_180px] gap-4 border-b border-[#F9FAFB] px-6 py-3 bg-[#FAFBFC]">
                {["스타일","미리보기","크기","굵기","행간","자간","사용처 / 사용 파일"].map(h => (
                  <p key={h} className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{h}</p>
                ))}
              </div>
              {TYPE_SCALE.map((row, i) => (
                <div key={row.name}
                  className={`flex flex-col md:grid md:grid-cols-[160px_1fr_80px_80px_80px_80px_1fr] gap-2 md:gap-4 items-start md:items-center px-6 py-4 ${i !== TYPE_SCALE.length - 1 ? "border-b border-[#F9FAFB]" : ""}`}>
                  <div>
                    <p className="text-[13px] font-bold text-[#111]">{row.name}</p>
                  </div>
                  <p className="min-w-0 overflow-hidden" style={{ fontSize: row.size, fontWeight: row.weight, lineHeight: row.lh, letterSpacing: row.ls, color: "#111827", maxHeight: "3.5em" }}>
                    {TYPE_SAMPLES[row.name] ?? row.name}
                  </p>
                  <p className="font-mono text-[12px] text-[#6B7280]">{row.size}px</p>
                  <p className="font-mono text-[12px] text-[#6B7280]">{row.weight}</p>
                  <p className="font-mono text-[12px] text-[#6B7280]">{row.lh}</p>
                  <p className="font-mono text-[12px] text-[#6B7280]">{row.ls}</p>
                  <div>
                    <p className="text-[11px] text-[#9CA3AF] mb-1.5">{row.usage}</p>
                    <div className="flex flex-wrap gap-1">
                      {row.files.map(f => (
                        <button key={f} type="button"
                          onClick={() => openDrawer({ name: row.name, desc: row.usage, files: row.files, tokenId: `type:${row.name}` }, f)}
                          className="rounded-full border border-[#F3F4F6] bg-[#F9FAFB] px-2 py-0.5 text-[10px] text-[#6B7280] hover:border-[var(--primary,#4B82F5)] hover:text-[var(--primary,#4B82F5)] hover:bg-[#EEF4FF] transition cursor-pointer">
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══ 간격 ═══════════════════════════════════════════════════ */}
          <section id="spacing">
            <SecHeader tag="Spacing" title="간격 스케일"
              desc="4px 베이스 그리드를 기준으로 합니다. Tailwind 유틸리티와 1:1 대응됩니다." />

            <div className="rounded-2xl bg-white border border-[#F3F4F6] p-6 shadow-sm space-y-3">
              {SPACING.map(({ px, tw }) => (
                <div key={px} className="flex items-center gap-4">
                  <div className="w-16 shrink-0 text-right">
                    <span className="font-mono text-[12px] font-semibold text-[#374151]">{px}px</span>
                  </div>
                  <div className="flex-shrink-0 h-5 rounded" style={{ width: px * 2, background: primary, opacity: 0.8 }} />
                  <div className="flex items-center gap-3 flex-wrap">
                    <code className="rounded-md bg-[#F3F4F6] px-2 py-0.5 font-mono text-[11px] text-[#6B7280]">gap-{tw}</code>
                    <code className="rounded-md bg-[#F3F4F6] px-2 py-0.5 font-mono text-[11px] text-[#6B7280]">p-{tw}</code>
                    <code className="rounded-md bg-[#F3F4F6] px-2 py-0.5 font-mono text-[11px] text-[#6B7280]">{px/16 % 1 === 0 ? px/16 : (px/16).toFixed(3)}rem</code>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══ 고도 ═══════════════════════════════════════════════════ */}
          <section id="elevation">
            <SecHeader tag="Elevation" title="고도 (Elevation)"
              desc="5단계 고도 시스템. 레이어가 올라갈수록 그림자가 강해집니다." />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {ELEVATIONS.map(({ level, label, token, shadow, usage }) => (
                <div key={level} className="flex flex-col gap-3">
                  <div className="flex items-center justify-center bg-white rounded-2xl h-28"
                    style={{ boxShadow: shadow }}>
                    <span className="text-[13px] font-bold text-[#374151]">Level {level}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#111]">{label}</p>
                    <code className="block font-mono text-[10px] text-[#9CA3AF] mt-0.5">{token}</code>
                    <p className="text-[12px] text-[#6B7280] mt-1">{usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══ 반경 ═══════════════════════════════════════════════════ */}
          <section id="radius">
            <SecHeader tag="Border Radius" title="모서리 반경"
              desc="--radius를 조절하면 sm / md / lg / xl이 모두 자동으로 연동됩니다." />

            <div className="rounded-2xl bg-white border border-[#F3F4F6] p-8 shadow-sm">
              <div className="flex items-center gap-5 mb-8">
                <input type="range" min={0} max={24} value={radius}
                  onChange={e => handleRadius(Number(e.target.value))}
                  className="flex-1 h-1.5 rounded-full cursor-pointer"
                  style={{ accentColor: primary }} />
                <div className="text-right shrink-0 w-24">
                  <span className="text-[28px] font-bold text-[#111]">{radius}</span>
                  <span className="text-[14px] text-[#9CA3AF] ml-1">px</span>
                  <p className="font-mono text-[11px] text-[#9CA3AF]">{(radius/16).toFixed(4)}rem</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: "radius-sm",  sub: "calc(base - 4px)", val: Math.max(0, radius - 4) },
                  { name: "radius",     sub: "base",              val: radius },
                  { name: "radius-lg",  sub: "= base",            val: radius },
                  { name: "radius-xl",  sub: "calc(base + 4px)",  val: radius + 4 },
                ].map(row => (
                  <div key={row.name} className="flex flex-col items-center gap-3">
                    <div className="w-full h-20 border-2 border-[#E5E7EB]"
                      style={{ borderRadius: row.val, background: `${primary}12` }} />
                    <div className="text-center">
                      <p className="font-mono text-[11px] font-semibold text-[#374151]">--{row.name}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{row.sub}</p>
                      <p className="font-mono text-[13px] font-bold text-[#111] mt-0.5">{row.val}px</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ 컴포넌트 ═══════════════════════════════════════════════ */}
          <section id="components">
            <SecHeader tag="Components" title="컴포넌트"
              desc="위 컬러·반경을 수정하면 아래 모든 컴포넌트에 즉시 반영됩니다." />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 버튼 */}
              <CompCard id="버튼" title="버튼" desc="앱 전체 버튼 스타일 — 4종 variant × 3 size + 상태">
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2.5">Variant</p>
                    <div className="flex flex-wrap gap-2.5 items-center">
                      <DSBtn v="primary">Primary</DSBtn>
                      <DSBtn v="outline">Outline</DSBtn>
                      <DSBtn v="ghost">Ghost</DSBtn>
                      <DSBtn v="destructive">Destructive</DSBtn>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2.5">Size</p>
                    <div className="flex flex-wrap gap-2.5 items-end">
                      <DSBtn v="primary" sz="lg">Large</DSBtn>
                      <DSBtn v="primary" sz="md">Medium</DSBtn>
                      <DSBtn v="primary" sz="sm">Small</DSBtn>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2.5">State</p>
                    <div className="flex flex-wrap gap-2.5 items-center">
                      <DSBtn v="primary">Default</DSBtn>
                      <DSBtn v="primary" disabled>Disabled</DSBtn>
                      <DSBtn v="primary" loading>Loading</DSBtn>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2.5">실제 사용 예시</p>
                    <div className="flex flex-col gap-2.5">
                      <button className="flex h-[52px] w-full max-w-[320px] items-center justify-center gap-3 rounded-[12px] border border-[#E2E2E2] bg-white shadow-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        <span className="text-[16px] font-semibold text-[#454545] tracking-[-0.48px]">Google 로 로그인</span>
                      </button>
                      <div className="flex gap-2 max-w-[320px]">
                        <button className="flex-1 h-[52px] rounded-[12px] border text-[15px] font-semibold transition hover:opacity-80"
                          style={{ borderColor: primary, color: primary, background: "white" }}>링크 복사</button>
                        <button className="flex-1 h-[52px] rounded-[12px] text-white text-[15px] font-semibold"
                          style={{ background: primary }}>친구에게 공유</button>
                      </div>
                    </div>
                  </div>
                </div>
              </CompCard>

              {/* 입력 필드 */}
              <CompCard id="입력" title="입력 필드" desc="텍스트, 비밀번호, 토글, 댓글 입력">
                <div className="space-y-3">
                  <DSInput label="일기 제목" placeholder="오늘은 어떤 하루였나요?" />
                  <DSInput label="비밀번호" placeholder="공유 일기 비밀번호" type="password" />
                  <DSInput label="오류 상태" placeholder="다시 입력해 주세요" error="비밀번호가 맞지 않아요." />
                  <div>
                    <p className="mb-1.5 text-[13px] font-semibold text-[#374151]">댓글 입력</p>
                    <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2">
                      <span className="flex-1 text-[14px] text-[#D1D5DB]">댓글을 입력하세요...</span>
                      <div className="grid h-8 w-8 place-items-center rounded-full shrink-0" style={{ background: primary }}>
                        <Send size={14} className="text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5">
                    <span className="text-[14px] font-medium text-[#111]">교환일기 알림 받기</span>
                    <FakeToggle primary={primary} defaultOn />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5">
                    <span className="text-[14px] font-medium text-[#111]">다크 모드</span>
                    <FakeToggle primary={primary} />
                  </div>
                </div>
              </CompCard>

              {/* 카드 */}
              <CompCard id="카드" title="카드 / 리스트 아이템" desc="교환일기 목록 카드">
                <div className="rounded-2xl border border-[#F0F0F0] overflow-hidden divide-y divide-[#FAFAFA]">
                  {[
                    { color: "#7C6EF5", title: "말하지 못한 것들에 대하여", viewers: 3, time: "방금 전", comments: 2, mine: true },
                    { color: "#F5866E", title: "봄날의 산책", viewers: 2, time: "3일 전", comments: 0, mine: false },
                    { color: "#6EC7F5", title: "오늘의 작은 성취", viewers: 0, time: "1주 전", comments: 1, mine: false },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-3 bg-white px-4 py-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl font-bold text-[22px] text-white" style={{ background: item.color }}>
                        {item.title.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[15px] font-semibold text-[#111] tracking-tight truncate flex-1">{item.title}</p>
                          {item.mine && <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${primary}15`, color: primary }}>내 글</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#AAA]">
                          <Eye size={11} /><span>{item.viewers}명이 읽었어요</span>
                          <span>·</span><span>{item.time}</span>
                        </div>
                        {item.comments > 0 && (
                          <div className="flex items-center gap-1 mt-0.5 text-[12px] text-[#AAA]">
                            <MessageCircle size={11} /><span>댓글 {item.comments}개</span>
                          </div>
                        )}
                      </div>
                      <MoreVertical size={18} className="text-[#D1D5DB] shrink-0" />
                    </div>
                  ))}
                </div>
              </CompCard>

              {/* 탭 */}
              <CompCard id="탭" title="탭" desc="교환일기 내/공유받은 전환 탭">
                <FancyTab primary={primary} />
              </CompCard>

              {/* 바텀시트 */}
              <CompCard id="시트" title="바텀시트" desc="공유·삭제 맥락 메뉴">
                <div className="rounded-[24px] border border-[#F0F0F0] bg-white px-5 pt-5 pb-6">
                  <p className="font-bold text-[16px] text-[#111] mb-1 tracking-tight truncate">말하지 못한 것들에 대하여</p>
                  <p className="text-[13px] text-[#9CA3AF] mb-4">공유 일기 · 3명이 읽었어요</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { icon: <Share2 size={16} />, label: "공유하기", desc: "초대 링크로 친구에게 공유" },
                      { icon: <Copy size={16} />,   label: "링크 복사", desc: "클립보드에 링크 복사" },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-3 rounded-2xl bg-[#F8F9FB] px-4 py-3.5">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: `${primary}15`, color: primary }}>{row.icon}</div>
                        <div>
                          <p className="text-[14px] font-semibold text-[#111]">{row.label}</p>
                          <p className="text-[11px] text-[#9CA3AF]">{row.desc}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-100 text-red-400"><Trash2 size={16} /></div>
                      <div>
                        <p className="text-[14px] font-semibold text-red-400">삭제하기</p>
                        <p className="text-[11px] text-red-300">삭제하면 댓글도 모두 사라져요</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CompCard>

              {/* 모달 */}
              <CompCard id="모달" title="모달" desc="비밀번호 잠금, 알림 성공, 삭제 확인">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 잠금 */}
                  <div className="rounded-2xl bg-[#F5F6F8] p-4 flex flex-col items-center gap-2.5">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${primary}18` }}>
                      <Lock size={22} style={{ color: primary }} />
                    </div>
                    <p className="text-[13px] font-bold text-center text-[#111]">비밀번호를 입력해 주세요</p>
                    <div className="w-full flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2">
                      <Lock size={13} className="text-[#CCC] shrink-0" />
                      <span className="text-[12px] text-[#CCC]">비밀번호</span>
                    </div>
                    <button className="w-full h-10 rounded-xl text-white text-[13px] font-bold" style={{ background: primary }}>열람하기</button>
                  </div>
                  {/* 알림 성공 */}
                  <div className="rounded-2xl bg-white border border-[#F0F0F0] p-4 flex flex-col items-center gap-2">
                    <span className="text-[36px]">🔔</span>
                    <p className="text-[13px] font-bold text-center text-[#111]">알림이 허용되었어요</p>
                    <p className="text-[11px] text-[#9CA3AF] text-center">새 알림이 오면 알려드릴게요.</p>
                    <button className="w-full h-10 rounded-xl text-white text-[13px] font-bold" style={{ background: primary }}>확인</button>
                  </div>
                  {/* 삭제 확인 */}
                  <div className="rounded-2xl bg-white border border-[#F0F0F0] p-4 flex flex-col items-center gap-2">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50">
                      <Trash2 size={22} className="text-red-400" />
                    </div>
                    <p className="text-[13px] font-bold text-center text-[#111]">일기를 삭제할까요?</p>
                    <p className="text-[11px] text-[#9CA3AF] text-center">댓글도 모두 사라져요.</p>
                    <div className="flex w-full gap-2 mt-1">
                      <button className="flex-1 h-10 rounded-xl bg-[#F3F4F6] text-[#666] text-[12px] font-semibold">취소</button>
                      <button className="flex-1 h-10 rounded-xl bg-red-500 text-white text-[12px] font-bold">삭제</button>
                    </div>
                  </div>
                </div>
              </CompCard>

            </div>
          </section>

          {/* ══ 아이콘 ═════════════════════════════════════════════════ */}
          <section id="icons">
            <SecHeader tag="Icons" title="아이콘 카탈로그"
              desc="Lucide React 아이콘을 사용합니다. strokeWidth={2}가 기본값입니다." />

            <div className="space-y-6">
              {ICON_GROUPS.map(({ label, icons }) => (
                <div key={label} className="rounded-2xl bg-white border border-[#F3F4F6] p-6 shadow-sm">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {icons.map(({ C, name }) => (
                      <button key={name} type="button"
                        onClick={() => { navigator.clipboard.writeText(`<${name} />`); setCopiedToken(`icon-${name}`); setTimeout(() => setCopiedToken(null), 1500); }}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-[#F3F4F6] p-3 w-[72px] transition hover:border-[var(--primary)] hover:bg-[#F9FAFB] group">
                        <C size={20} className="text-[#374151] group-hover:text-[var(--primary)] transition" strokeWidth={2} />
                        <span className="text-[9px] text-[#9CA3AF] text-center leading-tight break-all">
                          {copiedToken === `icon-${name}` ? "✓ 복사" : name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══ 모션 ═══════════════════════════════════════════════════ */}
          <section id="motion">
            <SecHeader tag="Motion" title="모션 & 애니메이션"
              desc="트랜지션 지속 시간과 이징 곡선 토큰입니다. 아래 버튼을 눌러 직접 확인할 수 있습니다." />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 지속 시간 */}
              <div className="rounded-2xl bg-white border border-[#F3F4F6] p-6 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-5">Duration</p>
                <div className="space-y-3">
                  {DURATIONS.map(ms => (
                    <DurationRow key={ms} ms={ms} primary={primary} />
                  ))}
                </div>
              </div>

              {/* 이징 */}
              <div className="rounded-2xl bg-white border border-[#F3F4F6] p-6 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] mb-5">Easing</p>
                <div className="space-y-4">
                  {EASINGS.map(({ name, value, usage }) => (
                    <EasingRow key={name} name={name} value={value} usage={usage} primary={primary} />
                  ))}
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* 푸터 */}
      <footer className="border-t border-[#EAECF0] bg-white mt-20">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: primary }}>
              <div className="h-2.5 w-2.5 rounded-full bg-white/90" />
            </div>
            <span className="text-[13px] text-[#9CA3AF]">안다미로 Design System v2.0</span>
          </div>
          <p className="text-[12px] text-[#D1D5DB]">oklch · Tailwind v4 · CSS Custom Properties · Lucide React</p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   소형 컴포넌트
   ───────────────────────────────────────────────────────────── */

function SecHeader({ tag, title, desc }: { tag: string; title: string; desc: string }) {
  return (
    <div className="mb-10">
      <p className="mb-2.5 inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--primary,#4B82F5)" }}>{tag}</p>
      <h2 className="text-[32px] font-bold text-[#111] tracking-tight mb-2.5">{title}</h2>
      <p className="text-[15px] text-[#6B7280] leading-relaxed max-w-[600px]">{desc}</p>
    </div>
  );
}

function CompCard({ id, title, desc, children }: { id: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div id={id} className="rounded-2xl bg-white border border-[#F3F4F6] p-6 shadow-sm">
      <p className="text-[16px] font-bold text-[#111] mb-0.5">{title}</p>
      <p className="text-[13px] text-[#9CA3AF] mb-5">{desc}</p>
      {children}
    </div>
  );
}

function DSBtn({ v, sz = "md", disabled, loading, children }: {
  v: "primary"|"outline"|"ghost"|"destructive";
  sz?: "sm"|"md"|"lg"; disabled?: boolean; loading?: boolean; children: React.ReactNode;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary:     { background: "var(--primary,#4B82F5)", color: "#fff" },
    outline:     { background: "#fff", color: "var(--primary,#4B82F5)", border: "1.5px solid var(--primary,#4B82F5)" },
    ghost:       { background: "transparent", color: "#6B7280", border: "1.5px solid #E5E7EB" },
    destructive: { background: "var(--destructive,#E7000B)", color: "#fff" },
  };
  const sizes = { sm: "h-8 px-4 text-[12px]", md: "h-10 px-5 text-[14px]", lg: "h-12 px-6 text-[16px]" };
  return (
    <button type="button" disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold tracking-tight rounded-[var(--radius,10px)] transition ${sizes[sz]} ${(disabled||loading) ? "opacity-40 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.97]"}`}
      style={styles[v]}>
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

function DSInput({ label, placeholder, type = "text", error }: { label: string; placeholder: string; type?: string; error?: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold text-[#374151]">{label}</p>
      <div className={`flex items-center gap-2 rounded-xl border bg-white px-4 h-[46px] ${error ? "border-red-400" : "border-[#E5E7EB]"}`}>
        <span className="flex-1 text-[14px] text-[#D1D5DB]">{placeholder}</span>
      </div>
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function FakeToggle({ primary, defaultOn = false }: { primary: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button type="button" onClick={() => setOn(p => !p)}
      className="relative h-[26px] w-[46px] rounded-full transition-colors duration-200 shrink-0"
      style={{ background: on ? primary : "#E5E7EB" }}>
      <span className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: on ? 22 : 3 }} />
    </button>
  );
}

function FancyTab({ primary }: { primary: string }) {
  const [tab, setTab] = useState<"my"|"shared">("my");
  const DIARY_DATA = {
    my: [
      { color: "#7C6EF5", title: "말하지 못한 것들에 대하여", viewers: 3, time: "방금 전" },
      { color: "#F5866E", title: "봄날의 산책", viewers: 2, time: "3일 전" },
    ],
    shared: [
      { color: "#6EC7F5", title: "오늘의 작은 성취", viewers: 1, time: "1주 전" },
      { color: "#6EF5B4", title: "새벽 세 시의 생각들", viewers: 4, time: "2주 전" },
    ],
  };
  return (
    <div className="rounded-xl border border-[#F0F0F0] overflow-hidden">
      <div className="flex bg-white">
        {(["my","shared"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="flex-1 py-3.5 text-[14px] font-semibold tracking-tight transition-all"
            style={tab===t ? { color: primary, borderBottom: `2px solid ${primary}` } : { color: "#CBD5E1", borderBottom: "2px solid transparent" }}>
            {t==="my" ? "내가 공유한" : "공유 받은"}
          </button>
        ))}
      </div>
      <div className="divide-y divide-[#FAFAFA] bg-[#FAFBFC]">
        {DIARY_DATA[tab].map(item => (
          <div key={item.title} className="flex items-center gap-3 px-4 py-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center text-white font-bold text-[14px] shrink-0" style={{ background: item.color }}>
              {item.title.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#111] truncate">{item.title}</p>
              <p className="text-[11px] text-[#AAA]">{item.viewers}명이 읽었어요 · {item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DurationRow({ ms, primary }: { ms: number; primary: string }) {
  const [active, setActive] = useState(false);
  return (
    <div className="flex items-center gap-4">
      <code className="w-14 shrink-0 font-mono text-[12px] font-semibold text-[#374151]">{ms}ms</code>
      <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all ease-out" style={{
          width: active ? "100%" : "0%",
          background: primary,
          transitionDuration: `${ms}ms`,
        }} />
      </div>
      <button type="button" onClick={() => { setActive(false); setTimeout(() => setActive(true), 50); }}
        className="shrink-0 rounded-lg border border-[#E5E7EB] px-3 h-7 text-[11px] font-medium text-[#6B7280] transition hover:bg-[#F9FAFB]">
        재생
      </button>
    </div>
  );
}

function EasingRow({ name, value, usage, primary }: { name: string; value: string; usage: string; primary: string }) {
  const [active, setActive] = useState(false);
  return (
    <div className="flex items-start gap-3">
      <button type="button"
        onClick={() => { setActive(false); setTimeout(() => setActive(true), 50); setTimeout(() => setActive(false), 600); }}
        className="relative shrink-0 h-10 w-10 rounded-xl border-2 border-[#E5E7EB] overflow-hidden cursor-pointer hover:border-[var(--primary)] transition">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full transition-all duration-500"
            style={{ background: primary, transform: active ? "translateX(8px)" : "translateX(-8px)", transitionTimingFunction: value }} />
        </div>
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-[#111]">{name}</p>
        <code className="block font-mono text-[10px] text-[#9CA3AF] truncate">{value}</code>
        <p className="text-[11px] text-[#6B7280] mt-0.5">{usage}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   화면 미리보기 드로어
   ───────────────────────────────────────────────────────────── */
function TokenDrawer({
  token,
  activeFile,
  onFileChange,
  onClose,
}: {
  token: { name: string; desc?: string; color?: string; files: string[]; tokenId: string };
  activeFile: string;
  onFileChange: (f: string) => void;
  onClose: () => void;
}) {
  const appBase = typeof window !== "undefined"
    ? window.location.href.split("/design")[0].replace(/\/$/, "")
    : "";
  const routeInfo = ROUTE_MAP[activeFile];
  const iframeSrc = routeInfo ? appBase + routeInfo.path : appBase + "/";

  /* 현재 선택된 파일의 사용 위치 노트 */
  const notes: string[] = USAGE_NOTES[token.tokenId]?.[activeFile] ?? [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* 패널 — 넓이 520px */}
      <div className="relative flex h-full w-[520px] flex-col bg-white shadow-2xl">

        {/* 헤더 */}
        <div className="flex items-start justify-between border-b border-[#F3F4F6] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            {token.color && (
              <div className="h-5 w-5 rounded-full border border-black/10 shrink-0"
                style={{ background: token.color }} />
            )}
            <div>
              <p className="text-[15px] font-bold text-[#111]">{token.name}</p>
              {token.desc && (
                <p className="text-[12px] text-[#9CA3AF] mt-0.5 leading-snug max-w-[360px]">{token.desc}</p>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="ml-2 shrink-0 rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition mt-0.5">
            <X size={15} />
          </button>
        </div>

        {/* 화면 탭 */}
        <div className="border-b border-[#F9FAFB] px-5 py-3 shrink-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#C5CAD3]">사용 화면</p>
          <div className="flex flex-wrap gap-1.5">
            {token.files.map(f => {
              const label = ROUTE_MAP[f]?.label ?? f;
              const isActive = f === activeFile;
              const hasNote = !!USAGE_NOTES[token.tokenId]?.[f];
              return (
                <button key={f} type="button" onClick={() => onFileChange(f)}
                  className="relative rounded-full px-3 py-1 text-[11px] font-medium transition"
                  style={isActive
                    ? { background: "var(--primary,#4B82F5)", color: "#fff" }
                    : { background: "#F3F4F6", color: "#6B7280" }}>
                  {label}
                  {/* 노트 있는 탭에 점 표시 */}
                  {hasNote && !isActive && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--primary,#4B82F5)] border border-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 본문: 좌(노트) + 우(폰 프레임) */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* 왼쪽 — 사용 위치 노트 */}
          <div className="flex w-[200px] shrink-0 flex-col border-r border-[#F3F4F6] overflow-y-auto">
            <div className="px-4 py-4">
              {/* 화면 이름 */}
              <div className="flex items-center gap-1.5 mb-3">
                <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--primary,#4B82F5)" }} />
                <p className="text-[12px] font-bold text-[#111]">
                  {routeInfo?.label ?? activeFile}
                </p>
              </div>

              {/* 사용 위치 목록 */}
              {notes.length > 0 ? (
                <>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#C5CAD3] mb-2">사용된 요소</p>
                  <ul className="space-y-2">
                    {notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[#CBD5E1]" />
                        <span className="text-[12px] leading-snug text-[#374151]">{note}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-[11px] text-[#C5CAD3] italic leading-snug">
                  세부 위치 정보 없음
                </p>
              )}

              {/* 경로 */}
              <div className="mt-5 pt-4 border-t border-[#F9FAFB]">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#C5CAD3] mb-1.5">경로</p>
                <code className="block text-[10px] font-mono text-[#9CA3AF] break-all">{routeInfo?.path ?? "/"}</code>
                <a href={appBase + (routeInfo?.path ?? "/")} target="_blank" rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--primary,#4B82F5)] hover:underline">
                  새 탭에서 열기 <Share2 size={9} />
                </a>
              </div>
            </div>
          </div>

          {/* 오른쪽 — 폰 프레임 */}
          <div className="flex flex-1 items-center justify-center overflow-auto bg-[#F7F8FA] p-5">
            <PhoneFrame src={iframeSrc} label={routeInfo?.label ?? activeFile} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   폰 프레임 — iframe을 iPhone 껍데기로 감쌈
   ───────────────────────────────────────────────────────────── */
function PhoneFrame({ src, label }: { src: string; label: string }) {
  const PHONE_W = 390;
  const PHONE_H = 844;
  const SCALE = 0.52;
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 폰 외각 */}
      <div
        className="relative overflow-hidden rounded-[36px] bg-black"
        style={{
          width: PHONE_W * SCALE,
          height: PHONE_H * SCALE,
          boxShadow: "0 0 0 3px #1A1A1A, 0 24px 48px rgba(0,0,0,0.30)",
        }}>
        {/* 다이나믹 아일랜드 */}
        <div
          className="absolute top-0 left-1/2 z-10 -translate-x-1/2 bg-black rounded-b-[12px]"
          style={{ width: 80 * SCALE, height: 24 * SCALE, marginTop: 6 * SCALE }} />

        {/* 로딩 shimmer */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F7F8FA]">
            <Loader2 size={20} className="animate-spin text-[#CBD5E1]" />
          </div>
        )}

        {/* iframe */}
        <iframe
          src={src}
          title={label}
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 border-none bg-white"
          style={{
            width: PHONE_W,
            height: PHONE_H,
            transformOrigin: "top left",
            transform: `scale(${SCALE})`,
            pointerEvents: "auto",
          }}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
      <p className="text-[12px] font-semibold text-[#6B7280]">{label}</p>
    </div>
  );
}
