-- Run once on an existing database. Organization-led PPA records are available
-- only after the related semester entry has been marked qualified. Submitted
-- or finalized PPAs cannot be changed by organization accounts.

create or replace function public.enforce_ypop_org_activity_user_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _entry_status public.ypop_entry_status;
  _entry_id uuid;
  _organization_id uuid;
  _entry_organization_id uuid;
  _profile_user_id uuid;
begin
  if _user_id is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  _entry_id := case when tg_op = 'DELETE' then old.ypop_entry_id else new.ypop_entry_id end;
  _organization_id := case when tg_op = 'DELETE' then old.organization_id else new.organization_id end;

  select entry.status, entry.organization_id, profile.user_id
  into _entry_status, _entry_organization_id, _profile_user_id
  from public.ypop_entries entry
  join public.organization_profiles profile
    on profile.id = entry.organization_id
  where entry.id = _entry_id
  limit 1;

  if _entry_organization_id is null
     or _entry_organization_id is distinct from _organization_id
     or _profile_user_id is distinct from _user_id then
    raise exception 'The YPOP submission does not belong to this organization.';
  end if;

  if _entry_status <> 'qualified' then
    raise exception 'PPA logging becomes available only after this YPOP semester is marked qualified.';
  end if;

  if tg_op in ('UPDATE', 'DELETE') and old.status not in ('draft', 'needs_revision') then
    raise exception 'This PPA is locked while it is under review or after a final decision.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_ypop_org_activity_user_workflow
  on public.ypop_org_activities;
create trigger trg_ypop_org_activity_user_workflow
before insert or update or delete on public.ypop_org_activities
for each row
execute function public.enforce_ypop_org_activity_user_workflow();
