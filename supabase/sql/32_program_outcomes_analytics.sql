-- Program outcomes analytics records for admin outcomes dashboard.
-- Adds structured outcome fields linked to programs and optional transparency documents.

begin;

create table if not exists public.program_outcomes (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  report_document_id uuid references public.disclosure_documents(id) on delete set null,
  recorded_on date,
  target_participants integer not null default 0 check (target_participants >= 0),
  actual_participants integer not null default 0 check (actual_participants >= 0),
  completion_percent smallint not null default 0 check (completion_percent between 0 and 100),
  objectives_achieved text,
  outcome_summary text,
  challenges text,
  recommendations text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_program_outcomes_program_recorded
  on public.program_outcomes(program_id, recorded_on desc nulls last);

create index if not exists idx_program_outcomes_completion
  on public.program_outcomes(completion_percent);

alter table public.program_outcomes enable row level security;

drop policy if exists select_program_outcomes on public.program_outcomes;
create policy select_program_outcomes on public.program_outcomes
for select
using (public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

drop policy if exists insert_program_outcomes on public.program_outcomes;
create policy insert_program_outcomes on public.program_outcomes
for insert
with check (public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

drop policy if exists update_program_outcomes on public.program_outcomes;
create policy update_program_outcomes on public.program_outcomes
for update
using (public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]))
with check (public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

drop policy if exists delete_program_outcomes on public.program_outcomes;
create policy delete_program_outcomes on public.program_outcomes
for delete
using (public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

grant select, insert, update, delete on table public.program_outcomes to authenticated;

drop trigger if exists trg_program_outcomes_updated_at on public.program_outcomes;
create trigger trg_program_outcomes_updated_at
before update on public.program_outcomes
for each row execute function public.set_updated_at();

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'programs'
      and policyname = 'anon_manage_programs'
  ) then
    grant select, insert, update, delete on table public.program_outcomes to anon;

    drop policy if exists anon_read_program_outcomes on public.program_outcomes;
    create policy anon_read_program_outcomes on public.program_outcomes
    for select to anon using (true);

    drop policy if exists anon_write_program_outcomes on public.program_outcomes;
    create policy anon_write_program_outcomes on public.program_outcomes
    for all to anon using (true) with check (true);
  end if;
end $$;

commit;

