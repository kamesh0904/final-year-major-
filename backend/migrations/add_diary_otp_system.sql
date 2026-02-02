-- Add OTP system for diary password reset
-- Run this in your Supabase SQL editor

-- Create table for storing password reset OTPs
CREATE TABLE IF NOT EXISTS diary_password_reset_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    otp_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '10 minutes'),
    used BOOLEAN DEFAULT FALSE
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_otp_user_id ON diary_password_reset_otps(user_id, used, expires_at);

-- Add RLS policies
ALTER TABLE diary_password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Users can only see their own OTPs (though this table is mainly accessed by backend)
CREATE POLICY "Users can view own OTPs"
    ON diary_password_reset_otps FOR SELECT
    USING (auth.uid() = user_id);

-- Function to clean up expired OTPs (optional, for housekeeping)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM diary_password_reset_otps
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Summary:
-- 1. Created diary_password_reset_otps table
-- 2. Added index for user_id lookups
-- 3. Enabled RLS for security
-- 4. Added cleanup function for expired OTPs
