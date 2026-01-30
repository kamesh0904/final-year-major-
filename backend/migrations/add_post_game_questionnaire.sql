-- Add post-game questionnaire system for weekly reports
-- This tracks user responses to targeted questions after game sessions
-- Updated to support cumulative session tracking and question history

-- Create table for post-game questionnaire responses
CREATE TABLE IF NOT EXISTS post_game_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_name TEXT NOT NULL,
    session_duration INTEGER NOT NULL, -- in seconds
    profile_category TEXT NOT NULL, -- ADHD, OCD, Anxiety, Depression
    questions JSONB NOT NULL, -- array of question texts
    responses JSONB NOT NULL, -- array of boolean responses (true/false)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Allow multiple questionnaires per day, but track them separately
    CONSTRAINT unique_questionnaire_per_session UNIQUE(user_id, profile_category, created_at)
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

-- Enable RLS
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

-- Function to add session time and check if questionnaire should be triggered
CREATE OR REPLACE FUNCTION add_session_time_and_check(
    p_user_id UUID,
    p_profile_category TEXT,
    p_session_duration INTEGER
) RETURNS TABLE(
    should_trigger_questionnaire BOOLEAN,
    total_duration INTEGER,
    available_questions_count INTEGER
) AS $$
DECLARE
    current_total INTEGER := 0;
    questionnaire_done BOOLEAN := FALSE;
    available_count INTEGER := 0;
BEGIN
    -- Insert or update daily session tracking
    INSERT INTO daily_session_tracking (user_id, profile_category, total_duration, session_date)
    VALUES (p_user_id, p_profile_category, p_session_duration, CURRENT_DATE)
    ON CONFLICT (user_id, profile_category, session_date)
    DO UPDATE SET 
        total_duration = daily_session_tracking.total_duration + p_session_duration,
        last_updated = NOW();
    
    -- Get current totals
    SELECT 
        dst.total_duration, 
        dst.questionnaire_completed
    INTO current_total, questionnaire_done
    FROM daily_session_tracking dst
    WHERE dst.user_id = p_user_id 
    AND dst.profile_category = p_profile_category 
    AND dst.session_date = CURRENT_DATE;
    
    -- Count available questions (total 50 minus used questions)
    SELECT (50 - COALESCE(COUNT(*), 0))
    INTO available_count
    FROM used_questions uq
    WHERE uq.user_id = p_user_id 
    AND uq.profile_category = p_profile_category;
    
    -- Return results
    RETURN QUERY SELECT 
        (current_total >= 300 AND NOT questionnaire_done AND available_count > 0)::BOOLEAN as should_trigger_questionnaire,
        current_total as total_duration,
        available_count as available_questions_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unused questions for a category
CREATE OR REPLACE FUNCTION get_unused_questions(
    p_user_id UUID,
    p_profile_category TEXT,
    p_limit INTEGER DEFAULT 5
) RETURNS TEXT[] AS $$
DECLARE
    all_questions TEXT[];
    used_questions_array TEXT[];
    unused_questions TEXT[];
    result_questions TEXT[];
BEGIN
    -- This would need to be populated with actual questions from your question bank
    -- For now, return a placeholder that the backend will handle
    SELECT ARRAY[]::TEXT[] INTO result_questions;
    
    RETURN result_questions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark questions as used
CREATE OR REPLACE FUNCTION mark_questions_as_used(
    p_user_id UUID,
    p_profile_category TEXT,
    p_questions TEXT[]
) RETURNS VOID AS $$
DECLARE
    question_text TEXT;
BEGIN
    FOREACH question_text IN ARRAY p_questions
    LOOP
        INSERT INTO used_questions (user_id, profile_category, question_text)
        VALUES (p_user_id, p_profile_category, question_text)
        ON CONFLICT (user_id, profile_category, question_text)
        DO UPDATE SET 
            times_used = used_questions.times_used + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark questionnaire as completed for today
CREATE OR REPLACE FUNCTION mark_daily_questionnaire_completed(
    p_user_id UUID,
    p_profile_category TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE daily_session_tracking
    SET questionnaire_completed = TRUE
    WHERE user_id = p_user_id 
    AND profile_category = p_profile_category 
    AND session_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset daily tracking (called by cron job at midnight)
CREATE OR REPLACE FUNCTION reset_daily_tracking() RETURNS VOID AS $$
BEGIN
    -- This function can be called by a cron job to reset daily tracking
    -- For now, the reset happens automatically due to date-based uniqueness
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;