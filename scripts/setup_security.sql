-- 1. Ensure RLS is enabled
alter table app_admins enable row level security;

-- 2. READ Policy: Allow all authenticated users to read (so they can check their own role)
drop policy if exists "Allow Read Access to All Authenticated Users" on app_admins;
create policy "Allow Read Access to All Authenticated Users"
on app_admins for select
to authenticated
using (true);

-- 3. WRITE Policy: Only Super Admins can Insert/Update/Delete
-- We use a SECURITY DEFINER function to avoid RLS recursion when checking the role
create or replace function get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from app_admins where email = auth.jwt() ->> 'email';
$$;

drop policy if exists "Super Admin Write Access" on app_admins;
create policy "Super Admin Write Access"
on app_admins
for all
to authenticated
using ( get_my_role() = 'super_admin' )
with check ( get_my_role() = 'super_admin' );

-- 4. LOGIN CHECK: Public RPC function to check if an email is authorized
-- This allows the login page to check "Is this an admin?" without exposing the whole list
create or replace function check_is_admin(check_email text)
returns boolean
language plpgsql
security definer -- Bypass RLS
as $$
declare
  is_exist boolean;
begin
  select exists(select 1 from app_admins where email = check_email) into is_exist;
  return is_exist;
end;
$$;
