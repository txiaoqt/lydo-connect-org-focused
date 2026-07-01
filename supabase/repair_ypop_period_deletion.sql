-- Run once on an existing database. Deleting a YPOP semester now removes its
-- organization submissions and dependent database records, and this repair
-- removes submissions left orphaned by earlier semester deletions.

create or replace function public.admin_delete_ypop_period(
  _session_token text,
  _period_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _admin_id uuid;
  _semester_key text;
begin
  select vat.admin_id into _admin_id
  from public.validate_admin_session_token(_session_token) vat
  limit 1;

  if _admin_id is null then
    raise exception 'Admin account is not authorized.';
  end if;

  select semester_key into _semester_key
  from public.ypop_periods
  where id = _period_id
  for update;

  if _semester_key is null then
    raise exception 'YPOP semester not found.';
  end if;

  delete from public.ypop_entries
  where semester = _semester_key;

  delete from public.ypop_periods
  where id = _period_id;
end;
$$;

delete from public.ypop_entries entry
where not exists (
  select 1
  from public.ypop_periods period
  where period.semester_key = entry.semester
);
