begin;

create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique,
  password_hash text not null,
  display_name text not null default 'Admin User',
  is_active boolean not null default true,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_accounts_active on public.admin_accounts (is_active);

drop trigger if exists trg_admin_accounts_updated_at on public.admin_accounts;
create trigger trg_admin_accounts_updated_at
before update on public.admin_accounts
for each row execute function public.set_updated_at();

alter table public.admin_accounts enable row level security;

drop policy if exists admin_accounts_admin_select on public.admin_accounts;
create policy admin_accounts_admin_select on public.admin_accounts
for select
using (public.current_user_has_any_role(array['admin']::public.app_role_code[]));

drop policy if exists admin_accounts_admin_manage on public.admin_accounts;
create policy admin_accounts_admin_manage on public.admin_accounts
for all
using (public.current_user_has_any_role(array['admin']::public.app_role_code[]))
with check (public.current_user_has_any_role(array['admin']::public.app_role_code[]));

insert into public.admin_accounts (username, password_hash, display_name, is_active)
values ('lydoadmin', crypt('lydoadminnpassword', gen_salt('bf')), 'LYDO Admin', true)
on conflict (username) do update
set password_hash = excluded.password_hash,
    display_name = excluded.display_name,
    is_active = excluded.is_active,
    updated_at = now();

commit;
