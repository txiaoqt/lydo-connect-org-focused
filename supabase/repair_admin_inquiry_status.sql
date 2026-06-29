-- Adds the authenticated admin action used by the inquiry status controls.

create or replace function public.admin_update_inquiry(
  _session_token text,
  _inquiry_id uuid,
  _status public.inquiry_status,
  _admin_remarks text default null
)
returns setof public.inquiries
language plpgsql
security definer
set search_path = public
as $$
declare
  _admin_id uuid;
begin
  select vat.admin_id into _admin_id
  from public.validate_admin_session_token(_session_token) vat
  limit 1;

  if _admin_id is null then
    raise exception 'Admin account is not authorized.';
  end if;

  update public.inquiries
  set
    status = _status,
    admin_remarks = coalesce(_admin_remarks, admin_remarks),
    reviewed_at = case
      when _status = 'pending_review' then null
      else coalesce(reviewed_at, now())
    end,
    updated_at = now()
  where id = _inquiry_id;

  if not found then
    raise exception 'Inquiry not found.';
  end if;

  return query
  select *
  from public.inquiries
  where id = _inquiry_id;
end;
$$;
