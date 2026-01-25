-- User Activity Log Schema
-- Tracks login/logout events, feature usage, and time spent in app

-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'login', 'logout', 'analysis', 'export', 'page_view'
    action_details JSONB DEFAULT '{}', -- Additional context (analysis type, page name, etc.)
    session_id TEXT, -- To group activities in same session
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0 -- For sessions: time spent
);

-- Indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action_type ON user_activity(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_session_id ON user_activity(session_id);

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Admin can view all activities
CREATE POLICY "Admin can view all activities" ON user_activity
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Users can insert their own activity
CREATE POLICY "Users can insert own activity" ON user_activity
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own activity
CREATE POLICY "Users can view own activity" ON user_activity
    FOR SELECT
    USING (auth.uid() = user_id);
