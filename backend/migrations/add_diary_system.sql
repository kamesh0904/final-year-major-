-- Add diary system tables and columns
-- Run this in your Supabase SQL editor

-- Add diary password to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS diary_password_hash TEXT,
ADD COLUMN IF NOT EXISTS diary_created_at TIMESTAMP DEFAULT NOW();

-- Create diary_entries table
CREATE TABLE IF NOT EXISTS diary_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT NOT NULL,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    tags TEXT[], -- Array of tags like ['anxiety', 'work', 'family']
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_at ON diary_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_entries_mood ON diary_entries(mood_rating);

-- Add RLS (Row Level Security) policies
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own diary entries
CREATE POLICY "Users can access own diary entries" ON diary_entries
    FOR ALL USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE diary_entries IS 'Personal diary entries for users - accessible only to user and AI companion';
COMMENT ON COLUMN profiles.diary_password_hash IS 'Hashed password for diary access (bcrypt)';
COMMENT ON COLUMN diary_entries.mood_rating IS 'User mood rating from 1-10 (1=very low, 10=excellent)';
COMMENT ON COLUMN diary_entries.tags IS 'Array of tags for categorizing entries';
COMMENT ON COLUMN diary_entries.is_private IS 'Whether entry is private (always true for now)';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_diary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_diary_entries_updated_at
    BEFORE UPDATE ON diary_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_diary_updated_at();