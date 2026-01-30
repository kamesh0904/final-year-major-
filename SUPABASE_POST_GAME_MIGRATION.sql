-- =====================================================
-- POST-GAME QUESTIONNAIRE SYSTEM MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create table for post-game questionnaire responses
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

-- Create table for tracking used questions (to prevent repetition)
CREATE TABLE IF NOT EXISTS used_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_category TEXT NOT NULL,
    question_text TEXT NOT NULL,
    first_used_date DATE DEFAULT CURRENT_DATE,
    times_used INTEGER DEFAULT 1,
    
    -- Ensure each question is tracked once per user per category
    UNIQUE(user_id, profile_category, question_text)
);

-- Create table for tracking daily cumulative session time per category
CREATE TABLE IF NOT EXISTS daily_session_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_category TEXT NOT NULL,
    total_duration INTEGER DEFAULT 0, -- cumulative seconds for the day
    questionnaire_completed BOOLEAN DEFAULT FALSE,
    session_date DATE DEFAULT CURRENT_DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One record per user per category per day
    UNIQUE(user_id, profile_category, session_date)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_post_game_responses_user_date 
ON post_game_responses(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_post_game_responses_category 
ON post_game_responses(profile_category);

CREATE INDEX IF NOT EXISTS idx_used_questions_user_category 
ON used_questions(user_id, profile_category);

CREATE INDEX IF NOT EXISTS idx_daily_session_tracking_user_date 
ON daily_session_tracking(user_id, session_date);

-- Enable RLS (Row Level Security)
ALTER TABLE post_game_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_session_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for post_game_responses
CREATE POLICY "Users can view their own post-game responses" 
ON post_game_responses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post-game responses" 
ON post_game_responses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for used_questions
CREATE POLICY "Users can view their own used questions" 
ON used_questions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own used questions" 
ON used_questions FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for daily_session_tracking
CREATE POLICY "Users can view their own session tracking" 
ON daily_session_tracking FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own session tracking" 
ON daily_session_tracking FOR ALL 
USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES (Optional - run to test)
-- =====================================================

-- Check if tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('post_game_responses', 'used_questions', 'daily_session_tracking');

-- Check if indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('post_game_responses', 'used_questions', 'daily_session_tracking');

-- Check if RLS policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('post_game_responses', 'used_questions', 'daily_session_tracking');