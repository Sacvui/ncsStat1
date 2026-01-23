-- 1. Update existing users with missing avatars
UPDATE public.profiles 
SET avatar_url = '/webr/default-avatar.png' 
WHERE avatar_url IS NULL OR avatar_url = '' OR avatar_url = 'N/A';

-- 2. Modify the signup trigger to handle future users
-- This ensures that if metadata doesn't contain an avatar_url (e.g. non-Google signup), 
-- the professional default is used.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'avatar_url', '/webr/default-avatar.png'), 
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
