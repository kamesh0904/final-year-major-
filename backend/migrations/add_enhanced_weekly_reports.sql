-- Enhanced Weekly Reports Migration
-- Adds support for clinical synthesis reports with raw data storage

-- Update weekly_reports table to support enhanced reports
ALTER TABLE weekly_reports 
ADD COLUMN IF NOT EXISTS raw_data JSONB,
ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_date ON weekly_reports(user_id, report_date);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_type ON weekly_reports(report_type);

-- Add constraint to ensure one report per user per date
ALTER TABLE weekly_reports 
ADD CONSTRAINT unique_user_report_date 
UNIQUE (user_id, report_date);

-- Create a view for easy access to latest reports
CREATE OR REPLACE VIEW latest_weekly_reports AS
SELECT DISTINCT ON (user_id) 
    user_id,
    report_date,
    summary_text,
    raw_data,
    report_type,
    created_at,
    updated_at
FROM weekly_reports 
ORDER BY user_id, report_date DESC;

-- Function to get user's therapeutic progress over time
CREATE OR REPLACE FUNCTION get_user_therapeutic_progress(p_user_id UUID, p_weeks INTEGER DEFAULT 4)
RETURNS TABLE (
    week_date DATE,
    report_data JSONB,
    progress_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wr.report_date,
        wr.raw_data,
        CASE 
            WHEN wr.raw_data->>'insights' IS NOT NULL THEN
                COALESCE(
                    (wr.raw_data->'insights'->'therapeutic_progress'->>'average_positivity')::NUMERIC,
                    0
                )
            ELSE 0
        END as progress_score
    FROM weekly_reports wr
    WHERE wr.user_id = p_user_id
    AND wr.report_date >= CURRENT_DATE - INTERVAL '%s weeks'
    AND wr.report_type = 'clinical_synthesis'
    ORDER BY wr.report_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate weekly engagement metrics
CREATE OR REPLACE FUNCTION calculate_weekly_engagement(p_user_id UUID, p_week_start DATE)
RETURNS JSONB AS $$
DECLARE
    engagement_data JSONB;
    week_end DATE := p_week_start + INTERVAL '7 days';
BEGIN
    SELECT jsonb_build_object(
        'game_sessions', COUNT(DISTINCT gs.id),
        'total_playtime', COALESCE(SUM(gs.duration_seconds), 0),
        'questionnaires_completed', COUNT(DISTINCT pgr.id),
        'chat_interactions', COUNT(DISTINCT cm.id),
        'diary_entries', COUNT(DISTINCT de.id),
        'unique_games_played', COUNT(DISTINCT gs.game_name)
    ) INTO engagement_data
    FROM profiles p
    LEFT JOIN game_sessions gs ON p.id = gs.user_id 
        AND gs.created_at >= p_week_start 
        AND gs.created_at < week_end
    LEFT JOIN post_game_responses pgr ON p.id = pgr.user_id 
        AND pgr.created_at >= p_week_start 
        AND pgr.created_at < week_end
    LEFT JOIN chat_messages cm ON p.id = cm.user_id 
        AND cm.created_at >= p_week_start 
        AND cm.created_at < week_end
        AND cm.role = 'user'
    LEFT JOIN diary_entries de ON p.id = de.user_id 
        AND de.created_at >= p_week_start 
        AND de.created_at < week_end
    WHERE p.id = p_user_id;
    
    RETURN engagement_data;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weekly_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_weekly_reports_updated_at
    BEFORE UPDATE ON weekly_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_weekly_reports_updated_at();

-- Add comments for documentation
COMMENT ON TABLE weekly_reports IS 'Enhanced weekly reports with clinical synthesis and raw data storage';
COMMENT ON COLUMN weekly_reports.raw_data IS 'Raw data used to generate the report (games, questionnaires, chats, diary)';
COMMENT ON COLUMN weekly_reports.report_type IS 'Type of report: basic, clinical_synthesis, etc.';
COMMENT ON FUNCTION get_user_therapeutic_progress IS 'Get user therapeutic progress over specified weeks';
COMMENT ON FUNCTION calculate_weekly_engagement IS 'Calculate engagement metrics for a specific week';