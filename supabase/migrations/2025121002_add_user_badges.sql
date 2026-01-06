-- Migration: Add user_badges table for tracking unlocked badges
-- Created: 2024-12-10
-- Description: Stores which badges each user has unlocked (gamification feature)

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  seen boolean NOT NULL DEFAULT false,
  
  -- Ensure each user can only unlock each badge once
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own badges
DROP POLICY IF EXISTS "Users can read their own badges" ON user_badges;
CREATE POLICY "Users can read their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own badges
DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
CREATE POLICY "Users can insert their own badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own badges (for marking as seen)
DROP POLICY IF EXISTS "Users can update their own badges" ON user_badges;
CREATE POLICY "Users can update their own badges"
  ON user_badges FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- Index for finding unseen badges
CREATE INDEX IF NOT EXISTS idx_user_badges_unseen ON user_badges(user_id, seen) WHERE seen = false;

-- Add comments for documentation
COMMENT ON TABLE user_badges IS 'Stores badges unlocked by users';
COMMENT ON COLUMN user_badges.badge_id IS 'Badge identifier matching constants.ts BADGES array';
COMMENT ON COLUMN user_badges.seen IS 'Whether user has acknowledged/seen this badge unlock';
