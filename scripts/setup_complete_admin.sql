-- 1. Create the table (if it doesn't exist)
create table if not exists app_admins (
    id uuid default gen_random_uuid() primary key,
    email text unique not null,
    role text not null check (role in ('admin', 'super_admin')),
    created_at timestamptz default now()
);

-- 2. Enable RLS
alter table app_admins enable row level security;

-- 3. READ Policy: Allow all authenticated users to read roles
drop policy if exists "Allow Read Access to All Authenticated Users" on app_admins;
create policy "Allow Read Access to All Authenticated Users"
on app_admins for select
to authenticated
using (true);

-- 4. Helper Function: Get Current User's Role (Securely)
create or replace function get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from app_admins where email = auth.jwt() ->> 'email';
$$;

-- 5. WRITE Policy: Only Super Admins can Insert/Update/Delete
drop policy if exists "Super Admin Write Access" on app_admins;
create policy "Super Admin Write Access"
on app_admins
for all
to authenticated
using ( get_my_role() = 'super_admin' )
with check ( get_my_role() = 'super_admin' );

-- 6. LOGIN CHECK: Public RPC function to check if email is authorized
create or replace function check_is_admin(check_email text)
returns boolean
language plpgsql
security definer
as $$
declare
  is_exist boolean;
begin
  select exists(select 1 from app_admins where email = check_email) into is_exist;
  return is_exist;
end;
$$;

-- 7. INITIAL SEED: Ensure YOU are the Super Admin
insert into app_admins (email, role)
values ('9m2pju@hamradio.my', 'super_admin')
on conflict (email) do update set role = 'super_admin';
