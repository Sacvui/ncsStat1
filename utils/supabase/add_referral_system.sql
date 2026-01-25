-- Add referral system fields to profiles table
-- Run this in Supabase SQL Editor

-- Add referral_code field (unique per user)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Add referred_by field (stores the referrer's code)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Add referral_count field (number of successful referrals)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Create index for faster referral lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code 
ON public.profiles(referral_code);

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by 
ON public.profiles(referred_by);

-- Update RLS policy to allow reading referral_code
-- (already covered by existing profile policies)

COMMENT ON COLUMN public.profiles.referral_code IS 'Unique referral code for this user (e.g., NCS-ABCD1234)';
COMMENT ON COLUMN public.profiles.referred_by IS 'Referral code of the user who referred this user';
COMMENT ON COLUMN public.profiles.referral_count IS 'Number of users successfully referred by this user';
