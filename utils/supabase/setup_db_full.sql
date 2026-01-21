-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create User Roles Enum
create type user_role as enum ('user', 'admin', 'researcher');

-- 2. Create Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role user_role default 'user',
  referral_code text unique,
  referred_by_code text, -- Store the code of the referrer
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- 3. Create Projects Table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  data jsonb default '{}'::jsonb, -- Store flexible research data
  status text default 'draft', -- draft, active, archived
  is_local boolean default false, -- Flag if user wants to keep it 'private/local' concept
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- 5. Policies for Profiles
create policy "Public profiles are viewable by everyone." 
  on profiles for select using (true);

create policy "Users can update own profile." 
  on profiles for update using ((select auth.uid()) = id);

-- 6. Policies for Projects
create policy "Users can view own projects" 
  on projects for select using ((select auth.uid()) = user_id);

create policy "Users can insert own projects" 
  on projects for insert with check ((select auth.uid()) = user_id);

create policy "Users can update own projects" 
  on projects for update using ((select auth.uid()) = user_id);

create policy "Users can delete own projects" 
  on projects for delete using ((select auth.uid()) = user_id);

-- 7. Triggers for User Creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Trigger for Referral Code Generation
create or replace function generate_referral_code()
returns trigger as $$
begin
  if new.referral_code is null then
    -- Generate 8 char random code
    new.referral_code := substring(md5(random()::text) from 1 for 8);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_profile_created
  before insert on profiles
  for each row execute procedure generate_referral_code();
