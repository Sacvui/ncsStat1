-- Add missing fields to profiles table
DO $$
BEGIN
    -- academic_level
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'academic_level') THEN
        ALTER TABLE public.profiles ADD COLUMN academic_level TEXT;
    END IF;

    -- research_field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'research_field') THEN
        ALTER TABLE public.profiles ADD COLUMN research_field TEXT;
    END IF;

    -- organization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization') THEN
        ALTER TABLE public.profiles ADD COLUMN organization TEXT;
    END IF;

    -- phone_number (if missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
    END IF;

    -- date_of_birth (if missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
    END IF;
END $$;
