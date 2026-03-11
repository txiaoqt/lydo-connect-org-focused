begin;

-- Tracks row-level INSERT/UPDATE/DELETE changes on admin-managed tables.
-- Keeps actor context from auth.jwt() + user profile/role tables when available.
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text,
  actor_email text,
  actor_role text not null default 'unknown',
  actor_claims jsonb not null default '{}'::jsonb,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  table_schema text not null,
  table_name text not null,
  row_pk jsonb not null default '{}'::jsonb,
  changed_fields text[],
  old_data jsonb,
  new_data jsonb
);

create index if not exists idx_audit_logs_occurred_at
  on public.audit_logs (occurred_at desc);

create index if not exists idx_audit_logs_table_name
  on public.audit_logs (table_name, occurred_at desc);

create index if not exists idx_audit_logs_actor_user
  on public.audit_logs (actor_user_id, occurred_at desc);

create index if not exists idx_audit_logs_operation
  on public.audit_logs (operation, occurred_at desc);

create index if not exists idx_audit_logs_row_pk_gin
  on public.audit_logs using gin (row_pk);

create index if not exists idx_audit_logs_changed_fields_gin
  on public.audit_logs using gin (changed_fields);

alter table public.audit_logs enable row level security;

drop policy if exists read_audit_logs_admin_staff on public.audit_logs;
create policy read_audit_logs_admin_staff on public.audit_logs
for select
using (public.current_user_has_any_role(array['admin','staff']::public.app_role_code[]));

-- If anon admin-manage mode is enabled via SQL 14, allow anon to read audit logs too.
-- This mirrors that development/demo workflow.
do $$
begin
  execute 'drop policy if exists read_audit_logs_anon_predefined_admin on public.audit_logs;';
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'programs'
      and policyname = 'anon_manage_programs'
  ) then
    execute 'create policy read_audit_logs_anon_predefined_admin on public.audit_logs for select to anon using (true);';
  end if;
end $$;

create or replace function public.pick_jsonb_keys(_payload jsonb, _keys text[])
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_object_agg(k, _payload -> k), '{}'::jsonb)
  from unnest(coalesce(_keys, array[]::text[])) as k;
$$;

create or replace function public.log_audit_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claims_text text;
  v_claims jsonb := '{}'::jsonb;
  v_actor_user_id uuid := auth.uid();
  v_actor_email text;
  v_actor_role text;
  v_actor_role_from_membership text;
  v_actor_name text;
  v_pk_cols text[];
  v_row_source jsonb;
  v_old jsonb;
  v_new jsonb;
  v_row_pk jsonb := '{}'::jsonb;
  v_changed_fields text[] := array[]::text[];
begin
  if TG_TABLE_NAME = 'audit_logs' then
    if TG_OP = 'DELETE' then
      return OLD;
    end if;
    return NEW;
  end if;

  claims_text := nullif(current_setting('request.jwt.claims', true), '');
  if claims_text is not null then
    begin
      v_claims := claims_text::jsonb;
    exception when others then
      v_claims := '{}'::jsonb;
    end;
  end if;

  v_actor_email := nullif(v_claims ->> 'email', '');
  v_actor_role := coalesce(nullif(v_claims ->> 'role', ''), case when v_actor_user_id is null then 'anon' else 'authenticated' end);

  if TG_OP = 'INSERT' then
    v_new := to_jsonb(NEW);
    v_row_source := v_new;
  elsif TG_OP = 'UPDATE' then
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_row_source := v_new;

    select coalesce(array_agg(k order by k), array[]::text[])
      into v_changed_fields
    from (
      select key as k
      from jsonb_object_keys(v_new) as key
      where key <> 'updated_at'
        and (v_old -> key) is distinct from (v_new -> key)
    ) changed;

    -- Skip no-op updates where only updated_at changed.
    if coalesce(array_length(v_changed_fields, 1), 0) = 0 then
      return NEW;
    end if;
  else
    v_old := to_jsonb(OLD);
    v_row_source := v_old;
  end if;

  select array_agg(att.attname order by cols.ordinality)
    into v_pk_cols
  from pg_index idx
  join unnest(idx.indkey) with ordinality as cols(attnum, ordinality) on true
  join pg_attribute att on att.attrelid = idx.indrelid and att.attnum = cols.attnum
  where idx.indrelid = TG_RELID
    and idx.indisprimary;

  if coalesce(array_length(v_pk_cols, 1), 0) > 0 then
    v_row_pk := public.pick_jsonb_keys(v_row_source, v_pk_cols);
  end if;

  if v_actor_user_id is not null then
    select
      coalesce(nullif(up.display_name, ''), nullif(up.full_name, ''), nullif(up.email::text, '')),
      nullif(up.email::text, '')
      into v_actor_name, v_actor_email
    from public.user_profiles up
    where up.user_id = v_actor_user_id
    limit 1;

    select nullif(string_agg(r.code::text, ', ' order by r.code), '')
      into v_actor_role_from_membership
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = v_actor_user_id;

    if v_actor_role_from_membership is not null then
      v_actor_role := v_actor_role_from_membership;
    end if;
  end if;

  v_actor_email := coalesce(v_actor_email, nullif(v_claims ->> 'email', ''));

  if v_actor_name is null then
    v_actor_name := coalesce(v_actor_email, case when v_actor_role = 'anon' then 'anon-admin-session' else 'unknown' end);
  end if;

  insert into public.audit_logs (
    actor_user_id,
    actor_name,
    actor_email,
    actor_role,
    actor_claims,
    operation,
    table_schema,
    table_name,
    row_pk,
    changed_fields,
    old_data,
    new_data
  )
  values (
    v_actor_user_id,
    v_actor_name,
    v_actor_email,
    v_actor_role,
    v_claims,
    TG_OP,
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    v_row_pk,
    case when TG_OP = 'UPDATE' then v_changed_fields else null end,
    v_old,
    v_new
  );

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

revoke all on function public.pick_jsonb_keys(jsonb, text[]) from public, anon, authenticated;
revoke all on function public.log_audit_change() from public, anon, authenticated;

do $$
declare
  t text;
  audit_tables text[] := array[
    'roles',
    'user_roles',
    'admin_accounts',
    'barangays',
    'offices',
    'user_profiles',
    'programs',
    'events',
    'organizations',
    'disclosure_documents',
    'barangay_financials',
    'barangay_youth_metrics',
    'compliance_board_status',
    'monthly_compliance',
    'service_advisories',
    'ticket_types',
    'citizen_tickets',
    'event_registrations',
    'program_registrations'
  ];
begin
  foreach t in array audit_tables loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('drop trigger if exists trg_audit_%I on public.%I;', t, t);
    execute format(
      'create trigger trg_audit_%I after insert or update or delete on public.%I for each row execute function public.log_audit_change();',
      t,
      t
    );
  end loop;
end $$;

commit;
