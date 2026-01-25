-- Migration: Create system_config table for NCS Credit System
-- Run this in Supabase SQL Editor

-- Create system_config table
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read config" ON system_config;
DROP POLICY IF EXISTS "Admins can update config" ON system_config;

-- RLS Policies
-- Anyone can read config (needed for client-side cost display)
CREATE POLICY "Anyone can read config"
  ON system_config FOR SELECT
  USING (true);

-- Only admins can update config
CREATE POLICY "Admins can update config"
  ON system_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert config
CREATE POLICY "Admins can insert config"
  ON system_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Initial configuration data
INSERT INTO system_config (key, value, description) VALUES
  ('default_ncs_balance', '100000', 'Default NCS credits for new users')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, description) VALUES
  ('analysis_costs', '{
    "descriptive": 100,
    "cronbach": 500,
    "correlation": 300,
    "ttest": 400,
    "ttest-indep": 400,
    "ttest-paired": 400,
    "anova": 600,
    "efa": 1000,
    "cfa": 2000,
    "sem": 3000,
    "regression": 800,
    "chisquare": 400,
    "mann-whitney": 400,
    "ai_explain": 1500,
    "export_pdf": 200
  }', 'Cost per analysis type in NCS credits')
ON CONFLICT (key) DO NOTHING;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
