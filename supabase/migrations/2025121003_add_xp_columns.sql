-- Migration: Add XP tracking column to profiles table
-- Created: 2024-12-10
-- Description: Adds column for tracking user XP (gamification feature)
-- Level is calculated client-side from XP thresholds

-- Add XP column to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_xp int4 DEFAULT 0;

-- Add index for potential leaderboards
CREATE INDEX IF NOT EXISTS idx_profiles_current_xp ON profiles(current_xp DESC);

-- Add comment for documentation
COMMENT ON COLUMN profiles.current_xp IS 'Total experience points earned by the user';
