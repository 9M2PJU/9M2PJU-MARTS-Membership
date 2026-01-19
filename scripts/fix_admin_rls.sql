
-- 1. Enable RLS on app_admins (if not already)
alter table app_admins enable row level security;

-- 2. Allow ANY authenticated user to read the app_admins table
-- (This is safe because we only expose 'email' and 'role')
create policy "Allow Read Access to All Authenticated Users"
on app_admins for select
to authenticated
using (true);

-- 3. Just in case, ensure the user exists
insert into app_admins (email, role)
values ('9m2pju@hamradio.my', 'super_admin')
on conflict (email) do update set role = 'super_admin';
