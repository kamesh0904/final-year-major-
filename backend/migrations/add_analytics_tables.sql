-- Enhanced Analytics System - Database Migration
-- Creates user_metrics_history table for storing calculated metrics over time

-- Create user_metrics_history table
CREATE TABLE IF NOT EXISTS user_metrics_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  metric_type VARCHAR(50) NOT NULL,  -- 'daily' or 'weekly'
  
  -- Engagement Metrics
  total_sessions INTEGER DEFAULT 0,
  total_playtime_seconds INTEGER DEFAULT 0,
  unique_games_played INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  
  -- Mood Metrics
  avg_mood_rating DECIMAL(4,2),
  mood_entries_count INTEGER DEFAULT 0,
  best_mood_day VARCHAR(20),
  worst_mood_day VARCHAR(20),
  mood_variance DECIMAL(4,2),
  
  -- Performance Metrics
  avg_game_score DECIMAL(5,2),
  focus_score DECIMAL(5,2),
  memory_score DECIMAL(5,2),
  emotional_score DECIMAL(5,2),
  
  -- Therapeutic Metrics
  questionnaire_positivity DECIMAL(5,2),
  chat_messages_count INTEGER DEFAULT 0,
  diary_entries_count INTEGER DEFAULT 0,
  goal_completion_rate DECIMAL(5,2),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, metric_date, metric_type)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_metrics_user_date 
  ON user_metrics_history(user_id, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_type 
  ON user_metrics_history(metric_type, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_user_type_date 
  ON user_metrics_history(user_id, metric_type, metric_date DESC);

-- Add JSONB columns to existing reports tables for structured data
ALTER TABLE weekly_reports 
  ADD COLUMN IF NOT EXISTS metrics_data JSONB,
  ADD COLUMN IF NOT EXISTS charts_data JSONB,
  ADD COLUMN IF NOT EXISTS insights JSONB;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_user_metrics_history_updated_at ON user_metrics_history;
CREATE TRIGGER update_user_metrics_history_updated_at
    BEFORE UPDATE ON user_metrics_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for easy weekly metrics comparison
CREATE OR REPLACE VIEW weekly_metrics_with_comparison AS
SELECT 
  current_week.*,
  prev_week.avg_mood_rating as prev_mood,
  prev_week.avg_game_score as prev_score,
  prev_week.total_sessions as prev_sessions,
  
  -- Calculate percentage changes
  CASE 
    WHEN prev_week.avg_mood_rating IS NOT NULL AND prev_week.avg_mood_rating != 0
    THEN ROUND(((current_week.avg_mood_rating - prev_week.avg_mood_rating) / prev_week.avg_mood_rating * 100)::numeric, 2)
    ELSE NULL
  END as mood_change_pct,
  
  CASE 
    WHEN prev_week.avg_game_score IS NOT NULL AND prev_week.avg_game_score != 0
    THEN ROUND(((current_week.avg_game_score - prev_week.avg_game_score) / prev_week.avg_game_score * 100)::numeric, 2)
    ELSE NULL
  END as score_change_pct,
  
  CASE 
    WHEN prev_week.total_sessions IS NOT NULL AND prev_week.total_sessions != 0
    THEN ROUND(((current_week.total_sessions - prev_week.total_sessions)::numeric / prev_week.total_sessions * 100)::numeric, 2)
    ELSE NULL
  END as sessions_change_pct

FROM user_metrics_history current_week
LEFT JOIN user_metrics_history prev_week 
  ON current_week.user_id = prev_week.user_id
  AND current_week.metric_type = prev_week.metric_type
  AND prev_week.metric_date = current_week.metric_date - INTERVAL '1 week'
WHERE current_week.metric_type = 'weekly';

-- Add RLS policies for security
ALTER TABLE user_metrics_history ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own metrics
CREATE POLICY "Users can view their own metrics"
  ON user_metrics_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own metrics
CREATE POLICY "Users can insert their own metrics"
  ON user_metrics_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own metrics
CREATE POLICY "Users can update their own metrics"
  ON user_metrics_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_metrics_history TO authenticated;
GRANT SELECT ON weekly_metrics_with_comparison TO authenticated;

-- Comments for documentation
COMMENT ON TABLE user_metrics_history IS 'Stores calculated metrics for user analytics and reporting';
COMMENT ON COLUMN user_metrics_history.metric_type IS 'Type of metric period: daily or weekly';
COMMENT ON COLUMN user_metrics_history.avg_mood_rating IS 'Average mood rating for the period (1-10 scale)';
COMMENT ON COLUMN user_metrics_history.questionnaire_positivity IS 'Percentage of positive questionnaire responses';
COMMENT ON VIEW weekly_metrics_with_comparison IS 'Weekly metrics with week-over-week comparison calculations';
