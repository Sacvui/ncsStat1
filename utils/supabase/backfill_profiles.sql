-- Backfill missing profiles from auth.users
insert into public.profiles (id, email, full_name, avatar_url, role)
select 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  raw_user_meta_data->>'avatar_url', 
  'user'
from auth.users
where id not in (select id from public.profiles);

-- Promote specific user to admin
update public.profiles
set role = 'admin'
where email = 'foreverlove3004@gmail.com';

-- Verify
select email, role from public.profiles where email = 'foreverlove3004@gmail.com';
