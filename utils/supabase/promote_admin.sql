-- Promote specific user to admin
update public.profiles
set role = 'admin'
where email = 'foreverlove3004@gmail.com';

-- Verify the update
select email, role from public.profiles where email = 'foreverlove3004@gmail.com';
