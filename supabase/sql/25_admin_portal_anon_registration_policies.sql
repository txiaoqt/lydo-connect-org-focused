begin;

-- Align registration tables with the existing anon-admin portal mode (SQL 14).
-- This keeps local predefined admin login functional for registration monitoring/retry.
do $$
begin
  -- Only apply when anon admin-manage mode is enabled.
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'programs'
      and policyname = 'anon_manage_programs'
  ) then
    if to_regclass('public.event_registrations') is not null then
      grant select, update on table public.event_registrations to anon;

      execute 'drop policy if exists anon_read_event_registrations on public.event_registrations;';
      execute 'create policy anon_read_event_registrations on public.event_registrations for select to anon using (true);';

      execute 'drop policy if exists anon_update_event_registrations on public.event_registrations;';
      execute 'create policy anon_update_event_registrations on public.event_registrations for update to anon using (true) with check (true);';
    end if;

    if to_regclass('public.program_registrations') is not null then
      grant select, update on table public.program_registrations to anon;

      execute 'drop policy if exists anon_read_program_registrations on public.program_registrations;';
      execute 'create policy anon_read_program_registrations on public.program_registrations for select to anon using (true);';

      execute 'drop policy if exists anon_update_program_registrations on public.program_registrations;';
      execute 'create policy anon_update_program_registrations on public.program_registrations for update to anon using (true) with check (true);';
    end if;
  end if;
end $$;

commit;
