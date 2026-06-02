begin;

drop view if exists public.transparency_kpis;

do $$
begin
  if to_regclass('public.youth_ticket_ref_seq') is null
     and to_regclass('public.citizen_ticket_ref_seq') is not null then
    alter sequence public.citizen_ticket_ref_seq rename to youth_ticket_ref_seq;
  end if;

  if to_regclass('public.youth_tickets') is null
     and to_regclass('public.citizen_tickets') is not null then
    alter table public.citizen_tickets rename to youth_tickets;
  end if;
end $$;

create sequence if not exists public.youth_ticket_ref_seq start with 100000 increment by 1;

alter table if exists public.youth_tickets enable row level security;

create or replace function public.generate_ticket_reference()
returns text
language sql
security definer
set search_path = public
as $$
  select 'LYDO-' || lpad(nextval('public.youth_ticket_ref_seq')::text, 6, '0');
$$;

create or replace function public.set_youth_ticket_defaults()
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

drop trigger if exists trg_citizen_ticket_defaults on public.youth_tickets;
drop trigger if exists trg_youth_ticket_defaults on public.youth_tickets;
create trigger trg_youth_ticket_defaults
before insert or update on public.youth_tickets
for each row execute function public.set_youth_ticket_defaults();

drop function if exists public.track_citizen_ticket(text, text);
create or replace function public.track_youth_ticket(_reference_no text, _requester_email text)
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
  from public.youth_tickets t
  join public.ticket_types tt on tt.id = t.type_id
  where lower(t.reference_no) = lower(_reference_no)
    and lower(t.requester_email::text) = lower(_requester_email)
  limit 1;
$$;

drop function if exists public.set_citizen_ticket_defaults();

create or replace view public.transparency_kpis as
select
  (select count(*) from public.disclosure_documents) as disclosures_published,
  (select count(*) from public.youth_tickets) as reports_received,
  (select count(*) from public.youth_tickets where status in ('resolved','closed')) as reports_resolved,
  coalesce(
    (
      select round(avg(extract(epoch from (coalesce(resolved_at, updated_at) - created_at)) / 3600)::numeric, 2)
      from public.youth_tickets
      where status in ('resolved','closed')
    ),
    0
  ) as avg_response_hours,
  (select count(*) from public.youth_tickets where status in ('received','in_progress')) as pending_tickets;

grant usage, select on sequence public.youth_ticket_ref_seq to anon, authenticated;
grant execute on function public.generate_ticket_reference() to anon, authenticated;
grant execute on function public.track_youth_ticket(text, text) to anon, authenticated;
grant select on public.transparency_kpis to anon, authenticated;

drop policy if exists select_citizen_tickets on public.youth_tickets;
drop policy if exists insert_citizen_tickets_anon on public.youth_tickets;
drop policy if exists insert_citizen_tickets_auth on public.youth_tickets;
drop policy if exists update_citizen_tickets on public.youth_tickets;
drop policy if exists delete_citizen_tickets_staff on public.youth_tickets;
drop policy if exists anon_manage_citizen_tickets on public.youth_tickets;

drop policy if exists select_youth_tickets on public.youth_tickets;
create policy select_youth_tickets on public.youth_tickets
for select
using (created_by_user_id = auth.uid() or public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

drop policy if exists insert_youth_tickets_anon on public.youth_tickets;
create policy insert_youth_tickets_anon on public.youth_tickets
for insert to anon
with check (created_by_user_id is null and requester_email is not null);

drop policy if exists insert_youth_tickets_auth on public.youth_tickets;
create policy insert_youth_tickets_auth on public.youth_tickets
for insert to authenticated
with check (created_by_user_id = auth.uid() and requester_email is not null);

drop policy if exists update_youth_tickets on public.youth_tickets;
create policy update_youth_tickets on public.youth_tickets
for update
using (created_by_user_id = auth.uid() or public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]))
with check (created_by_user_id = auth.uid() or public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

drop policy if exists delete_youth_tickets_staff on public.youth_tickets;
create policy delete_youth_tickets_staff on public.youth_tickets
for delete
using (public.current_user_has_any_role(array['admin','staff']::public.app_role_code[]));

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'programs'
      and policyname = 'anon_manage_programs'
  ) then
    grant select, insert, update, delete on table public.youth_tickets to anon;

    drop policy if exists anon_manage_youth_tickets on public.youth_tickets;
    create policy anon_manage_youth_tickets
    on public.youth_tickets
    for all to anon
    using (true)
    with check (true);
  end if;
end $$;

drop trigger if exists trg_audit_citizen_tickets on public.youth_tickets;
drop trigger if exists trg_audit_youth_tickets on public.youth_tickets;
create trigger trg_audit_youth_tickets
after insert or update or delete on public.youth_tickets
for each row execute function public.log_audit_change();

commit;
