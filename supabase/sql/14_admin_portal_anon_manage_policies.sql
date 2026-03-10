begin;

-- WARNING:
-- This file allows ANON write access to selected admin-managed tables so the
-- current frontend-only predefined admin login can perform create/update/delete.
-- Use only for development/demo unless you replace this with proper authenticated RBAC.

do $$
declare
  t text;
  management_tables text[] := array[
    'roles',
    'barangays',
    'offices',
    'programs',
    'events',
    'organizations',
    'disclosure_documents',
    'barangay_financials',
    'barangay_youth_metrics',
    'compliance_board_status',
    'monthly_compliance',
    'service_advisories',
    'ticket_types'
  ];
begin
  foreach t in array management_tables loop
    execute format('grant select, insert, update, delete on table public.%I to anon;', t);
    execute format('drop policy if exists %I on public.%I;', 'anon_manage_' || t, t);
    execute format(
      'create policy %I on public.%I for all to anon using (true) with check (true);',
      'anon_manage_' || t,
      t
    );
  end loop;
end $$;

grant select on table public.user_profiles to anon;
drop policy if exists anon_read_user_profiles on public.user_profiles;
create policy anon_read_user_profiles on public.user_profiles for select to anon using (true);

commit;
