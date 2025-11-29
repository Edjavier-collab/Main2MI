-- Add subscription_plan column to profiles table
-- This stores the user's subscription plan type (monthly or annual) for persistence

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT NULL 
CHECK (subscription_plan IS NULL OR subscription_plan IN ('monthly', 'annual'));

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.subscription_plan IS 'User subscription plan type: monthly or annual. NULL for free tier users.';

