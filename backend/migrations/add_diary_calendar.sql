-- Add calendar functionality to diary_entries table
-- Run this in your Supabase SQL editor

-- Add entry_date column to diary_entries table
ALTER TABLE diary_entries 
ADD COLUMN IF NOT EXISTS entry_date DATE DEFAULT CURRENT_DATE;

-- Backfill entry_date for existing entries (use created_at date)
UPDATE diary_entries 
SET entry_date = DATE(created_at) 
WHERE entry_date IS NULL;

-- Make entry_date NOT NULL after backfill
ALTER TABLE diary_entries 
ALTER COLUMN entry_date SET NOT NULL;

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_diary_entries_entry_date ON diary_entries(user_id, entry_date DESC);

-- Add comments for documentation
COMMENT ON COLUMN diary_entries.entry_date IS 'The date this entry belongs to (for calendar positioning). Users can only create entries for today or past dates.';

-- Create function to prevent future-dated entries
CREATE OR REPLACE FUNCTION check_diary_entry_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.entry_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot create diary entries for future dates';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce date constraint
DROP TRIGGER IF EXISTS enforce_diary_entry_date ON diary_entries;
CREATE TRIGGER enforce_diary_entry_date
    BEFORE INSERT OR UPDATE ON diary_entries
    FOR EACH ROW
    EXECUTE FUNCTION check_diary_entry_date();

-- Summary of changes:
-- 1. Added entry_date column (defaults to current date)
-- 2. Backfilled existing entries with their created_at date
-- 3. Created index for efficient calendar queries
-- 4. Added trigger to prevent future-dated entries
-- 5. Multiple entries per day are allowed (no uniqueness constraint)
