import type { MoodKey, EmotionSnapshot } from "./videoStore";

export interface DiaryEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  createdAt: number;
  userMood: MoodKey;
  userMoodLabel: string;
  aiMood: MoodKey | "surprised" | null;
  aiMoodLabel: string;
  aiConfidence: number;
  transcript: string;
  hasVideo: boolean;
  emotionTimeline?: EmotionSnapshot[];
}

const STORAGE_KEY = "andamiro_diary_v1";

function loadAll(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DiaryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveAll(entries: DiaryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function saveDiaryEntry(entry: Omit<DiaryEntry, "id" | "createdAt">): DiaryEntry {
  const entries = loadAll();
  const newEntry: DiaryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };
  saveAll([newEntry, ...entries]);
  return newEntry;
}

export function getDiaryEntries(): DiaryEntry[] {
  return loadAll();
}

export function getDiaryEntriesByDate(date: string): DiaryEntry[] {
  return loadAll().filter((e) => e.date === date);
}

export function deleteDiaryEntry(id: string): void {
  saveAll(loadAll().filter((e) => e.id !== id));
}

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateMinusDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 오늘 기준 연속 기록 일수 계산 */
export function calcStreak(entries?: DiaryEntry[]): number {
  const all = entries ?? loadAll();
  const uniqueDates = [...new Set(all.map((e) => e.date))].sort((a, b) => b.localeCompare(a));
  if (!uniqueDates.length) return 0;

  const today = todayString();
  const yesterday = dateMinusDays(today, 1);

  // 오늘이나 어제 기록이 없으면 streak 없음
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  let streak = 0;
  let cursor = uniqueDates[0]; // 가장 최근 날짜부터
  for (const date of uniqueDates) {
    if (date === cursor) {
      streak++;
      cursor = dateMinusDays(cursor, 1);
    } else {
      break; // 연속 끊김
    }
  }
  return streak;
}

/** 이번 달 기록 수 */
export function countThisMonth(entries?: DiaryEntry[]): number {
  const all = entries ?? loadAll();
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return all.filter((e) => e.date.startsWith(prefix)).length;
}
