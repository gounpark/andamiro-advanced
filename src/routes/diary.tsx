import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Trash2, Video, Mic } from "lucide-react";
import { getDiaryEntries, deleteDiaryEntry, type DiaryEntry } from "@/lib/diaryStore";
import type { MoodKey } from "@/lib/videoStore";

import moodBest from "@/assets/moods/mood-best.webp";
import moodGood from "@/assets/moods/mood-good.webp";
import moodOkay from "@/assets/moods/mood-okay.webp";
import moodBad from "@/assets/moods/mood-bad.webp";
import moodWorst from "@/assets/moods/mood-worst.webp";

export const Route = createFileRoute("/diary")({
  head: () => ({
    meta: [{ title: "일기 기록 — 안다미로" }, { name: "theme-color", content: "#ffffff" }],
  }),
  component: DiaryPage,
});

const MOOD_META: Record<MoodKey, { label: string; thumb: string; emoji: string }> = {
  best: { label: "최고예요!", thumb: moodBest, emoji: "🤩" },
  good: { label: "좋아요!", thumb: moodGood, emoji: "😊" },
  okay: { label: "보통이에요", thumb: moodOkay, emoji: "😐" },
  bad: { label: "별로예요", thumb: moodBad, emoji: "😔" },
  worst: { label: "최악이에요", thumb: moodWorst, emoji: "😭" },
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

function groupByDate(entries: DiaryEntry[]): { date: string; items: DiaryEntry[] }[] {
  const map = new Map<string, DiaryEntry[]>();
  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}

function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>(() => getDiaryEntries());

  const handleDelete = (id: string) => {
    deleteDiaryEntry(id);
    setEntries(getDiaryEntries());
  };

  const grouped = groupByDate(entries);

  return (
    <div className="app-shell">
      <div className="app-frame flex flex-col" style={{ background: "#f5f6f8" }}>
        {/* 헤더 */}
        <header className="relative shrink-0 flex items-center justify-center px-4 pt-[52px] pb-3 bg-white border-b border-[#f0f0f0]">
          <Link
            to="/my"
            aria-label="뒤로"
            className="absolute left-3 top-[50px] grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:text-foreground"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
          </Link>
          <h1 className="font-semibold text-foreground text-[16px] tracking-tight">
            영상 일기 기록
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pt-32 gap-3">
              <p className="text-[32px]">📭</p>
              <p className="text-[15px] font-semibold text-foreground/60 tracking-tight">
                아직 기록이 없어요
              </p>
              <p className="text-[13px] text-foreground/40 tracking-tight">
                영상으로 기록하기를 사용해보세요
              </p>
              <Link
                to="/record"
                className="mt-4 rounded-full bg-[var(--primary)] px-5 py-2.5 text-white text-[13px] font-semibold tracking-tight"
              >
                기록하러 가기
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6 px-4 pt-5">
              {grouped.map(({ date, items }) => (
                <div key={date}>
                  {/* 날짜 헤더 */}
                  <p className="text-[12px] font-semibold text-[#9a9aa3] mb-2 tracking-tight">
                    {formatDate(date)}
                  </p>
                  <div className="flex flex-col gap-3">
                    {items.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onDelete={() => handleDelete(entry.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryCard({ entry, onDelete }: { entry: DiaryEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const mood = entry.userMood as MoodKey;
  const meta = MOOD_META[mood] ?? MOOD_META.okay;

  const confirmDelete = () => {
    if (window.confirm("이 기록을 삭제할까요?")) onDelete();
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* 카드 헤더 */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#f8f8f8] transition"
        onClick={() => setExpanded((v) => !v)}
      >
        <img src={meta.thumb} alt={meta.label} className="h-11 w-11 object-contain shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground text-[15px] tracking-tight">
              {meta.emoji} {meta.label}
            </span>
            {entry.hasVideo && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-[var(--primary)] bg-[var(--primary)]/8 rounded px-1.5 py-0.5">
                <Video className="h-2.5 w-2.5" /> 영상
              </span>
            )}
            {entry.transcript && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-[#666] bg-[#f0f0f0] rounded px-1.5 py-0.5">
                <Mic className="h-2.5 w-2.5" /> 음성
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#9a9aa3] mt-0.5 tracking-tight">
            {formatTime(entry.createdAt)}
            {entry.aiMood && entry.aiMood !== "surprised" && (
              <span className="ml-2 text-cyan-500">· AI: {entry.aiMoodLabel}</span>
            )}
          </p>
        </div>
        <span className="text-[11px] text-[#bbb] shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* 확장 영역 */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#f5f5f5]">
          {/* AI vs 사용자 감정 */}
          <div className="flex gap-2 mt-3">
            <div className="flex-1 rounded-xl bg-cyan-50 border border-cyan-100 px-3 py-2.5">
              <p className="text-[10px] font-semibold text-cyan-600 tracking-tight mb-0.5">
                🤖 AI 분석
              </p>
              <p className="font-bold text-foreground text-[13px] tracking-tight">
                {entry.aiMood === "surprised"
                  ? "😮 놀람"
                  : entry.aiMood
                    ? entry.aiMoodLabel
                    : "감지 안 됨"}
              </p>
              {entry.aiConfidence > 0 && (
                <p className="text-[10px] text-[#999] mt-0.5">
                  {Math.round(entry.aiConfidence * 100)}% 확신
                </p>
              )}
            </div>
            <div className="flex-1 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/15 px-3 py-2.5">
              <p className="text-[10px] font-semibold text-[var(--primary)] tracking-tight mb-0.5">
                👤 내 선택
              </p>
              <p className="font-bold text-foreground text-[13px] tracking-tight">
                {entry.userMoodLabel}
              </p>
            </div>
          </div>

          {/* 음성 기록 */}
          {entry.transcript && (
            <div className="mt-3 rounded-xl bg-[#f7f7f9] px-3.5 py-3">
              <p className="text-[11px] font-semibold text-[#666] mb-1.5">🎙 음성 기록</p>
              <p className="text-[13px] leading-relaxed text-foreground/85 tracking-tight">
                {entry.transcript}
              </p>
            </div>
          )}

          {/* 삭제 버튼 */}
          <button
            type="button"
            onClick={confirmDelete}
            className="mt-3 flex items-center gap-1.5 text-[12px] text-red-400 font-medium tracking-tight"
          >
            <Trash2 className="h-3.5 w-3.5" />
            기록 삭제
          </button>
        </div>
      )}
    </div>
  );
}
