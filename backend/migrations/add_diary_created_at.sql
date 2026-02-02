-- Add diary_created_at column to profiles table
-- This column tracks when a user first created their diary password

-- Add the column (if it doesn't exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS diary_created_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN profiles.diary_created_at IS 'Timestamp when user first created their diary password';
