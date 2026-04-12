-- NeuroNest: Chat Messages + Training Feedback Tables
-- Run this in Supabase SQL Editor

-- 1. Chat messages (persistent conversation history)
CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id  TEXT,                            -- groups messages per session
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at);

-- Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own messages" ON chat_messages
    FOR ALL USING (auth.uid() = user_id);

-- Service role bypass (backend uses service role key)
CREATE POLICY "Service role full access (chat_messages)" ON chat_messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 2. Chat feedback (thumbs up/down for training data)
CREATE TABLE IF NOT EXISTS chat_feedback (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id    TEXT NOT NULL,                 -- the AI message ID from the mobile app
    user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating        TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
    user_message  TEXT NOT NULL,                 -- the user turn
    ai_response   TEXT NOT NULL,                 -- the AI reply that was rated
    profile       TEXT DEFAULT 'General',        -- neurotype for persona-aware training
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_feedback_user  ON chat_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_feedback_rating ON chat_feedback(rating);

ALTER TABLE chat_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own feedback" ON chat_feedback
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access (chat_feedback)" ON chat_feedback
    FOR ALL TO service_role USING (true) WITH CHECK (true);
