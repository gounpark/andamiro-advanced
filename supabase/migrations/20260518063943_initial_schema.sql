-- 교환일기 스키마 (초기 + 모든 ALTER 포함)

CREATE TABLE IF NOT EXISTS exchange_diaries (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  password TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  image_data_url TEXT,
  keywords TEXT[] DEFAULT '{}',
  viewer_ids TEXT[] DEFAULT '{}',
  viewer_names TEXT[] DEFAULT '{}',
  viewer_avatars TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exchange_comments (
  id TEXT PRIMARY KEY,
  diary_id TEXT NOT NULL REFERENCES exchange_diaries(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  body TEXT NOT NULL,
  parent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE exchange_diaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public access" ON exchange_diaries;
CREATE POLICY "public access" ON exchange_diaries FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE exchange_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public access" ON exchange_comments;
CREATE POLICY "public access" ON exchange_comments FOR ALL USING (true) WITH CHECK (true);
