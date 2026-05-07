CREATE TABLE IF NOT EXISTS usage_counters (
  app_user_id    TEXT PRIMARY KEY,
  tier           TEXT NOT NULL CHECK (tier IN ('starter','premium')),
  period_start   TIMESTAMPTZ NOT NULL,
  image_count    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_usage_counters_period ON usage_counters(period_start);

