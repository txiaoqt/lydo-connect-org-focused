-- Run once on an existing database. Joined-event records retain a snapshot for
-- audit purposes, but their displayed activity name, date, and venue must stay
-- synchronized with the administrator-managed city-led activity definition.

create or replace function public.sync_ypop_city_activity_participations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ypop_event_participations
  set
    activity_name = new.name,
    activity_date = new.date,
    venue = new.venue,
    updated_at = now()
  where activity_id = new.id
    and (
      activity_name is distinct from new.name
      or activity_date is distinct from new.date
      or venue is distinct from new.venue
    );

  return new;
end;
$$;

drop trigger if exists trg_sync_ypop_city_activity_participations
  on public.ypop_city_activities;
create trigger trg_sync_ypop_city_activity_participations
after update of name, date, venue on public.ypop_city_activities
for each row
execute function public.sync_ypop_city_activity_participations();

-- Repair participation snapshots created before the trigger existed.
update public.ypop_event_participations participation
set
  activity_name = activity.name,
  activity_date = activity.date,
  venue = activity.venue,
  updated_at = now()
from public.ypop_city_activities activity
where participation.activity_id = activity.id
  and (
    participation.activity_name is distinct from activity.name
    or participation.activity_date is distinct from activity.date
    or participation.venue is distinct from activity.venue
  );
