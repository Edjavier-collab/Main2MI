-- Fix Schema Migration for MI Mastery
-- This script safely adds missing columns and tables without affecting existing data
-- Run this in the Supabase Dashboard SQL Editor

-- =====================================================
-- 1. FIX PROFILES TABLE
-- =====================================================

-- First, check if user_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles'
                   AND column_name = 'user_id'
                   AND table_schema = 'public') THEN
        -- If the table has an 'id' that should be user_id, we need to handle this
        -- Otherwise add user_id column
        ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add tier column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium'));

-- Add email column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Add created_at if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add full_name column (from migration 002)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add subscription_plan column (from migration 003)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles'
                   AND column_name = 'subscription_plan'
                   AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_plan TEXT DEFAULT NULL;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_plan_check
            CHECK (subscription_plan IS NULL OR subscription_plan IN ('monthly', 'annual'));
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'subscription_plan column or constraint already exists';
END $$;

-- Add streak columns (from migration 2025121001)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak int4 DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak int4 DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_practice_date date;

-- Add XP column (from migration 2025121003)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_xp int4 DEFAULT 0;

-- Create indexes safely
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON public.profiles(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_longest_streak ON public.profiles(longest_streak DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_current_xp ON public.profiles(current_xp DESC);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all profiles"
    ON public.profiles FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- 2. CREATE SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON public.sessions(user_id, created_at DESC);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Service role can manage all sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
    ON public.sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON public.sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
    ON public.sessions FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sessions"
    ON public.sessions FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- 3. CREATE USER_BADGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id text NOT NULL,
    unlocked_at timestamptz NOT NULL DEFAULT now(),
    seen boolean NOT NULL DEFAULT false,
    UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can update their own badges" ON public.user_badges;

CREATE POLICY "Users can read their own badges"
    ON public.user_badges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
    ON public.user_badges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges"
    ON public.user_badges FOR UPDATE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_unseen ON public.user_badges(user_id, seen) WHERE seen = false;

-- =====================================================
-- 4. CREATE FEEDBACK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow anonymous feedback insert" ON public.feedback;

CREATE POLICY "Users can insert their own feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow anonymous feedback insert"
    ON public.feedback FOR INSERT
    WITH CHECK (user_id IS NULL);

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, tier, email, full_name)
    VALUES (
        NEW.id,
        'free',
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 6. CREATE HELPER VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.user_monthly_sessions AS
SELECT
    user_id,
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS session_count
FROM public.sessions
GROUP BY user_id, DATE_TRUNC('month', created_at);

-- =====================================================
-- DONE! Verify by running:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'profiles' AND table_schema = 'public';
-- =====================================================
