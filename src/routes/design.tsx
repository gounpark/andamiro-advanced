import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/design")({
  head: () => ({ meta: [{ title: "디자인 가이드 — 안다미로" }] }),
  component: DesignPage,
});

// ── oklch ↔ hex 변환 유틸 ──────────────────────────────────────────────────

function oklchToHex(l: number, c: number, h: number): string {
  // oklch → linear sRGB via oklab
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const lc = l_ ** 3, mc = m_ ** 3, sc = s_ ** 3;

  let r = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  let g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  let bv = -0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc;

  // linear → sRGB gamma
  const gamma = (v: number) => {
    v = Math.max(0, Math.min(1, v));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  };

  const toHex = (v: number) => Math.round(gamma(v) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bv)}`;
}

function hexToOklch(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // sRGB → linear
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

function parseOklch(val: string): [number, number, number] | null {
  const m = val.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!m) return null;
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}

// ── 편집 가능한 토큰 정의 ──────────────────────────────────────────────────

interface Token {
  key: string;       // CSS variable name (without --)
  label: string;
  group: string;
}

const TOKENS: Token[] = [
  { key: "primary", label: "Primary", group: "브랜드" },
  { key: "primary-light", label: "Primary Light", group: "브랜드" },
  { key: "brand-clover-active", label: "클로버 Active", group: "브랜드" },
  { key: "brand-clover-special", label: "클로버 Special", group: "브랜드" },
  { key: "brand-clover-empty", label: "배경", group: "브랜드" },
  { key: "background", label: "Background", group: "기본" },
  { key: "foreground", label: "Foreground", group: "기본" },
  { key: "secondary", label: "Secondary", group: "기본" },
  { key: "muted-foreground", label: "Muted Text", group: "기본" },
  { key: "destructive", label: "Destructive", group: "기본" },
  { key: "border", label: "Border", group: "기본" },
];

const RADIUS_KEY = "radius";

// ── 로컬스토리지 키 ───────────────────────────────────────────────────────
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

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────

function DesignPage() {
  const [hexValues, setHexValues] = useState<Record<string, string>>({});
  const [radius, setRadius] = useState(10); // px
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // 초기화: CSS 변수 읽기 + 저장된 오버라이드 적용
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const saved = loadOverrides();
    applyOverrides(saved);
    setOverrides(saved);

    const hexMap: Record<string, string> = {};
    for (const t of TOKENS) {
      const raw = (saved[t.key] ?? styles.getPropertyValue(`--${t.key}`)).trim();
      const parsed = parseOklch(raw);
      hexMap[t.key] = parsed ? oklchToHex(...parsed) : "#888888";
    }

    const rawRadius = (saved[RADIUS_KEY] ?? styles.getPropertyValue(`--${RADIUS_KEY}`)).trim();
    const remVal = parseFloat(rawRadius);
    setRadius(isNaN(remVal) ? 10 : Math.round(remVal * 16));
    setHexValues(hexMap);
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
    // 값 재읽기
    const styles = getComputedStyle(document.documentElement);
    const hexMap: Record<string, string> = {};
    for (const t of TOKENS) {
      const raw = styles.getPropertyValue(`--${t.key}`).trim();
      const parsed = parseOklch(raw);
      hexMap[t.key] = parsed ? oklchToHex(...parsed) : "#888888";
    }
    const rawRadius = styles.getPropertyValue(`--${RADIUS_KEY}`).trim();
    setRadius(Math.round(parseFloat(rawRadius) * 16));
    setHexValues(hexMap);
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

  return (
    <div className="min-h-screen bg-[#f0f2f7] font-sans">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 border-b border-[#e2e6ef] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-[var(--primary)]" />
            <span className="text-[17px] font-bold tracking-tight text-[#1a1a2e]">안다미로 디자인 가이드</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-[#e2e6ef] bg-white px-4 py-2 text-[13px] font-medium text-[#666] transition hover:bg-[#f5f5f5]"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={handleExportCSS}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
            >
              {copied ? "복사됐어요 ✓" : "CSS 복사"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">

          {/* ── 왼쪽: 토큰 편집 패널 ── */}
          <aside className="flex flex-col gap-4">

            {/* 색상 토큰 */}
            {groups.map((group) => (
              <section key={group} className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-[#999]">{group}</h2>
                <div className="flex flex-col gap-3">
                  {TOKENS.filter((t) => t.group === group).map((token) => (
                    <label key={token.key} className="flex cursor-pointer items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-8 w-8 shrink-0 rounded-lg border border-black/5 shadow-sm"
                          style={{ background: hexValues[token.key] ?? "#eee" }}
                        />
                        <span className="text-[14px] font-medium text-[#333]">{token.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono text-[#999]">
                          {(hexValues[token.key] ?? "#------").toUpperCase()}
                        </span>
                        <input
                          type="color"
                          value={hexValues[token.key] ?? "#4b82f5"}
                          onChange={(e) => handleColorChange(token.key, e.target.value)}
                          className="h-8 w-8 cursor-pointer rounded-md border border-[#e2e6ef] p-0.5"
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            ))}

            {/* 반경 */}
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-[#999]">반경 (Radius)</h2>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={radius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-right text-[14px] font-semibold text-[#333]">{radius}px</span>
              </div>
            </section>

            {/* 오버라이드 목록 */}
            {Object.keys(overrides).length > 0 && (
              <section className="rounded-2xl bg-[#1a1a2e] p-5 shadow-sm">
                <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-[#666]">변경된 값</h2>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(overrides).map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-2">
                      <span className="text-[12px] font-mono text-[#6ee7b7]">--{k}</span>
                      <span className="truncate text-right text-[11px] font-mono text-[#94a3b8]">{v}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>

          {/* ── 오른쪽: 컴포넌트 미리보기 ── */}
          <main className="flex flex-col gap-6">

            {/* 버튼 */}
            <PreviewCard title="버튼">
              <div className="flex flex-wrap items-center gap-3">
                <button className="rounded-[var(--radius-lg)] bg-[var(--primary)] px-5 py-2.5 text-[15px] font-semibold text-white transition hover:opacity-90 active:scale-[0.98]">
                  Primary
                </button>
                <button className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-5 py-2.5 text-[15px] font-semibold text-[var(--foreground)] transition hover:bg-[var(--secondary)]">
                  Secondary
                </button>
                <button className="rounded-[var(--radius-lg)] bg-[var(--destructive)] px-5 py-2.5 text-[15px] font-semibold text-white transition hover:opacity-90">
                  Destructive
                </button>
                <button disabled className="rounded-[var(--radius-lg)] bg-[var(--primary)] px-5 py-2.5 text-[15px] font-semibold text-white opacity-40">
                  Disabled
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button className="h-[52px] w-full max-w-[280px] rounded-[12px] bg-[var(--primary)] text-[16px] font-semibold text-white">
                  다운로드 하기
                </button>
                <button className="h-[52px] flex items-center justify-center gap-3 rounded-[12px] border border-[#e2e2e2] bg-white px-5">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-[16px] font-semibold text-[#454545]">Google 로 로그인</span>
                </button>
              </div>
            </PreviewCard>

            {/* 카드 */}
            <PreviewCard title="카드 / 리스트">
              <div className="flex flex-col divide-y divide-[var(--border)] rounded-[var(--radius-xl)] border border-[var(--border)] bg-white overflow-hidden">
                {[
                  { color: "#7c6ef5", title: "말하지 못한 것들에 대하여", viewers: 3, time: "방금 전", comments: 2 },
                  { color: "#f5866e", title: "봄날의 산책", viewers: 3, time: "3일 전", comments: 0 },
                  { color: "#6ec7f5", title: "오늘의 작은 성취", viewers: 0, time: "3일 전", comments: 0 },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3 px-4 py-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-white font-bold text-xl" style={{ background: item.color }}>
                      {item.title.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-[#222] tracking-tight truncate">{item.title}</p>
                      <p className="mt-1 text-[12px] text-[#999]">👁 {item.viewers}명이 읽었어요 · {item.time}</p>
                      {item.comments > 0 && <p className="text-[12px] text-[#999]">💬 댓글 {item.comments}개</p>}
                    </div>
                  </div>
                ))}
              </div>
            </PreviewCard>

            {/* 탭 */}
            <PreviewCard title="탭">
              <TabPreview />
            </PreviewCard>

            {/* 바텀시트 */}
            <PreviewCard title="바텀시트">
              <div className="rounded-t-[24px] bg-white px-5 pt-5 pb-6 border border-[var(--border)]">
                <p className="font-bold text-[16px] text-[#222] mb-4 truncate">말하지 못한 것들에 대하여</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f8f9fb] px-4 py-4">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--primary)]/10">
                      <svg className="h-4 w-4 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                    </div>
                    <span className="text-[15px] font-medium text-[#222]">공유하기</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-4">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-100">
                      <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </div>
                    <span className="text-[15px] font-medium text-red-400">삭제하기</span>
                  </div>
                </div>
              </div>
            </PreviewCard>

            {/* 색상 팔레트 */}
            <PreviewCard title="커버 컬러 팔레트">
              <div className="flex flex-wrap gap-3">
                {["#7c6ef5","#f5866e","#6ec7f5","#f5c96e","#6ef5b4","#f56ebd","#6e9df5","#b4f56e"].map((c) => (
                  <div key={c} className="flex flex-col items-center gap-1.5">
                    <div className="h-12 w-12 rounded-xl shadow-sm" style={{ background: c }} />
                    <span className="text-[10px] font-mono text-[#999]">{c}</span>
                  </div>
                ))}
              </div>
            </PreviewCard>

            {/* 타이포그래피 */}
            <PreviewCard title="타이포그래피">
              <div className="flex flex-col gap-3 text-[var(--foreground)]">
                {[
                  { size: "24px", weight: "bold", label: "24 Bold — 페이지 타이틀", sample: "안다미로" },
                  { size: "18px", weight: "600", label: "18 Semibold — 헤더", sample: "데이터 백업" },
                  { size: "16px", weight: "600", label: "16 Semibold — 버튼", sample: "Google 로 로그인" },
                  { size: "15px", weight: "700", label: "15 Bold — 카드 제목", sample: "말하지 못한 것들에 대하여" },
                  { size: "14px", weight: "500", label: "14 Medium — 본문", sample: "AI 감정일기 & 교환일기" },
                  { size: "12px", weight: "400", label: "12 Regular — 메타", sample: "3명이 읽었어요 · 방금 전" },
                ].map((row) => (
                  <div key={row.size} className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                    <span style={{ fontSize: row.size, fontWeight: row.weight }}>{row.sample}</span>
                    <span className="shrink-0 text-[11px] text-[#bbb]">{row.label}</span>
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

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-widest text-[#999]">{title}</h2>
      {children}
    </section>
  );
}

function TabPreview() {
  const [tab, setTab] = useState<"my" | "shared">("my");
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="flex bg-white border-b border-[var(--border)]">
        {(["my", "shared"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[14px] font-semibold tracking-tight transition ${
              tab === t
                ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                : "text-[#bbb]"
            }`}
          >
            {t === "my" ? "내가 공유한" : "공유 받은"}
          </button>
        ))}
      </div>
      <div className="bg-[var(--secondary)] px-4 py-5 text-[13px] text-[var(--muted-foreground)] text-center">
        {tab === "my" ? "내가 공유한 일기 목록" : "공유 받은 일기 목록"}
      </div>
    </div>
  );
}
