-- Add gentle goal streak tracking to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gentle_goal_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_gentle_goal_date DATE;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_gentle_goal_date ON profiles(last_gentle_goal_date);

-- Add comment for documentation
COMMENT ON COLUMN profiles.gentle_goal_streak IS 'Number of consecutive days user completed their gentle goal';
COMMENT ON COLUMN profiles.last_gentle_goal_date IS 'Date when user last completed their gentle goal (YYYY-MM-DD format)';