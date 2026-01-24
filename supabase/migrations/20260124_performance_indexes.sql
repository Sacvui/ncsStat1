-- ncsStat Performance Indexes
-- Run this in Supabase SQL Editor to improve query performance

-- Index for profiles.last_active (used in admin dashboard active users count)
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);

-- Index for profiles.role (used in admin role checks)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Index for token_transactions.user_id (used in transaction history)
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);

-- Index for token_transactions.type (used in daily bonus check)
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(type);

-- Composite index for token_transactions (user_id + type + created_at)
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_type_date 
ON token_transactions(user_id, type, created_at DESC);

-- Index for activity_logs.user_id
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Index for activity_logs.action_type
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);

-- Index for user_sessions.user_id
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Index for user_sessions.login_at
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON user_sessions(login_at);

-- Index for invitations.inviter_id
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON invitations(inviter_id);

-- Index for invitations.status
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Index for profiles.orcid_id (ORCID login lookup)
CREATE INDEX IF NOT EXISTS idx_profiles_orcid_id ON profiles(orcid_id);
