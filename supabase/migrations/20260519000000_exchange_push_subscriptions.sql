CREATE TABLE IF NOT EXISTS exchange_push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS exchange_push_subscriptions_user_id_idx
  ON exchange_push_subscriptions(user_id);

ALTER TABLE exchange_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public access"
  ON exchange_push_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);
