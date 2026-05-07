import type { MoodKey } from "./videoStore";

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
