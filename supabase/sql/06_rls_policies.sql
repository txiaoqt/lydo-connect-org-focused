begin;

do $$
declare
  t text;
  all_tables text[] := array[
    'roles','user_roles','barangays','offices','user_profiles','programs','events',
    'organizations','user_program_memberships','user_org_memberships','event_registrations',
    'disclosure_documents','document_downloads','barangay_financials','barangay_youth_metrics','compliance_board_status',
    'monthly_compliance','ticket_types','citizen_tickets'
  ];
begin
  foreach t in array all_tables loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- Public-read tables + staff/sk manage
do $$
declare
  t text;
  public_read_tables text[] := array[
    'barangays','offices','programs','events','organizations','disclosure_documents',
    'barangay_financials','barangay_youth_metrics','compliance_board_status','monthly_compliance','ticket_types'
  ];
begin
  foreach t in array public_read_tables loop
    execute format('drop policy if exists %I on public.%I;', 'public_read_' || t, t);
    execute format('create policy %I on public.%I for select using (true);', 'public_read_' || t, t);

    execute format('drop policy if exists %I on public.%I;', 'manage_' || t, t);
    execute format(
      'create policy %I on public.%I for all using (public.current_user_has_any_role(array[''admin'',''staff'',''sk'']::public.app_role_code[])) with check (public.current_user_has_any_role(array[''admin'',''staff'',''sk'']::public.app_role_code[]));',
      'manage_' || t, t
    );
  end loop;
end $$;

-- Roles table
drop policy if exists public_read_roles on public.roles;
create policy public_read_roles on public.roles for select using (true);
drop policy if exists manage_roles on public.roles;
create policy manage_roles on public.roles
for all
using (public.current_user_has_any_role(array['admin']::public.app_role_code[]))
with check (public.current_user_has_any_role(array['admin']::public.app_role_code[]));

-- User profile + role mappings
drop policy if exists user_profiles_self_select on public.user_profiles;
create policy user_profiles_self_select on public.user_profiles
for select
using (auth.uid() = user_id or public.current_user_has_any_role(array['admin','staff']::public.app_role_code[]));

drop policy if exists user_profiles_self_insert on public.user_profiles;
create policy user_profiles_self_insert on public.user_profiles
for insert
with check (auth.uid() = user_id or public.current_user_has_any_role(array['admin','staff']::public.app_role_code[]));

drop policy if exists user_profiles_self_update on public.user_profiles;
create policy user_profiles_self_update on public.user_profiles
for update
using (auth.uid() = user_id or public.current_user_has_any_role(array['admin','staff']::public.app_role_code[]))
with check (auth.uid() = user_id or public.current_user_has_any_role(array['admin','staff']::public.app_role_code[]));

drop policy if exists user_roles_self_select on public.user_roles;
create policy user_roles_self_select on public.user_roles
for select
using (auth.uid() = user_id or public.current_user_has_any_role(array['admin','staff']::public.app_role_code[]));

drop policy if exists user_roles_manage on public.user_roles;
create policy user_roles_manage on public.user_roles
for all
using (public.current_user_has_any_role(array['admin','staff']::public.app_role_code[]))
with check (public.current_user_has_any_role(array['admin','staff']::public.app_role_code[]));

-- Membership + registration ownership
do $$
declare
  t text;
  own_tables text[] := array['user_program_memberships','user_org_memberships','event_registrations'];
begin
  foreach t in array own_tables loop
    execute format('drop policy if exists %I on public.%I;', 'select_' || t, t);
    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id or public.current_user_has_any_role(array[''admin'',''staff'',''sk'']::public.app_role_code[]));',
      'select_' || t, t
    );
    execute format('drop policy if exists %I on public.%I;', 'insert_' || t, t);
    execute format('create policy %I on public.%I for insert with check (auth.uid() = user_id);', 'insert_' || t, t);
    execute format('drop policy if exists %I on public.%I;', 'update_' || t, t);
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id or public.current_user_has_any_role(array[''admin'',''staff'',''sk'']::public.app_role_code[])) with check (auth.uid() = user_id or public.current_user_has_any_role(array[''admin'',''staff'',''sk'']::public.app_role_code[]));',
      'update_' || t, t
    );
    execute format('drop policy if exists %I on public.%I;', 'delete_' || t, t);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id or public.current_user_has_any_role(array[''admin'',''staff'',''sk'']::public.app_role_code[]));',
      'delete_' || t, t
    );
  end loop;
end $$;

-- Download logs
drop policy if exists insert_document_downloads on public.document_downloads;
create policy insert_document_downloads on public.document_downloads for insert with check (true);
drop policy if exists select_document_downloads_staff on public.document_downloads;
create policy select_document_downloads_staff on public.document_downloads
for select
using (public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

-- Citizen tickets
drop policy if exists select_citizen_tickets on public.citizen_tickets;
create policy select_citizen_tickets on public.citizen_tickets
for select
using (created_by_user_id = auth.uid() or public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

drop policy if exists insert_citizen_tickets_anon on public.citizen_tickets;
create policy insert_citizen_tickets_anon on public.citizen_tickets
for insert to anon
with check (created_by_user_id is null and requester_email is not null);

drop policy if exists insert_citizen_tickets_auth on public.citizen_tickets;
create policy insert_citizen_tickets_auth on public.citizen_tickets
for insert to authenticated
with check (created_by_user_id = auth.uid() and requester_email is not null);

drop policy if exists update_citizen_tickets on public.citizen_tickets;
create policy update_citizen_tickets on public.citizen_tickets
for update
using (created_by_user_id = auth.uid() or public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]))
with check (created_by_user_id = auth.uid() or public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

drop policy if exists delete_citizen_tickets_staff on public.citizen_tickets;
create policy delete_citizen_tickets_staff on public.citizen_tickets
for delete
using (public.current_user_has_any_role(array['admin','staff']::public.app_role_code[]));

commit;
