-- NeuroNest: Mood Logs table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mood_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score      INT  NOT NULL CHECK (score BETWEEN 1 AND 10),
    note       TEXT,
    logged_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user ON mood_logs(user_id, logged_at);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own moods" ON mood_logs
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access (mood_logs)" ON mood_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
