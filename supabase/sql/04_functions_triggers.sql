begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_has_any_role(_roles public.app_role_code[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.uid() is null then false else exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.code = any(_roles)
  ) end;
$$;

create or replace function public.generate_ticket_reference()
returns text
language sql
security definer
set search_path = public
as $$
  select 'LYDO-' || lpad(nextval('public.citizen_ticket_ref_seq')::text, 6, '0');
$$;

create or replace function public.set_citizen_ticket_defaults()
returns trigger
language plpgsql
as $$
begin
  if tg_op='INSERT' and (new.reference_no is null or btrim(new.reference_no)='') then
    new.reference_no := public.generate_ticket_reference();
  end if;
  if new.status in ('resolved','closed') and new.resolved_at is null then
    new.resolved_at := now();
  elsif tg_op='UPDATE' and new.status not in ('resolved','closed') and old.status <> new.status then
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  youth_role_id smallint;
begin
  insert into public.user_profiles (user_id, email, full_name, display_name, municipality)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@local.invalid'),
    coalesce(new.raw_user_meta_data ->> 'full_name',''),
    coalesce(new.raw_user_meta_data ->> 'display_name',''),
    'San Mateo, Rizal'
  )
  on conflict (user_id) do update set email = excluded.email, updated_at = now();

  select id into youth_role_id from public.roles where code='youth' limit 1;
  if youth_role_id is not null then
    insert into public.user_roles(user_id, role_id) values (new.id, youth_role_id)
    on conflict (user_id, role_id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.track_citizen_ticket(_reference_no text, _requester_email text)
returns table (
  reference_no text,
  ticket_type text,
  subject text,
  status public.ticket_status,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select t.reference_no, tt.name, t.subject, t.status, t.created_at, t.updated_at
  from public.citizen_tickets t
  join public.ticket_types tt on tt.id = t.type_id
  where lower(t.reference_no) = lower(_reference_no)
    and lower(t.requester_email::text) = lower(_requester_email)
  limit 1;
$$;

create or replace view public.transparency_kpis as
select
  (select count(*) from public.disclosure_documents) as disclosures_published,
  (select count(*) from public.citizen_tickets) as reports_received,
  (select count(*) from public.citizen_tickets where status in ('resolved','closed')) as reports_resolved,
  coalesce(
    (
      select round(avg(extract(epoch from (coalesce(resolved_at, updated_at) - created_at)) / 3600)::numeric, 2)
      from public.citizen_tickets
      where status in ('resolved','closed')
    ),
    0
  ) as avg_response_hours,
  (select count(*) from public.citizen_tickets where status in ('received','in_progress')) as pending_tickets;

grant execute on function public.generate_ticket_reference() to anon, authenticated;
grant execute on function public.track_citizen_ticket(text, text) to anon, authenticated;
grant select on public.transparency_kpis to anon, authenticated;

do $$
declare
  t text;
  tables text[] := array[
    'barangays','offices','user_profiles','programs','events','organizations',
    'user_program_memberships','user_org_memberships','event_registrations',
    'disclosure_documents','barangay_financials','barangay_youth_metrics','compliance_board_status',
    'monthly_compliance','citizen_tickets','service_advisories'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I;', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

drop trigger if exists trg_citizen_ticket_defaults on public.citizen_tickets;
create trigger trg_citizen_ticket_defaults
before insert or update on public.citizen_tickets
for each row execute function public.set_citizen_ticket_defaults();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

commit;
