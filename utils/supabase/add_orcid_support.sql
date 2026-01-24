-- Add orcid_id and last_active columns to profiles table for ORCID login support
DO $$
BEGIN
    -- Add orcid_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'orcid_id') THEN
        ALTER TABLE public.profiles ADD COLUMN orcid_id TEXT UNIQUE;
    END IF;

    -- Add last_active column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_active') THEN
        ALTER TABLE public.profiles ADD COLUMN last_active TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create index for faster ORCID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_orcid_id ON public.profiles(orcid_id) WHERE orcid_id IS NOT NULL;
