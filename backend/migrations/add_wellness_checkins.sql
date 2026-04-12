-- Wellness Check-ins Table
-- Stores proactive check-ins from pattern detection agent

CREATE TABLE IF NOT EXISTS wellness_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    check_in_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    user_response TEXT,
    patterns_detected JSONB,
    sentiment_score FLOAT,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_user_id ON wellness_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_created_at ON wellness_checkins(created_at);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_type ON wellness_checkins(check_in_type);

-- Comments
COMMENT ON TABLE wellness_checkins IS 'Proactive wellness check-ins triggered by pattern detection';
COMMENT ON COLUMN wellness_checkins.check_in_type IS 'Type of check-in: proactive_pattern_detection, scheduled, manual';
COMMENT ON COLUMN wellness_checkins.patterns_detected IS 'JSON data of patterns that triggered the check-in';
COMMENT ON COLUMN wellness_checkins.sentiment_score IS 'Sentiment analysis of user response (if applicable)';
