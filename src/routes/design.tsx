import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Home, BookOpen, ArrowLeftRight, User,
  Send, MoreHorizontal, Eye, MessageCircle, Bell, ChevronLeft,
} from "lucide-react";

export const Route = createFileRoute("/design")({
  head: () => ({ meta: [{ title: "디자인 가이드 — 안다미로" }] }),
  component: DesignPage,
});

// ── CSS 변수 → hex 읽기 (element trick) ───────────────────────────────────────
// 빌드 후 oklch가 rgb로 변환되는 경우에도 신뢰성 있게 읽기 위해
// 숨김 엘리먼트에 color: var(--X) 를 적용하고 getComputedStyle로 읽는다.

function readCssVarAsHex(varName: string): string {
  try {
    const el = document.createElement("span");
    el.style.cssText = `display:none;color:var(${varName})`;
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color; // "rgb(r, g, b)" or "rgba(..."
    document.body.removeChild(el);
    return rgbStringToHex(computed);
  } catch {
    return "#888888";
  }
}

function rgbStringToHex(rgb: string): string {
  // "rgb(75, 130, 245)" or "rgba(75, 130, 245, 1)"
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return "#888888";
  const h = (n: string) => parseInt(n).toString(16).padStart(2, "0");
  return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
}

// ── hex → oklch 변환 (저장용) ─────────────────────────────────────────────────

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

// ── 토큰 정의 ─────────────────────────────────────────────────────────────────

interface Token { key: string; label: string; group: string }

const TOKENS: Token[] = [
  { key: "primary",              label: "Primary",          group: "브랜드" },
  { key: "primary-light",        label: "Primary Light",    group: "브랜드" },
  { key: "brand-clover-active",  label: "클로버 Active",    group: "브랜드" },
  { key: "brand-clover-special", label: "클로버 Special",   group: "브랜드" },
  { key: "brand-clover-empty",   label: "배경 (빈 클로버)", group: "브랜드" },
  { key: "background",           label: "Background",       group: "기본" },
  { key: "foreground",           label: "Foreground",       group: "기본" },
  { key: "muted-foreground",     label: "Muted Text",       group: "기본" },
  { key: "destructive",          label: "Destructive",      group: "기본" },
  { key: "border",               label: "Border",           group: "기본" },
];

const RADIUS_KEY = "radius";
const LS_KEY = "andamiro_design_overrides";

