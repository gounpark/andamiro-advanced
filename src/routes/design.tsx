import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/design")({
  head: () => ({ meta: [{ title: "안다미로 디자인 시스템" }] }),
  component: DesignPage,
});

/* ─────────────────────────────────────────────────────────────────────────────
   색상 토큰 — styles.css oklch 값을 직접 계산한 hex (빌드 이후에도 정확함)
   ───────────────────────────────────────────────────────────────────────────── */

interface ColorToken {
  key: string;
  label: string;
  value: string; // hex
  description: string;
  group: "brand" | "semantic" | "neutral";
  on: "dark" | "light"; // 위에 올라갈 텍스트 색
}

const COLOR_TOKENS: ColorToken[] = [
  // Brand
  {
    key: "primary",
    label: "Primary",
    value: "#4B82F5",
    description: "주요 CTA, 버튼, 링크, 탭 인디케이터에 사용됩니다.",
    group: "brand",
    on: "dark",
  },
  {
    key: "primary-light",
    label: "Primary Light",
    value: "#A4C1FA",
    description: "배지, 선택 상태 배경, 호버 영역에 사용됩니다.",
    group: "brand",
    on: "dark",
  },
  {
    key: "brand-clover-active",
    label: "Clover Active",
    value: "#F9B602",
    description: "채워진 클로버 리프 아이콘, 골든 포인트 강조.",
    group: "brand",
    on: "dark",
  },
  {
    key: "brand-clover-special",
    label: "Clover Special",
    value: "#009A51",
    description: "스페셜 클로버, 성취·완료 상태 표시.",
    group: "brand",
    on: "dark",
  },
  {
    key: "brand-clover-empty",
    label: "App Background",
    value: "#E9EBEE",
    description: "앱 외부 배경(app-shell). 카드 바깥 공간.",
    group: "brand",
    on: "light",
  },
  // Semantic
  {
    key: "destructive",
    label: "Destructive",
    value: "#E7000B",
    description: "삭제, 경고, 오류 상태. 위험 동작 전용.",
    group: "semantic",
    on: "dark",
  },
  // Neutral
  {
    key: "foreground",
    label: "Foreground",
    value: "#020618",
    description: "기본 본문 텍스트, 아이콘. 거의 모든 텍스트.",
    group: "neutral",
    on: "dark",
  },
  {
    key: "muted-foreground",
    label: "Muted Foreground",
    value: "#62748E",
    description: "보조 텍스트, 메타 정보, 타임스탬프, 플레이스홀더.",
    group: "neutral",
    on: "dark",
  },
  {
    key: "background",
    label: "Background",
    value: "#FFFFFF",
    description: "카드, 모달, 바텀시트, 입력 필드 배경.",
    group: "neutral",
    on: "light",
  },
  {
    key: "border",
    label: "Border",
    value: "#E1E8F0",
    description: "구분선, 카드 테두리, 입력 필드 경계.",
    group: "neutral",
    on: "light",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   hex ↔ oklch 변환
   ───────────────────────────────────────────────────────────────────────────── */

function hexToOklch(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const rl = lin(r), gl = lin(g), bl = lin(b);
  const l_ = (0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl) ** (1 / 3);
  const m_ = (0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl) ** (1 / 3);
  const s_ = (0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl) ** (1 / 3);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const c = Math.sqrt(a * a + bv * bv);
  const h = ((Math.atan2(bv, a) * 180) / Math.PI + 360) % 360;
  return [+L.toFixed(3), +c.toFixed(3), +h.toFixed(1)];
}

/* ─────────────────────────────────────────────────────────────────────────────
   로컬스토리지
   ───────────────────────────────────────────────────────────────────────────── */

const LS_KEY = "andamiro_design_v2";

function loadSaved(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"); } catch { return {}; }
}
function save(o: Record<string, string>) {
  localStorage.setItem(LS_KEY, JSON.stringify(o));
}
function applyAll(o: Record<string, string>) {
  for (const [k, v] of Object.entries(o))
    document.documentElement.style.setProperty(`--${k}`, v);
}

/* ─────────────────────────────────────────────────────────────────────────────
   유틸
   ───────────────────────────────────────────────────────────────────────────── */

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/** 밝기 판단 (WCAG relative luminance) */
function isLight(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const lin = (v: number) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.4;
}

/* ─────────────────────────────────────────────────────────────────────────────
   타이포그래피 토큰
   ───────────────────────────────────────────────────────────────────────────── */

const TYPE_SCALE = [
  { size: 28, weight: 700, label: "Display", usage: "온보딩 헤드라인, 빈 상태 타이틀" },
  { size: 22, weight: 700, label: "Title 1", usage: "일기 제목, 모달 헤드라인" },
  { size: 18, weight: 700, label: "Title 2", usage: "페이지 헤더" },
  { size: 16, weight: 600, label: "Body Strong", usage: "버튼, 탭 레이블, 강조 텍스트" },
  { size: 15, weight: 600, label: "Body Semi", usage: "카드 제목, 리스트 아이템" },
  { size: 15, weight: 400, label: "Body", usage: "본문 텍스트, 댓글" },
  { size: 14, weight: 500, label: "Caption Strong", usage: "배지, 칩" },
  { size: 13, weight: 400, label: "Caption", usage: "섹션 레이블, 부제목" },
  { size: 12, weight: 400, label: "Micro", usage: "타임스탬프, 메타 텍스트" },
];

/* ─────────────────────────────────────────────────────────────────────────────
   메인 페이지
   ───────────────────────────────────────────────────────────────────────────── */

export default function DesignPage() {
  // hex 값 상태 (defaults → saved 오버라이드 적용)
  const [hexMap, setHexMap] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const t of COLOR_TOKENS) base[t.key] = t.value;
    return base;
  });
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [radius, setRadius] = useState(10);
  const [activeKey, setActiveKey] = useState<string | null>(null); // 현재 편집 중인 토큰
  const [exported, setExported] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);

  // 초기화
  useEffect(() => {
    const s = loadSaved();
    applyAll(s);
    setSaved(s);

    const next = { ...hexMap };
    for (const [k, oklch] of Object.entries(s)) {
      if (k === "radius") continue;
      // oklch → hex
      const m = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
      if (m) {
        // 저장된 oklch 값이 있으면 hexMap 갱신은 따로 안 해도 됨 (picking에서 처리)
        void m; // 나중에 필요하면 역변환
      }
    }
    setHexMap(next);

    // 반경
    const savedRadius = s["radius"];
    if (savedRadius) {
      setRadius(Math.round(parseFloat(savedRadius) * 16));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleColor = useCallback((key: string, hex: string) => {
    setHexMap((p) => ({ ...p, [key]: hex }));
    const [l, c, h] = hexToOklch(hex);
    const oklch = `oklch(${l} ${c} ${h})`;
    document.documentElement.style.setProperty(`--${key}`, oklch);
    const next = { ...saved, [key]: oklch };
    setSaved(next);
    save(next);
  }, [saved]);

  const handleRadius = useCallback((px: number) => {
    setRadius(px);
    const rem = `${(px / 16).toFixed(4)}rem`;
    document.documentElement.style.setProperty("--radius", rem);
    const next = { ...saved, radius: rem };
    setSaved(next);
    save(next);
  }, [saved]);

  const handleReset = useCallback(() => {
    for (const t of COLOR_TOKENS)
      document.documentElement.style.removeProperty(`--${t.key}`);
    document.documentElement.style.removeProperty("--radius");
    localStorage.removeItem(LS_KEY);
    const base: Record<string, string> = {};
    for (const t of COLOR_TOKENS) base[t.key] = t.value;
    setHexMap(base);
    setSaved({});
    setRadius(10);
  }, []);

  const handleExport = useCallback(() => {
    if (!Object.keys(saved).length) return;
    const lines = [":root {", ...Object.entries(saved).map(([k, v]) => `  --${k}: ${v};`), "}"];
    navigator.clipboard.writeText(lines.join("\n"));
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }, [saved]);

  const hasChanges = Object.keys(saved).length > 0;
  const groups: ColorToken["group"][] = ["brand", "semantic", "neutral"];
  const groupLabel = { brand: "브랜드", semantic: "시맨틱", neutral: "뉴트럴" };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', sans-serif" }}
      className="min-h-screen bg-[#F7F8FA]"
    >
      {/* ── 상단 헤더 ── */}
      <header className="sticky top-0 z-40 border-b border-[#EAECF0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 h-16">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: hexMap["primary"] ?? "#4B82F5" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" fill="white" fillOpacity="0.9" />
                <circle cx="7" cy="4" r="1.5" fill={hexMap["primary"] ?? "#4B82F5"} />
              </svg>
            </div>
            <div>
              <span className="text-[15px] font-bold text-[#111]">안다미로</span>
              <span className="ml-2 text-[13px] text-[#999]">Design System</span>
            </div>
          </div>

          {/* 내비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            {["colors", "typography", "radius", "components"].map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#666] transition hover:bg-[#F4F5F7] hover:text-[#111]"
              >
                {{ colors: "컬러", typography: "타이포그래피", radius: "반경", components: "컴포넌트" }[id]}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-[#EAECF0] bg-white px-4 h-9 text-[13px] font-medium text-[#666] transition hover:border-[#d0d0d0] hover:text-[#333]"
                >
                  초기화
                </button>
                <button
                  onClick={handleExport}
                  className="rounded-lg h-9 px-4 text-[13px] font-semibold text-white transition hover:opacity-90 active:scale-95"
                  style={{ background: hexMap["primary"] ?? "#4B82F5" }}
                >
                  {exported ? "복사 완료 ✓" : "CSS 내보내기"}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-8 py-12 space-y-20">

        {/* ══ 컬러 ══════════════════════════════════════════════════════════════ */}
        <section id="colors">
          <SectionHeader
            label="Color"
            title="컬러 시스템"
            desc="안다미로의 모든 색상은 oklch 색공간 기반으로 정의되어 있습니다. 스와치를 클릭하면 실시간으로 편집할 수 있으며, CSS 변수로 즉시 반영됩니다."
          />

          {groups.map((group) => {
            const tokens = COLOR_TOKENS.filter((t) => t.group === group);
            return (
              <div key={group} className="mb-10">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#B0B7C3]">
                  {groupLabel[group]}
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {tokens.map((token) => {
                    const hex = hexMap[token.key] ?? token.value;
                    const light = isLight(hex);
                    const textColor = light ? "#111827" : "#FFFFFF";
                    const subColor = light ? "#4B5563" : "rgba(255,255,255,0.65)";
                    const changed = saved[token.key] !== undefined;
                    return (
                      <div key={token.key} className="group overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-sm transition hover:shadow-md">
                        {/* 스와치 */}
                        <div
                          className="relative cursor-pointer"
                          style={{ background: hex, height: 120 }}
                          onClick={() => {
                            setActiveKey(token.key);
                            setTimeout(() => pickerRef.current?.click(), 0);
                          }}
                        >
                          {/* 호버 오버레이 */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            style={{ background: "rgba(0,0,0,0.15)" }}>
                            <div className="rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#111]">
                              편집
                            </div>
                          </div>
                          {changed && (
                            <div className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold" style={{ color: hexMap["primary"] ?? "#4B82F5" }}>
                              수정됨
                            </div>
                          )}
                          {/* 토큰 이름 */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-[13px] font-bold leading-tight" style={{ color: textColor }}>
                              {token.label}
                            </p>
                            <p className="mt-0.5 font-mono text-[11px]" style={{ color: subColor }}>
                              {hex.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        {/* 설명 + 토큰 이름 */}
                        <div className="px-3.5 py-3">
                          <p className="font-mono text-[10px] text-[#B0B7C3] mb-1.5">--{token.key}</p>
                          <p className="text-[12px] text-[#6B7280] leading-relaxed">{token.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 숨김 color picker */}
          <input
            ref={pickerRef}
            type="color"
            className="sr-only"
            value={activeKey ? (hexMap[activeKey] ?? "#000000") : "#000000"}
            onChange={(e) => { if (activeKey) handleColor(activeKey, e.target.value); }}
          />

          {/* 커버 팔레트 */}
          <div className="mt-2">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#B0B7C3]">커버 팔레트 (일기 썸네일)</p>
            <div className="flex gap-3 flex-wrap">
              {[
                { hex: "#7C6EF5", name: "라벤더" },
                { hex: "#F5866E", name: "코랄" },
                { hex: "#6EC7F5", name: "스카이" },
                { hex: "#F5C96E", name: "골드" },
                { hex: "#6EF5B4", name: "민트" },
                { hex: "#F56EBD", name: "핑크" },
                { hex: "#6E9DF5", name: "인디고" },
                { hex: "#B4F56E", name: "라임" },
              ].map(({ hex, name }) => (
                <div key={hex} className="flex flex-col items-center gap-2">
                  <div
                    className="h-16 w-16 rounded-2xl shadow-sm border border-black/[0.06]"
                    style={{ background: hex }}
                  />
                  <div className="text-center">
                    <p className="text-[12px] font-medium text-[#374151]">{name}</p>
                    <p className="font-mono text-[10px] text-[#9CA3AF]">{hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 타이포그래피 ═══════════════════════════════════════════════════════ */}
        <section id="typography">
          <SectionHeader
            label="Typography"
            title="타이포그래피 스케일"
            desc="시스템 폰트 스택 기반. 한국어 가독성을 위해 tracking-tight(-0.02em) 기본 적용."
          />

          <div className="rounded-2xl border border-[#EAECF0] bg-white overflow-hidden shadow-sm">
            {/* 헤더 */}
            <div className="grid grid-cols-[120px_1fr_180px] gap-4 border-b border-[#F3F4F6] px-8 py-3">
              {["스타일", "미리보기", "사용처"].map((h) => (
                <p key={h} className="text-[11px] font-bold uppercase tracking-widest text-[#B0B7C3]">{h}</p>
              ))}
            </div>

            {TYPE_SCALE.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[120px_1fr_180px] gap-4 items-center px-8 py-5 ${i !== TYPE_SCALE.length - 1 ? "border-b border-[#F9FAFB]" : ""}`}
              >
                {/* 메타 */}
                <div>
                  <p className="text-[12px] font-bold text-[#374151]">{row.label}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-[#9CA3AF]">{row.size}/{row.weight}</p>
                </div>

                {/* 스펙 */}
                <p
                  style={{
                    fontSize: row.size,
                    fontWeight: row.weight,
                    lineHeight: 1.35,
                    letterSpacing: "-0.02em",
                    color: "#111827",
                  }}
                  className="min-w-0 truncate"
                >
                  {row.size >= 20
                    ? "말하지 못한 것들에 대하여"
                    : row.size >= 16
                    ? "Google 로 로그인 — 안다미로"
                    : row.size >= 14
                    ? "오늘은 유난히 봄바람이 따뜻했다. 점심을 먹고 나서 공원을 한 바퀴 돌았는데…"
                    : "3명이 읽었어요 · 방금 전 · 댓글 2개"}
                </p>

                {/* 사용처 */}
                <p className="text-[12px] text-[#9CA3AF] leading-relaxed">{row.usage}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ 반경 ══════════════════════════════════════════════════════════════ */}
        <section id="radius">
          <SectionHeader
            label="Border Radius"
            title="모서리 반경"
            desc="--radius 를 조정하면 모든 컴포넌트의 곡률이 연동됩니다."
          />

          <div className="rounded-2xl border border-[#EAECF0] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-6 mb-8">
              <input
                type="range" min={0} max={24} value={radius}
                onChange={(e) => handleRadius(Number(e.target.value))}
                className="flex-1 h-1.5 appearance-none rounded-full outline-none cursor-pointer"
                style={{ accentColor: hexMap["primary"] ?? "#4B82F5" }}
              />
              <div className="w-20 text-right">
                <span className="text-[22px] font-bold text-[#111]">{radius}</span>
                <span className="text-[14px] text-[#9CA3AF] ml-1">px</span>
              </div>
            </div>

            {/* 반경 단계별 프리뷰 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "radius-sm", calc: Math.max(0, radius - 4) },
                { label: "radius (base)", calc: radius },
                { label: "radius-lg", calc: radius },
                { label: "radius-xl", calc: radius + 4 },
              ].map(({ label, calc }) => (
                <div key={label} className="flex flex-col items-center gap-3">
                  <div
                    className="h-20 w-full border-2 border-[#EAECF0]"
                    style={{ borderRadius: calc, background: `${hexMap["primary"] ?? "#4B82F5"}18` }}
                  />
                  <div className="text-center">
                    <p className="font-mono text-[11px] text-[#6B7280]">{label}</p>
                    <p className="font-mono text-[12px] font-bold text-[#111]">{calc}px</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 컴포넌트 ══════════════════════════════════════════════════════════ */}
        <section id="components">
          <SectionHeader
            label="Components"
            title="컴포넌트"
            desc="실제 앱에서 사용 중인 컴포넌트입니다. 위 컬러·반경을 수정하면 아래 컴포넌트에 즉시 반영됩니다."
          />

          <div className="grid gap-6 lg:grid-cols-2">

            {/* 버튼 */}
            <ComponentCard title="버튼" desc="앱 전체에서 사용되는 버튼 스타일">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <Btn variant="primary">다운로드 하기</Btn>
                  <Btn variant="outline">링크 복사</Btn>
                  <Btn variant="destructive">삭제하기</Btn>
                  <Btn variant="primary" disabled>비활성화</Btn>
                </div>
                <div className="flex gap-3 items-center">
                  <GoogleBtn />
                </div>
                <div className="flex gap-3">
                  <Btn variant="primary" size="sm">확인</Btn>
                  <Btn variant="ghost" size="sm">취소</Btn>
                </div>
              </div>
            </ComponentCard>

            {/* 입력 필드 */}
            <ComponentCard title="입력 필드" desc="일기 작성, 비밀번호, 댓글 입력">
              <div className="flex flex-col gap-3">
                <FakeInput label="일기 제목" placeholder="제목을 입력하세요" />
                <FakeInput label="비밀번호" placeholder="비밀번호" type="password" />
                <FakeInput label="댓글" placeholder="댓글을 입력하세요..." suffix />
                <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5">
                  <span className="text-[14px] text-[#111] flex-1">교환일기 알림 받기</span>
                  <FakeToggle />
                </div>
              </div>
            </ComponentCard>

            {/* 교환일기 카드 */}
            <ComponentCard title="교환일기 카드" desc="교환일기 목록에서 사용되는 리스트 아이템">
              <div className="rounded-2xl border border-[#F0F0F0] overflow-hidden divide-y divide-[#F9F9F9]">
                {[
                  { color: "#7C6EF5", title: "말하지 못한 것들에 대하여", viewers: 3, time: "방금 전", comments: 2 },
                  { color: "#F5866E", title: "봄날의 산책", viewers: 2, time: "3일 전", comments: 0 },
                  { color: "#6EC7F5", title: "오늘의 작은 성취", viewers: 0, time: "1주 전", comments: 1 },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3 bg-white px-4 py-4">
                    <div
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-xl font-bold text-[22px] text-white"
                      style={{ background: item.color }}
                    >
                      {item.title.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#111] tracking-tight truncate">{item.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#AAA]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>{item.viewers}명이 읽었어요 · {item.time}</span>
                      </div>
                      {item.comments > 0 && (
                        <div className="flex items-center gap-1 mt-0.5 text-[12px] text-[#AAA]">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <span>댓글 {item.comments}개</span>
                        </div>
                      )}
                    </div>
                    <svg className="h-5 w-5 text-[#D1D5DB] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
                    </svg>
                  </div>
                ))}
              </div>
            </ComponentCard>

            {/* 탭 */}
            <ComponentCard title="탭" desc="교환일기 내 / 공유받은 전환 탭">
              <TabPreview primary={hexMap["primary"] ?? "#4B82F5"} />
            </ComponentCard>

            {/* 바텀시트 */}
            <ComponentCard title="바텀시트" desc="공유하기 / 삭제 등의 맥락 메뉴">
              <div className="rounded-[24px] bg-white border border-[#F0F0F0] px-5 pt-5 pb-6 shadow-sm">
                <p className="font-bold text-[16px] text-[#222] mb-4 tracking-tight">말하지 못한 것들에 대하여</p>
                <div className="flex flex-col gap-2">
                  <SheetRow icon="share" label="공유하기" primary={hexMap["primary"] ?? "#4B82F5"} />
                  <SheetRow icon="trash" label="삭제하기" danger />
                </div>
              </div>
            </ComponentCard>

            {/* 모달 */}
            <ComponentCard title="모달 / 알림" desc="비밀번호 잠금, 알림 허용 성공 등">
              <div className="flex gap-4">
                {/* 잠금 모달 */}
                <div className="flex-1 rounded-2xl bg-[#F5F6F8] p-5 flex flex-col items-center gap-3">
                  <div
                    className="grid h-14 w-14 place-items-center rounded-2xl"
                    style={{ background: `${hexMap["primary"] ?? "#4B82F5"}18` }}
                  >
                    <svg className="h-6 w-6" style={{ color: hexMap["primary"] ?? "#4B82F5" }} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <p className="text-[15px] font-bold text-[#111] text-center">비밀번호를 입력해 주세요</p>
                  <div className="w-full flex items-center gap-2 rounded-xl bg-white border border-[#E8E8E8] px-3 py-2.5">
                    <svg className="h-4 w-4 text-[#AAA] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className="text-[14px] text-[#CCC]">비밀번호</span>
                  </div>
                  <Btn variant="primary" className="w-full">열람하기</Btn>
                </div>
                {/* 알림 성공 */}
                <div className="flex-1 rounded-2xl bg-white border border-[#F0F0F0] p-5 flex flex-col items-center gap-2">
                  <span className="text-[40px]">🔔</span>
                  <p className="text-[15px] font-bold text-[#111] text-center">알림이 허용되었어요</p>
                  <p className="text-[12px] text-[#999] text-center">새 알림이 오면 알려드릴게요.</p>
                  <Btn variant="primary" className="w-full mt-1">확인</Btn>
                </div>
              </div>
            </ComponentCard>

          </div>

          {/* 앱 프레임 풀 미리보기 */}
          <div className="mt-6 rounded-2xl border border-[#EAECF0] bg-white p-8 shadow-sm">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#B0B7C3]">앱 화면 미리보기</p>
            <p className="mb-6 text-[14px] text-[#6B7280]">실제 앱의 주요 화면을 축소한 목업입니다.</p>
            <div className="flex gap-5 overflow-x-auto pb-2">
              {(["exchange", "room", "my"] as const).map((screen) => (
                <AppMockup key={screen} screen={screen} primary={hexMap["primary"] ?? "#4B82F5"} cloverActive={hexMap["brand-clover-active"] ?? "#F9B602"} cloverBg={hexMap["brand-clover-empty"] ?? "#E9EBEE"} />
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* 푸터 */}
      <footer className="mt-20 border-t border-[#EAECF0] bg-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-6">
          <p className="text-[13px] text-[#9CA3AF]">안다미로 Design System · v1.0</p>
          <p className="text-[13px] text-[#9CA3AF]">CSS custom properties · oklch · Tailwind v4</p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   소형 컴포넌트들
   ───────────────────────────────────────────────────────────────────────────── */

function SectionHeader({ label, title, desc }: { label: string; title: string; desc: string }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--primary, #4B82F5)" }}>{label}</p>
      <h2 className="text-[28px] font-bold text-[#111] tracking-tight mb-2">{title}</h2>
      <p className="text-[15px] text-[#6B7280] leading-relaxed max-w-[600px]">{desc}</p>
    </div>
  );
}

function ComponentCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-sm">
      <p className="text-[15px] font-bold text-[#111] mb-0.5">{title}</p>
      <p className="text-[13px] text-[#9CA3AF] mb-5">{desc}</p>
      {children}
    </div>
  );
}

function Btn({
  variant,
  size = "md",
  disabled,
  children,
  className = "",
}: {
  variant: "primary" | "outline" | "destructive" | "ghost";
  size?: "md" | "sm";
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const base = "inline-flex items-center justify-center font-semibold tracking-tight transition rounded-[var(--radius,10px)] select-none";
  const sizeClass = size === "md" ? "h-[48px] px-6 text-[15px]" : "h-[36px] px-4 text-[13px]";
  const variantStyle: Record<string, React.CSSProperties> = {
    primary: { background: "var(--primary, #4B82F5)", color: "#fff" },
    outline: { background: "#fff", color: "var(--primary, #4B82F5)", border: "1.5px solid var(--primary, #4B82F5)" },
    destructive: { background: "var(--destructive, #E7000B)", color: "#fff" },
    ghost: { background: "transparent", color: "#6B7280", border: "1.5px solid #E5E7EB" },
  };
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} ${sizeClass} ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]"} ${className}`}
      style={variantStyle[variant]}
    >
      {children}
    </button>
  );
}

function GoogleBtn() {
  return (
    <button
      type="button"
      className="flex h-[52px] w-full max-w-[280px] items-center justify-center gap-3 rounded-[12px] border border-[#E2E2E2] bg-white shadow-sm transition hover:bg-[#f9f9f9] active:scale-[0.99]"
    >
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span className="text-[16px] font-semibold text-[#454545] tracking-[-0.48px]">Google 로 로그인</span>
    </button>
  );
}

function FakeInput({ label, placeholder, type = "text", suffix }: { label: string; placeholder: string; type?: string; suffix?: boolean }) {
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium text-[#374151]">{label}</p>
      <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 h-[48px]">
        <span className="flex-1 text-[15px] text-[#D1D5DB]">{placeholder}</span>
        {suffix && (
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: "var(--primary, #4B82F5)" }}>
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

function FakeToggle() {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOn((p) => !p)}
      className="relative h-6 w-11 rounded-full transition-colors duration-200"
      style={{ background: on ? "var(--primary, #4B82F5)" : "#E5E7EB" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: on ? "calc(100% - 22px)" : 2 }}
      />
    </button>
  );
}

function TabPreview({ primary }: { primary: string }) {
  const [tab, setTab] = useState<"my" | "shared">("my");
  return (
    <div className="rounded-xl border border-[#F0F0F0] overflow-hidden">
      <div className="flex bg-white">
        {(["my", "shared"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 py-3.5 text-[14px] font-semibold tracking-tight transition"
            style={tab === t
              ? { color: primary, borderBottom: `2px solid ${primary}` }
              : { color: "#CBD5E1", borderBottom: "2px solid transparent" }}
          >
            {t === "my" ? "내가 공유한" : "공유 받은"}
          </button>
        ))}
      </div>
      <div className="bg-[#F8F9FB] px-5 py-8 text-center">
        <p className="text-[13px] text-[#CBD5E1]">
          {tab === "my" ? "내가 작성한 교환일기 목록" : "초대받아 읽은 교환일기 목록"}
        </p>
      </div>
    </div>
  );
}

function SheetRow({ icon, label, danger, primary }: { icon: "share" | "trash"; label: string; danger?: boolean; primary?: string }) {
  const bg = danger ? "#FEF2F2" : "#F8F9FB";
  const iconBg = danger ? "#FEE2E2" : `${primary ?? "#4B82F5"}18`;
  const color = danger ? "#F87171" : (primary ?? "#4B82F5");
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5" style={{ background: bg }}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: iconBg }}>
        {icon === "share" ? (
          <svg className="h-4 w-4" style={{ color }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        ) : (
          <svg className="h-4 w-4" style={{ color }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        )}
      </div>
      <span className="text-[15px] font-medium tracking-tight" style={{ color: danger ? "#F87171" : "#222" }}>{label}</span>
    </div>
  );
}

function AppMockup({ screen, primary, cloverActive, cloverBg }: { screen: "exchange" | "room" | "my"; primary: string; cloverActive: string; cloverBg: string }) {
  const labels = { exchange: "교환일기 목록", room: "일기 상세", my: "마이페이지" };
  const W = 160, H = 300;
  const covers = ["#7C6EF5","#F5866E","#6EC7F5"];
  const titles = ["말하지 못한","봄날의 산책","작은 성취"];

  return (
    <div className="shrink-0 flex flex-col gap-2">
      <div
        className="rounded-[22px] border border-[#E5E7EB] bg-white overflow-hidden flex flex-col shadow-md"
        style={{ width: W, height: H }}
      >
        {/* 상태바 */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[8px] font-bold text-[#111]">9:41</span>
          <div className="flex gap-1 items-center">
            <div className="h-1.5 w-3.5 rounded-[2px] border border-[#555]">
              <div className="h-full w-2/3 rounded-[1px] bg-[#555]" />
            </div>
          </div>
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-3 pb-2 border-b border-[#F5F5F5]">
          <div className="h-4 w-4 rounded-full bg-[#F0F0F0]" />
          <span className="text-[10px] font-bold text-[#111]">{labels[screen]}</span>
          <div className="h-4 w-4 rounded-full bg-[#F0F0F0]" />
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-hidden">
          {screen === "exchange" && (
            <div>
              {/* 탭 */}
              <div className="flex border-b border-[#F5F5F5]">
                {["내가 공유한", "공유 받은"].map((t, i) => (
                  <div key={t} className="flex-1 py-2 text-center">
                    <span
                      className="text-[8px] font-semibold"
                      style={i === 0 ? { color: primary, borderBottom: `1.5px solid ${primary}`, paddingBottom: 2 } : { color: "#CCC" }}
                    >{t}</span>
                  </div>
                ))}
              </div>
              {covers.map((c, i) => (
                <div key={c} className="flex items-center gap-2 px-3 py-2.5 border-b border-[#FAFAFA]">
                  <div className="h-9 w-9 rounded-lg shrink-0 grid place-items-center text-white font-bold text-[12px]" style={{ background: c }}>
                    {titles[i].charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold text-[#111] truncate">{titles[i]}</p>
                    <p className="text-[7px] text-[#BBB] mt-0.5">👁 3명 · 방금 전</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {screen === "room" && (
            <div>
              <div className="h-24 w-full" style={{ background: covers[0] }} />
              <div className="px-3 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="h-5 w-5 rounded-full" style={{ background: covers[0] }} />
                  <div>
                    <p className="text-[8px] font-semibold text-[#111]">작성자</p>
                    <p className="text-[7px] text-[#BBB]">방금 전</p>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-[#111] mb-1">말하지 못한 것들에 대하여</p>
                <div className="flex gap-1 mb-2">
                  {["일상","감정"].map(k => (
                    <span key={k} className="text-[7px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${primary}20`, color: primary }}>#{k}</span>
                  ))}
                </div>
                <p className="text-[8px] text-[#555] leading-relaxed line-clamp-3">오늘은 유난히 봄바람이 따뜻했다. 점심을 먹고 나서…</p>
              </div>
            </div>
          )}
          {screen === "my" && (
            <div className="px-3 pt-3">
              <div className="flex flex-col items-center pb-3 border-b border-[#F5F5F5]">
                <div className="h-12 w-12 rounded-full mb-2" style={{ background: primary }} />
                <p className="text-[10px] font-bold text-[#111]">홍길동</p>
                <p className="text-[8px] text-[#BBB]">hong@gmail.com</p>
              </div>
              {[["🔔","알림 설정"],["💾","데이터 백업"],["🎨","디자인 가이드"]].map(([ico, name]) => (
                <div key={name} className="flex items-center gap-2 py-2.5 border-b border-[#FAFAFA]">
                  <span className="text-[12px]">{ico}</span>
                  <span className="text-[9px] font-medium text-[#333]">{name}</span>
                </div>
              ))}
              {/* 클로버 */}
              <div className="mt-2 rounded-lg p-2" style={{ background: cloverBg }}>
                <p className="text-[8px] font-bold text-[#555] mb-1">오늘의 클로버 5/5</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-4 w-4 rounded-full" style={{ background: i <= 5 ? cloverActive : "#DDD" }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 바텀 탭 */}
        <div className="flex border-t border-[#F5F5F5] bg-white">
          {[
            { label: "홈", active: false },
            { label: "일기", active: false },
            { label: "교환", active: screen === "exchange" || screen === "room" },
            { label: "마이", active: screen === "my" },
          ].map(({ label, active }) => (
            <div key={label} className="flex-1 flex flex-col items-center py-2 gap-0.5">
              <div className="h-3 w-3 rounded-sm" style={{ background: active ? primary : "#E5E7EB" }} />
              <span className="text-[6px] font-medium" style={{ color: active ? primary : "#CCC" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-[11px] text-[#9CA3AF]">{labels[screen]}</p>
    </div>
  );
}
