-- Run this in the Supabase SQL editor for existing projects
-- that still use the older single-remarks-only budget request schema.

alter table if exists public.budget_requests
  add column if not exists admin_remarks text not null default '',
  add column if not exists user_note text not null default '',
  add column if not exists revision_history jsonb not null default '[]';

update public.budget_requests
set
  admin_remarks = coalesce(admin_remarks, ''),
  user_note = coalesce(user_note, ''),
  revision_history = coalesce(revision_history, '[]'::jsonb)
where
  admin_remarks is null
  or user_note is null
  or revision_history is null;

alter table if exists public.budget_requests
  alter column admin_remarks set default '',
  alter column user_note set default '',
  alter column revision_history set default '[]'::jsonb;

alter table if exists public.budget_requests
  alter column admin_remarks set not null,
  alter column user_note set not null,
  alter column revision_history set not null;

drop function if exists public.update_admin_budget_request(
  text,
  uuid,
  public.budget_request_status,
  numeric,
  numeric,
  date,
  text,
  timestamptz,
  timestamptz
);

drop function if exists public.update_admin_budget_request(
  text,
  uuid,
  public.budget_request_status,
  numeric,
  numeric,
  date,
  text,
  text,
  timestamptz,
  timestamptz,
  text,
  jsonb
);

create or replace function public.update_admin_budget_request(
  _session_token text,
  _budget_request_id uuid,
  _status public.budget_request_status default null,
  _approved_amount numeric(14,2) default null,
  _released_amount numeric(14,2) default null,
  _release_date date default null,
  _remarks text default null,
  _admin_remarks text default null,
  _go_signal_at timestamptz default null,
  _hard_copy_submitted_at timestamptz default null,
  _user_note text default null,
  _revision_history jsonb default null
)
returns table (
  id uuid,
  organization_id uuid,
  submitted_by uuid,
  activity_title text,
  activity_description text,
  activity_date date,
  venue text,
  requested_amount numeric(14,2),
  approved_amount numeric(14,2),
  released_amount numeric(14,2),
  release_date date,
  purpose_category text,
  status public.budget_request_status,
  remarks text,
  admin_remarks text,
  go_signal_at timestamptz,
  hard_copy_submitted_at timestamptz,
  user_note text,
  revision_history jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _admin_id uuid;
begin
  select vat.admin_id
  into _admin_id
  from public.validate_admin_session_token(_session_token) vat
  limit 1;

  if _admin_id is null then
    raise exception 'Admin account is not authorized.';
  end if;

  return query
  update public.budget_requests
  set
    status = coalesce(_status, budget_requests.status),
    approved_amount = coalesce(_approved_amount, budget_requests.approved_amount),
    released_amount = coalesce(_released_amount, budget_requests.released_amount),
    release_date = coalesce(_release_date, budget_requests.release_date),
    remarks = coalesce(_remarks, budget_requests.remarks),
    admin_remarks = coalesce(_admin_remarks, budget_requests.admin_remarks),
    go_signal_at = coalesce(_go_signal_at, budget_requests.go_signal_at),
    hard_copy_submitted_at = coalesce(_hard_copy_submitted_at, budget_requests.hard_copy_submitted_at),
    user_note = coalesce(_user_note, budget_requests.user_note),
    revision_history = coalesce(_revision_history, budget_requests.revision_history),
    updated_at = now()
  where budget_requests.id = _budget_request_id
  returning
    budget_requests.id,
    budget_requests.organization_id,
    budget_requests.submitted_by,
    budget_requests.activity_title,
    budget_requests.activity_description,
    budget_requests.activity_date,
    budget_requests.venue,
    budget_requests.requested_amount,
    budget_requests.approved_amount,
    budget_requests.released_amount,
    budget_requests.release_date,
    budget_requests.purpose_category,
    budget_requests.status,
    budget_requests.remarks,
    budget_requests.admin_remarks,
    budget_requests.go_signal_at,
    budget_requests.hard_copy_submitted_at,
    budget_requests.user_note,
    budget_requests.revision_history,
    budget_requests.created_at,
    budget_requests.updated_at;
end;
$$;