function loadOverrides(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"); } catch { return {}; }
}
function saveOverrides(o: Record<string, string>) {
  localStorage.setItem(LS_KEY, JSON.stringify(o));
}
function applyOverrides(o: Record<string, string>) {
  for (const [k, v] of Object.entries(o)) {
    document.documentElement.style.setProperty(`--${k}`, v);
  }
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

function DesignPage() {
  const [hexValues, setHexValues] = useState<Record<string, string>>({});
  const [radius, setRadius] = useState(10);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // 초기화: 저장된 오버라이드 적용 후 element trick으로 실제 색상 읽기
  useEffect(() => {
    const saved = loadOverrides();
    applyOverrides(saved);
    setOverrides(saved);

    // 잠깐 기다려서 스타일이 완전히 적용된 뒤 읽기
    requestAnimationFrame(() => {
      const hexMap: Record<string, string> = {};
      for (const t of TOKENS) {
        hexMap[t.key] = readCssVarAsHex(`--${t.key}`);
      }
      setHexValues(hexMap);

      const styles = getComputedStyle(document.documentElement);
      const rawRadius = styles.getPropertyValue("--radius").trim();
      const remVal = parseFloat(rawRadius);
      setRadius(isNaN(remVal) ? 10 : Math.round(remVal * 16));
    });
  }, []);

  const handleColorChange = useCallback((key: string, hex: string) => {
    setHexValues((prev) => ({ ...prev, [key]: hex }));
    const [l, c, h] = hexToOklch(hex);
    const oklchVal = `oklch(${l} ${c} ${h})`;
    document.documentElement.style.setProperty(`--${key}`, oklchVal);
    const next = { ...overrides, [key]: oklchVal };
    setOverrides(next);
    saveOverrides(next);
  }, [overrides]);

  const handleRadiusChange = useCallback((px: number) => {
    setRadius(px);
    const remVal = `${(px / 16).toFixed(4)}rem`;
    document.documentElement.style.setProperty(`--${RADIUS_KEY}`, remVal);
    const next = { ...overrides, [RADIUS_KEY]: remVal };
    setOverrides(next);
    saveOverrides(next);
  }, [overrides]);

  const handleReset = useCallback(() => {
    for (const t of TOKENS) document.documentElement.style.removeProperty(`--${t.key}`);
    document.documentElement.style.removeProperty(`--${RADIUS_KEY}`);
    localStorage.removeItem(LS_KEY);
    setOverrides({});
    requestAnimationFrame(() => {
      const hexMap: Record<string, string> = {};
      for (const t of TOKENS) hexMap[t.key] = readCssVarAsHex(`--${t.key}`);
      setHexValues(hexMap);
      const styles = getComputedStyle(document.documentElement);
      const rawRadius = styles.getPropertyValue("--radius").trim();
      setRadius(Math.round(parseFloat(rawRadius) * 16));
    });
  }, []);

  const handleExportCSS = useCallback(() => {
    const lines = [":root {"];
    for (const [k, v] of Object.entries(overrides)) lines.push(`  --${k}: ${v};`);
    lines.push("}");
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [overrides]);

  const groups = [...new Set(TOKENS.map((t) => t.group))];
  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div className="min-h-screen bg-[#f0f2f7] font-sans">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 border-b border-[#e2e6ef] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg" style={{ background: "var(--primary)" }} />
            <span className="text-[17px] font-bold tracking-tight text-[#1a1a2e]">안다미로 디자인 시스템</span>
          </div>
          <div className="flex items-center gap-2">
            {hasOverrides && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-[#e2e6ef] bg-white px-4 py-2 text-[13px] font-medium text-[#666] transition hover:bg-[#f5f5f5]"
              >
                초기화
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCSS}
              disabled={!hasOverrides}
              className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--primary)" }}
            >
              {copied ? "복사됐어요 ✓" : "CSS 내보내기"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">

          {/* ── 왼쪽: 토큰 편집 패널 ── */}
          <aside className="flex flex-col gap-4">
            {groups.map((group) => (
              <section key={group} className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[#aaa]">{group} 색상</h2>
                <div className="flex flex-col gap-3">
                  {TOKENS.filter((t) => t.group === group).map((token) => {
                    const hex = hexValues[token.key] ?? "#cccccc";
                    const isChanged = overrides[token.key] !== undefined;
                    return (
                      <label key={token.key} className="flex cursor-pointer items-center justify-between gap-3 group">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-9 w-9 shrink-0 rounded-xl border border-black/8 shadow-sm transition group-hover:scale-105"
                            style={{ background: hex }}
                          />
                          <div>
                            <p className="text-[14px] font-medium text-[#222] leading-tight">
                              {token.label}
                              {isChanged && <span className="ml-1.5 text-[10px] text-[var(--primary)] font-semibold">수정됨</span>}
                            </p>
                            <p className="text-[11px] font-mono text-[#aaa] leading-tight">{hex.toUpperCase()}</p>
                          </div>
                        </div>
                        <input
                          type="color"
                          value={hex}
                          onChange={(e) => handleColorChange(token.key, e.target.value)}
                          className="h-9 w-9 cursor-pointer rounded-lg border border-[#e2e6ef] p-0.5 transition hover:scale-105"
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* 반경 */}
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[#aaa]">모서리 반경</h2>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={0} max={24} value={radius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="flex-1 accent-[var(--primary)]"
                  style={{ accentColor: "var(--primary)" }}
                />
                <span className="w-12 text-right text-[15px] font-bold text-[#222]">{radius}px</span>
              </div>
              <div className="mt-3 flex gap-2">
                {[0, 6, 10, 14, 20].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRadiusChange(r)}
                    className={`flex-1 py-2 text-[11px] font-medium transition border ${radius === r ? "border-[var(--primary)] text-[var(--primary)]" : "border-[#eee] text-[#aaa]"}`}
                    style={{ borderRadius: `${r}px` }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>

            {/* 변경된 값 */}
            {hasOverrides && (
              <section className="rounded-2xl bg-[#0f172a] p-5 shadow-sm">
                <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#475569]">변경된 CSS 변수</h2>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(overrides).map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-2">
                      <span className="text-[12px] font-mono text-[#6ee7b7] shrink-0">--{k}</span>
                      <span className="truncate text-right text-[11px] font-mono text-[#64748b]">{v}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>

          {/* ── 오른쪽: 컴포넌트 미리보기 ── */}
          <main className="flex flex-col gap-6">

            {/* 앱 프레임 미리보기 */}
            <PreviewCard title="앱 프레임 — 홈 / 교환일기">
              <div className="flex gap-4 overflow-x-auto pb-1">
                <AppFramePreview screen="home" />
                <AppFramePreview screen="exchange" />
              </div>
            </PreviewCard>

            {/* 버튼 */}
            <PreviewCard title="버튼">
              <div className="flex flex-wrap items-end gap-3">
                <button
                  className="h-[52px] px-7 rounded-[14px] text-[16px] font-semibold text-white transition hover:opacity-90"
                  style={{ background: "var(--primary)" }}
                >
                  다운로드 하기
                </button>
                <button
                  className="h-[52px] px-7 rounded-[14px] text-[16px] font-semibold transition hover:opacity-80 border"
                  style={{ borderColor: "var(--primary)", color: "var(--primary)", background: "white" }}
                >
                  링크 복사
                </button>
                <button
                  className="h-[52px] px-7 rounded-[14px] text-[16px] font-semibold text-white transition hover:opacity-90"
                  style={{ background: "var(--destructive)" }}
                >
                  삭제하기
                </button>
                <button
                  className="h-[52px] px-7 rounded-[14px] text-[16px] font-semibold text-white opacity-40 cursor-not-allowed"
                  style={{ background: "var(--primary)" }}
                  disabled
                >
                  비활성화
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  className="flex h-[52px] w-full max-w-[280px] items-center justify-center gap-3 rounded-[12px] border border-[#e2e2e2] bg-white shadow-sm transition active:scale-[0.99]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-[16px] font-semibold text-[#454545] tracking-[-0.48px]">Google 로 로그인</span>
                </button>
              </div>
            </PreviewCard>

            {/* 교환일기 카드 목록 */}
            <PreviewCard title="교환일기 카드">
              <ExchangeCardListPreview />
            </PreviewCard>

            {/* 탭 */}
            <PreviewCard title="탭 (교환일기 내 / 공유 받은)">
              <TabPreview />
            </PreviewCard>

            {/* 바텀 시트 */}
            <PreviewCard title="바텀시트">
              <BottomSheetPreview />
            </PreviewCard>

            {/* 알림 */}
            <PreviewCard title="알림 / 토스트">
              <NotifPreview />
            </PreviewCard>

            {/* 타이포그래피 */}
            <PreviewCard title="타이포그래피">
              <div className="flex flex-col gap-3" style={{ color: "var(--foreground)" }}>
                {[
                  { size: "22px", weight: "700", sample: "말하지 못한 것들에 대하여", label: "22/700 — 일기 제목" },
                  { size: "18px", weight: "700", sample: "데이터 백업", label: "18/700 — 페이지 타이틀" },
                  { size: "16px", weight: "600", sample: "Google 로 로그인", label: "16/600 — 버튼" },
                  { size: "15px", weight: "600", sample: "말하지 못한 것들에 대하여", label: "15/600 — 카드 제목" },
                  { size: "15px", weight: "400", sample: "오늘은 유난히 봄바람이 따뜻했다. 점심을 먹고 나서 공원을 한 바퀴 돌았는데…", label: "15/400 — 본문" },
                  { size: "14px", weight: "500", sample: "AI 감정일기 & 교환일기", label: "14/500 — 서브타이틀" },
                  { size: "12px", weight: "400", sample: "3명이 읽었어요 · 방금 전", label: "12/400 — 메타 텍스트" },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-[#f0f0f0] pb-3 last:border-0 last:pb-0">
                    <span className="flex-1 min-w-0" style={{ fontSize: row.size, fontWeight: row.weight, lineHeight: 1.4 }}>
                      {row.sample}
                    </span>
                    <span className="shrink-0 text-[11px] text-[#bbb] tabular-nums">{row.label}</span>
                  </div>
                ))}
              </div>
            </PreviewCard>

            {/* 커버 팔레트 */}
            <PreviewCard title="커버 컬러 팔레트">
              <div className="flex flex-wrap gap-3">
                {[
                  ["#7c6ef5","라벤더"],["#f5866e","코랄"],["#6ec7f5","스카이"],
                  ["#f5c96e","골드"],["#6ef5b4","민트"],["#f56ebd","핑크"],
                  ["#6e9df5","퍼플블루"],["#b4f56e","라임"],
                ].map(([c, name]) => (
                  <div key={c} className="flex flex-col items-center gap-1.5">
                    <div className="h-12 w-12 rounded-2xl shadow-sm" style={{ background: c }} />
                    <span className="text-[10px] text-[#999]">{name}</span>
                  </div>
                ))}
              </div>
            </PreviewCard>

          </main>
        </div>
      </div>
    </div>
  );
}

// ── 서브 컴포넌트들 ────────────────────────────────────────────────────────────

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-[11px] font-bold uppercase tracking-widest text-[#aaa]">{title}</h2>
      {children}
    </section>
  );
}

// 앱 프레임 미리보기 (홈 & 교환일기)
function AppFramePreview({ screen }: { screen: "home" | "exchange" }) {
  const COVER_COLORS = ["#7c6ef5","#f5866e","#6ec7f5","#f5c96e","#6ef5b4","#f56ebd"];
  return (
    <div
      className="shrink-0 rounded-[20px] border border-[#e8e8e8] overflow-hidden flex flex-col bg-white shadow-lg"
      style={{ width: 180, height: 320 }}
    >
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-[#f0f0f0]">
        {screen === "home" ? (
          <>
            <ChevronLeft className="h-4 w-4 text-[#222]" />
            <span className="text-[12px] font-bold text-[#222]">홈</span>
            <Bell className="h-4 w-4 text-[#222]" />
          </>
        ) : (
          <>
            <ChevronLeft className="h-4 w-4 text-[#222]" />
            <span className="text-[12px] font-bold text-[#222]">교환일기</span>
            <MoreHorizontal className="h-4 w-4 text-[#222]" />
          </>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        {screen === "home" ? (
          <div className="px-3 pt-2 flex flex-col gap-2">
            {/* 클로버 헤더 */}
            <div className="rounded-xl p-2" style={{ background: "var(--brand-clover-empty)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-[#222]">오늘의 클로버</span>
                <span className="text-[8px]" style={{ color: "var(--primary)" }}>5개</span>
              </div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-5 w-5 rounded-full" style={{ background: i <= 3 ? "var(--brand-clover-active)" : "var(--border)" }} />
                ))}
              </div>
            </div>
            {/* 일기 카드들 */}
            {[
              { color: "#7c6ef5", title: "말하지 못한" },
              { color: "#f5866e", title: "봄날의 산책" },
              { color: "#6ec7f5", title: "작은 성취" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg shrink-0 grid place-items-center text-white font-bold text-[11px]" style={{ background: item.color }}>
                  {item.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-[#222] truncate">{item.title}</p>
                  <p className="text-[8px] text-[#999]">방금 전</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {/* 탭 */}
            <div className="flex border-b border-[#f0f0f0]">
              {["내가 공유한", "공유 받은"].map((t, i) => (
                <button key={t} className={`flex-1 py-2 text-[9px] font-semibold ${i === 0 ? "border-b-2 border-[var(--primary)] text-[var(--primary)]" : "text-[#bbb]"}`}
                  style={i === 0 ? { borderColor: "var(--primary)", color: "var(--primary)" } : {}}>
                  {t}
                </button>
              ))}
            </div>
            {/* 카드 목록 */}
            {COVER_COLORS.slice(0, 3).map((c, i) => (
              <div key={c} className="flex items-center gap-2 px-3 py-2.5 border-b border-[#f5f5f5]">
                <div className="h-9 w-9 rounded-lg shrink-0 grid place-items-center text-white font-bold text-[13px]" style={{ background: c }}>
                  {["말","봄","작"][i]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-[#222] truncate">{["말하지 못한","봄날의 산책","작은 성취"][i]}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Eye className="h-2 w-2 text-[#bbb]" />
                    <span className="text-[8px] text-[#bbb]">{[3,2,0][i]}명 · {["방금","3일","1주"][i]} 전</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 바텀 탭 */}
      <div className="flex border-t border-[#f0f0f0] bg-white">
        {[
          { icon: Home, label: "홈", active: screen === "home" },
          { icon: BookOpen, label: "일기", active: false },
          { icon: ArrowLeftRight, label: "교환", active: screen === "exchange" },
          { icon: User, label: "마이", active: false },
        ].map(({ icon: Icon, label, active }) => (
          <div key={label} className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <Icon
              className="h-4 w-4"
              style={{ color: active ? "var(--primary)" : "#bbb" }}
              strokeWidth={2}
            />
            <span className="text-[7px] font-medium" style={{ color: active ? "var(--primary)" : "#bbb" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 교환일기 카드 목록
function ExchangeCardListPreview() {
  const items = [
    { color: "#7c6ef5", title: "말하지 못한 것들에 대하여", viewers: 3, time: "방금 전", comments: 2 },
    { color: "#f5866e", title: "봄날의 산책", viewers: 2, time: "3일 전", comments: 0 },
    { color: "#6ec7f5", title: "오늘의 작은 성취", viewers: 0, time: "1주 전", comments: 1 },
  ];
  return (
    <div className="flex flex-col divide-y divide-[#f0f0f0] rounded-2xl border border-[#f0f0f0] overflow-hidden">
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3 px-4 py-4 bg-white">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-xl font-bold text-[22px] text-white"
            style={{ background: item.color }}
          >
            {item.title.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#111] tracking-tight truncate">{item.title}</p>
            <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#aaa]">
              <Eye className="h-3 w-3" />
              <span>{item.viewers}명이 읽었어요</span>
              <span>·</span>
              <span>{item.time}</span>
            </div>
            {item.comments > 0 && (
              <div className="flex items-center gap-1 mt-0.5 text-[12px] text-[#aaa]">
                <MessageCircle className="h-3 w-3" />
                <span>댓글 {item.comments}개</span>
              </div>
            )}
          </div>
          <MoreHorizontal className="h-5 w-5 text-[#ccc] shrink-0" />
        </div>
      ))}
    </div>
  );
}

// 탭
function TabPreview() {
  const [tab, setTab] = useState<"my" | "shared">("my");
  return (
    <div className="rounded-xl border border-[#f0f0f0] overflow-hidden">
      <div className="flex bg-white border-b border-[#f0f0f0]">
        {(["my", "shared"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 py-3.5 text-[14px] font-semibold tracking-tight transition"
            style={tab === t
              ? { color: "var(--primary)", borderBottom: "2px solid var(--primary)" }
              : { color: "#bbb" }}
          >
            {t === "my" ? "내가 공유한" : "공유 받은"}
          </button>
        ))}
      </div>
      <div className="bg-[#f8f9fb] px-4 py-6 text-[13px] text-[#bbb] text-center">
        {tab === "my" ? "내가 작성한 교환일기 목록" : "초대받아 읽은 교환일기 목록"}
      </div>
    </div>
  );
}

// 바텀시트
function BottomSheetPreview() {
  return (
    <div className="rounded-t-[24px] bg-white px-5 pt-5 pb-6 border border-[#f0f0f0] rounded-b-2xl">
      <p className="font-bold text-[16px] text-[#222] mb-4 tracking-tight truncate">말하지 못한 것들에 대하여</p>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-2xl bg-[#f8f9fb] px-4 py-4 active:bg-[#f0f2f6] transition">
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
            style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}
          >
            <svg className="h-4 w-4" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <span className="text-[15px] font-medium text-[#222] tracking-tight">공유하기</span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-4">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-100">
            <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </div>
          <span className="text-[15px] font-medium text-red-400 tracking-tight">삭제하기</span>
        </div>
      </div>
    </div>
  );
}

// 알림 / 토스트
function NotifPreview() {
  return (
    <div className="flex flex-col gap-3">
      {/* 알림 허용 성공 모달 */}
      <div className="rounded-2xl bg-white border border-[#f0f0f0] px-6 py-5 flex flex-col items-center gap-2">
        <span className="text-[40px] leading-none">🔔</span>
        <p className="text-[17px] font-bold text-[#111] tracking-tight">알림이 허용되었어요</p>
        <p className="text-[13px] text-[#999] text-center">새 알림이 오면 알려드릴게요.</p>
        <button
          className="mt-2 w-full h-[48px] rounded-[12px] text-white text-[15px] font-semibold tracking-tight"
          style={{ background: "var(--primary)" }}
        >
          확인
        </button>
      </div>
      {/* 댓글 인풋 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border border-[#f0f0f0] rounded-2xl">
        <div className="h-[39px] flex-1 rounded-full bg-[#f4f6fa] px-4 flex items-center">
          <span className="text-[15px] text-[#bbb]">댓글을 입력하세요...</span>
        </div>
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
          style={{ background: "var(--primary)" }}
        >
          <Send className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  );
}
