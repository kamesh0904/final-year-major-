-- Add crisis detection and emergency alert system
-- Run this in your Supabase SQL editor

-- Create crisis_events table to track mentions of self-harm/suicide
CREATE TABLE IF NOT EXISTS crisis_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_crisis BOOLEAN DEFAULT false,
    severity INTEGER DEFAULT 0,
    keywords_found TEXT[],
    message_content TEXT, -- Store partial content for analysis (encrypted)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create emergency_alerts table to track when alerts are triggered
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    emergency_phone VARCHAR(20),
    alert_type VARCHAR(50) DEFAULT 'suicide_ideation',
    status VARCHAR(20) DEFAULT 'triggered', -- triggered, resolved, false_alarm
    response_time TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crisis_events_user_time ON crisis_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_events_severity ON crisis_events(severity DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user ON emergency_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own crisis events (for transparency)
CREATE POLICY "Users can view own crisis events" ON crisis_events
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can view their own emergency alerts
CREATE POLICY "Users can view own emergency alerts" ON emergency_alerts
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can insert crisis events and alerts (service role only)
CREATE POLICY "System can manage crisis data" ON crisis_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "System can manage alert data" ON emergency_alerts
    FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE crisis_events IS 'Tracks mentions of self-harm or suicide ideation in conversations';
COMMENT ON TABLE emergency_alerts IS 'Logs when emergency contacts are notified due to crisis detection';

COMMENT ON COLUMN crisis_events.severity IS 'Crisis severity level 1-5 (5 = immediate danger)';
COMMENT ON COLUMN crisis_events.keywords_found IS 'Array of crisis keywords detected in message';
COMMENT ON COLUMN emergency_alerts.alert_type IS 'Type of crisis: suicide_ideation, self_harm, etc.';
COMMENT ON COLUMN emergency_alerts.status IS 'Alert status: triggered, resolved, false_alarm';

-- Create a function to clean up old crisis events (privacy)
CREATE OR REPLACE FUNCTION cleanup_old_crisis_events()
RETURNS void AS $$
BEGIN
    -- Delete crisis events older than 30 days for privacy
    DELETE FROM crisis_events 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Keep emergency alerts for longer (90 days) for safety analysis
    DELETE FROM emergency_alerts 
    WHERE created_at < NOW() - INTERVAL '90 days' 
    AND status = 'resolved';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-crisis-data', '0 2 * * *', 'SELECT cleanup_old_crisis_events();');

-- Add emergency contact validation function
CREATE OR REPLACE FUNCTION validate_emergency_contact()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure emergency phone is in valid format
    IF NEW.emergency_phone IS NOT NULL AND NEW.emergency_phone !~ '^\+?[1-9]\d{1,14}$' THEN
        RAISE EXCEPTION 'Invalid emergency phone number format';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to validate emergency contact updates
CREATE TRIGGER validate_emergency_contact_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_emergency_contact();