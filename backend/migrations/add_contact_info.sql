-- Add address and emergency_phone columns to profiles table
-- Run this in your Supabase SQL editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);

-- Add comments for documentation
COMMENT ON COLUMN profiles.address IS 'User residential address for emergency contact';
COMMENT ON COLUMN profiles.emergency_phone IS 'Emergency contact phone number';

-- Optional: Create an index for faster lookups if needed
-- CREATE INDEX IF NOT EXISTS idx_profiles_emergency_phone ON profiles(emergency_phone);