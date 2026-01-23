-- ncsStat Token/Points System Database Schema
-- Run this in Supabase SQL Editor

-- 1. Add tokens column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tokens INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS total_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.profiles(id);

-- 2. Create user_sessions table for login tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ DEFAULT now(),
  logout_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'login', 'analysis', 'export', 'share', 'feedback', 'invite'
  action_details JSONB DEFAULT '{}',
  points_earned INTEGER DEFAULT 0,
  points_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create token_transactions table
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = earn, negative = spend
  type TEXT NOT NULL, -- 'signup_bonus', 'earn_invite', 'earn_share', 'earn_feedback', 'spend_analysis', 'spend_export', 'admin_adjust', 'daily_bonus'
  description TEXT,
  related_id UUID, -- ID of related entity (invite, analysis, etc.)
  balance_after INTEGER, -- Balance after this transaction
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
  tokens_rewarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  invitee_id UUID REFERENCES public.profiles(id)
);

-- 6. Enable RLS on all tables
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. RLS Policies for activity_logs
CREATE POLICY "Users can view own activity" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 9. RLS Policies for token_transactions
CREATE POLICY "Users can view own transactions" ON public.token_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.token_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert transactions" ON public.token_transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 10. RLS Policies for invitations
CREATE POLICY "Users can view own invitations" ON public.invitations
  FOR SELECT USING (auth.uid() = inviter_id);

CREATE POLICY "Users can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Admins can view all invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON public.user_sessions(login_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON public.invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invite_code ON public.invitations(invite_code);

-- 12. Function to record token transaction and update balance
CREATE OR REPLACE FUNCTION public.record_token_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS public.token_transactions AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction public.token_transactions;
BEGIN
  -- Get current balance
  SELECT tokens INTO v_current_balance FROM public.profiles WHERE id = p_user_id;
  v_new_balance := v_current_balance + p_amount;
  
  -- Update profile
  UPDATE public.profiles 
  SET 
    tokens = v_new_balance,
    total_earned = CASE WHEN p_amount > 0 THEN total_earned + p_amount ELSE total_earned END,
    total_spent = CASE WHEN p_amount < 0 THEN total_spent + ABS(p_amount) ELSE total_spent END,
    last_active = now()
  WHERE id = p_user_id;
  
  -- Insert transaction
  INSERT INTO public.token_transactions (user_id, amount, type, description, related_id, balance_after)
  VALUES (p_user_id, p_amount, p_type, p_description, p_related_id, v_new_balance)
  RETURNING * INTO v_transaction;
  
  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_details JSONB DEFAULT '{}',
  p_points_earned INTEGER DEFAULT 0,
  p_points_spent INTEGER DEFAULT 0
)
RETURNS public.activity_logs AS $$
DECLARE
  v_log public.activity_logs;
BEGIN
  INSERT INTO public.activity_logs (user_id, action_type, action_details, points_earned, points_spent)
  VALUES (p_user_id, p_action_type, p_details, p_points_earned, p_points_spent)
  RETURNING * INTO v_log;
  
  -- Update last_active
  UPDATE public.profiles SET last_active = now() WHERE id = p_user_id;
  
  RETURN v_log;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.record_token_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity TO authenticated;
