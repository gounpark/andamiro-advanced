export type MoodKey = "best" | "good" | "okay" | "bad" | "worst";

export interface VideoRecord {
  videoUrl: string;
  aiMood: MoodKey | "surprised" | null;
  aiMoodLabel: string;
  aiConfidence: number;
  rawExpressions: Partial<Record<string, number>>;
  userMood: MoodKey | null;
  userMoodLabel: string | null;
  transcript: string; // 음성 인식 텍스트
}

let _record: VideoRecord | null = null;

export function setVideoRecord(data: VideoRecord): void {
  if (_record?.videoUrl) URL.revokeObjectURL(_record.videoUrl);
  _record = data;
}

export function getVideoRecord(): VideoRecord | null {
  return _record;
}

export function clearVideoRecord(): void {
  if (_record?.videoUrl) URL.revokeObjectURL(_record.videoUrl);
  _record = null;
}
