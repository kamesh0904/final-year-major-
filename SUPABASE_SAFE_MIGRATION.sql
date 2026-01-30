-- =====================================================
-- SAFE POST-GAME QUESTIONNAIRE SYSTEM MIGRATION
-- This version handles existing tables and policies safely
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create table for post-game questionnaire responses (safe)
CREATE TABLE IF NOT EXISTS post_game_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_name TEXT NOT NULL,
    session_duration INTEGER NOT NULL, -- in seconds
    profile_category TEXT NOT NULL, -- ADHD, OCD, Anxiety, Depression
    questions JSONB NOT NULL, -- array of question texts
    responses JSONB NOT NULL, -- array of 1-5 scale responses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for tracking used questions (safe)
CREATE TABLE IF NOT EXISTS used_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_category TEXT NOT NULL,
    question_text TEXT NOT NULL,
    first_used_date DATE DEFAULT CURRENT_DATE,
    times_used INTEGER DEFAULT 1
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'used_questions_user_id_profile_category_question_text_key'
    ) THEN
        ALTER TABLE used_questions 
        ADD CONSTRAINT used_questions_user_id_profile_category_question_text_key 
        UNIQUE(user_id, profile_category, question_text);
    END IF;
END $$;

-- Create table for tracking daily cumulative session time per category (safe)
CREATE TABLE IF NOT EXISTS daily_session_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_category TEXT NOT NULL,
    total_duration INTEGER DEFAULT 0, -- cumulative seconds for the day
    questionnaire_completed BOOLEAN DEFAULT FALSE,
    session_date DATE DEFAULT CURRENT_DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'daily_session_tracking_user_id_profile_category_session_date_key'
    ) THEN
        ALTER TABLE daily_session_tracking 
        ADD CONSTRAINT daily_session_tracking_user_id_profile_category_session_date_key 
        UNIQUE(user_id, profile_category, session_date);
    END IF;
END $$;

-- Create indexes for efficient querying (safe)
CREATE INDEX IF NOT EXISTS idx_post_game_responses_user_date 
ON post_game_responses(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_post_game_responses_category 
ON post_game_responses(profile_category);

CREATE INDEX IF NOT EXISTS idx_used_questions_user_category 
ON used_questions(user_id, profile_category);

CREATE INDEX IF NOT EXISTS idx_daily_session_tracking_user_date 
ON daily_session_tracking(user_id, session_date);

-- Enable RLS (Row Level Security) - safe
ALTER TABLE post_game_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_session_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
-- This ensures we have the correct policies without conflicts

-- Policies for post_game_responses
DROP POLICY IF EXISTS "Users can view their own post-game responses" ON post_game_responses;
DROP POLICY IF EXISTS "Users can insert their own post-game responses" ON post_game_responses;

CREATE POLICY "Users can view their own post-game responses" 
ON post_game_responses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post-game responses" 
ON post_game_responses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policies for used_questions
DROP POLICY IF EXISTS "Users can view their own used questions" ON used_questions;
DROP POLICY IF EXISTS "Users can manage their own used questions" ON used_questions;

CREATE POLICY "Users can view their own used questions" 
ON used_questions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own used questions" 
ON used_questions FOR ALL 
USING (auth.uid() = user_id);

-- Policies for daily_session_tracking
DROP POLICY IF EXISTS "Users can view their own session tracking" ON daily_session_tracking;
DROP POLICY IF EXISTS "Users can manage their own session tracking" ON daily_session_tracking;

CREATE POLICY "Users can view their own session tracking" 
ON daily_session_tracking FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own session tracking" 
ON daily_session_tracking FOR ALL 
USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('post_game_responses', 'used_questions', 'daily_session_tracking')
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('post_game_responses'),
        ('used_questions'),
        ('daily_session_tracking')
) AS expected_tables(table_name);

-- Check if indexes were created
SELECT 
    indexname, 
    tablename,
    '✅ CREATED' as status
FROM pg_indexes 
WHERE tablename IN ('post_game_responses', 'used_questions', 'daily_session_tracking')
AND indexname LIKE 'idx_%';

-- Check if RLS policies were created
SELECT 
    tablename,
    policyname,
    '✅ ACTIVE' as status
FROM pg_policies 
WHERE tablename IN ('post_game_responses', 'used_questions', 'daily_session_tracking')
ORDER BY tablename, policyname;

-- Final success message
SELECT '🎉 MIGRATION COMPLETED SUCCESSFULLY! All tables, indexes, and policies are ready.' as result;