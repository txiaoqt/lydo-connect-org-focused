begin;

create table if not exists public.program_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  full_name text not null,
  email citext not null,
  contact_number text not null,
  municipality text not null,
  barangay_id uuid references public.barangays(id) on delete set null,
  registration_status public.registration_status not null default 'registered',
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_program_registration_active
  on public.program_registrations(user_id, program_id)
  where cancelled_at is null;

create index if not exists idx_program_registrations_lookup
  on public.program_registrations(program_id, registration_status, registered_at desc);

alter table public.program_registrations enable row level security;

drop policy if exists select_program_registrations on public.program_registrations;
create policy select_program_registrations on public.program_registrations
for select
using (auth.uid() = user_id or public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

drop policy if exists insert_program_registrations on public.program_registrations;
create policy insert_program_registrations on public.program_registrations
for insert
with check (auth.uid() = user_id);

drop policy if exists update_program_registrations on public.program_registrations;
create policy update_program_registrations on public.program_registrations
for update
using (auth.uid() = user_id or public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]))
with check (auth.uid() = user_id or public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

drop policy if exists delete_program_registrations on public.program_registrations;
create policy delete_program_registrations on public.program_registrations
for delete
using (auth.uid() = user_id or public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

drop trigger if exists trg_program_registrations_updated_at on public.program_registrations;
create trigger trg_program_registrations_updated_at
before update on public.program_registrations
for each row execute function public.set_updated_at();

commit;
