-- Migration to ensure projects table exists
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null, -- simplified reference for safety
  name text not null,
  description text,
  data jsonb default '{}'::jsonb,
  status text default 'draft',
  is_local boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS if not already enabled
alter table public.projects enable row level security;

-- Drop existing policies to avoid conflicts before recreating
drop policy if exists "Users can view own projects" on projects;
drop policy if exists "Users can insert own projects" on projects;
drop policy if exists "Users can update own projects" on projects;
drop policy if exists "Users can delete own projects" on projects;

-- Create policies
create policy "Users can view own projects" 
  on projects for select using ((select auth.uid()) = user_id);

create policy "Users can insert own projects" 
  on projects for insert with check ((select auth.uid()) = user_id);

create policy "Users can update own projects" 
  on projects for update using ((select auth.uid()) = user_id);

create policy "Users can delete own projects" 
  on projects for delete using ((select auth.uid()) = user_id);

-- Force schema cache reload (Supabase specific hint, though usually automatic)
notify pgrst, 'reload schema';
