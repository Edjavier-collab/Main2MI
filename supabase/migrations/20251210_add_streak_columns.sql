-- Migration: Add streak tracking columns to profiles table
-- Created: 2024-12-10
-- Description: Adds columns for tracking user practice streaks (gamification feature)

-- Add streak columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_streak int4 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak int4 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_practice_date date;

-- Add index for querying users by streak (useful for leaderboards later)
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON profiles(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_longest_streak ON profiles(longest_streak DESC);

-- Add comment for documentation
COMMENT ON COLUMN profiles.current_streak IS 'Current consecutive days with practice sessions';
COMMENT ON COLUMN profiles.longest_streak IS 'Longest streak ever achieved by the user';
COMMENT ON COLUMN profiles.last_practice_date IS 'UTC date of the last completed practice session';
