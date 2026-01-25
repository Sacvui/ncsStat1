-- Migration: Fix default NCS balance for new users
-- This trigger reads the default_ncs_balance from system_config instead of using hardcoded 100

-- Drop existing trigger if exists (to recreate with new function)
DROP TRIGGER IF EXISTS set_default_tokens_trigger ON profiles;

-- Function to set default tokens from system_config
CREATE OR REPLACE FUNCTION set_default_tokens()
RETURNS TRIGGER AS $$
DECLARE
  default_tokens INTEGER;
BEGIN
  -- Try to get default balance from system_config
  SELECT COALESCE((value::text)::integer, 100000)
  INTO default_tokens
  FROM system_config
  WHERE key = 'default_ncs_balance';
  
  -- Fallback to 100000 if not found
  IF default_tokens IS NULL THEN
    default_tokens := 100000;
  END IF;
  
  -- Set tokens for new user (only if not already set)
  IF NEW.tokens IS NULL OR NEW.tokens <= 0 THEN
    NEW.tokens := default_tokens;
    NEW.total_earned := default_tokens;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set tokens BEFORE insert
CREATE TRIGGER set_default_tokens_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_default_tokens();

-- Also ensure existing users with 100 tokens get updated (one-time fix)
-- Comment this out after running once
/*
UPDATE profiles 
SET tokens = (
  SELECT COALESCE((value::text)::integer, 100000) 
  FROM system_config 
  WHERE key = 'default_ncs_balance'
  LIMIT 1
)
WHERE tokens = 100 AND created_at > NOW() - INTERVAL '7 days';
*/

-- Ensure system_config has default_ncs_balance entry
INSERT INTO system_config (key, value, updated_at)
VALUES ('default_ncs_balance', 100000, NOW())
ON CONFLICT (key) DO NOTHING;
