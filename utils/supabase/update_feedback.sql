-- 1. Create Feedback Table with Unique Constraint (One per user)
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  rating integer,
  created_at timestamptz default now(),
  constraint one_feedback_per_user unique (user_id)
);

-- 2. Enable RLS
alter table public.feedback enable row level security;

-- 3. Policies for Feedback
-- Users can only insert their own feedback
create policy "Users can insert own feedback" 
  on public.feedback for insert 
  with check ((select auth.uid()) = user_id);

-- Users can view their own feedback
create policy "Users can view own feedback" 
  on public.feedback for select 
  using ((select auth.uid()) = user_id);

-- Admins can view ALL feedback
create policy "Admins can view all feedback" 
  on public.feedback for select 
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
    )
  );

-- 4. Helper to promote user to admin (Run this manually for your user)
-- update public.profiles set role = 'admin' where email = 'your_email@example.com';
