-- Run once on an existing database. This makes joining a YPOP city-led event
-- atomic and independently rejects past, closed, duplicate, locked, or
-- unverified joins using Asia/Manila as the canonical timezone.

create or replace function public.join_ypop_city_activity(_activity_id uuid)
returns setof public.ypop_event_participations
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _organization public.organization_profiles%rowtype;
  _activity public.ypop_city_activities%rowtype;
  _period public.ypop_periods%rowtype;
  _entry public.ypop_entries%rowtype;
  _event_end timestamptz;
  _new_id uuid;
begin
  if _user_id is null then
    raise exception 'Please sign in with your organization account first.';
  end if;

  select * into _organization
  from public.organization_profiles
  where user_id = _user_id
  limit 1;

  if _organization.id is null then
    raise exception 'Organization profile not found.';
  end if;
  if _organization.profile_status <> 'verified' then
    raise exception 'Your organization profile must be verified before joining a YPOP event.';
  end if;

  select * into _activity
  from public.ypop_city_activities
  where id = _activity_id
  limit 1;
  if _activity.id is null then
    raise exception 'YPOP event not found.';
  end if;

  select * into _period
  from public.ypop_periods
  where semester_key = _activity.semester_key
  limit 1;
  if _period.id is null or _period.status <> 'open' then
    raise exception 'Joining is closed for this YPOP period.';
  end if;
  if _period.validation_deadline is not null and now() > _period.validation_deadline then
    raise exception 'Joining is closed for this YPOP period.';
  end if;

  if nullif(trim(_activity.date), '') is not null then
    begin
      if trim(_activity.date) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
        _event_end := ((trim(_activity.date)::date + 1)::timestamp at time zone 'Asia/Manila') - interval '1 millisecond';
      elsif trim(_activity.date) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}(:[0-9]{2}(\.[0-9]{1,3})?)?$' then
        _event_end := trim(_activity.date)::timestamp at time zone 'Asia/Manila';
      else
        _event_end := trim(_activity.date)::timestamptz;
      end if;
    exception when others then
      raise exception 'The YPOP event has an invalid event date.';
    end;
    if now() >= _event_end then
      raise exception 'This YPOP event has ended and can no longer be joined.';
    end if;
  end if;

  if exists (
    select 1 from public.ypop_event_participations
    where organization_id = _organization.id and activity_id = _activity.id
  ) then
    raise exception 'Your organization has already joined this YPOP event.';
  end if;

  select * into _entry
  from public.ypop_entries
  where organization_id = _organization.id and semester = _period.semester_key
  order by created_at desc
  limit 1;

  if _entry.id is not null and _entry.status not in ('draft', 'needs_revision') then
    raise exception 'This YPOP submission is locked and cannot join additional events.';
  end if;

  if _entry.id is null then
    insert into public.ypop_entries (
      organization_id, submitted_by, semester, semester_label, points_earned,
      points_required, total_points, status, admin_remarks, submission_note,
      validation_deadline, revision_history, org_led_project_count, city_led_attendance
    ) values (
      _organization.id, _user_id, _period.semester_key, _period.semester_label, 0,
      70, 100, 'draft', '', '', _period.validation_deadline, '[]'::jsonb, 0, '[]'::jsonb
    );
  end if;

  insert into public.ypop_event_participations (
    organization_id, submitted_by, activity_id, activity_name, activity_date,
    venue, status, admin_remarks, joined_at, revision_history
  ) values (
    _organization.id, _user_id, _activity.id, _activity.name, _activity.date,
    _activity.venue, 'pending_verification', '', now(),
    jsonb_build_array(jsonb_build_object(
      'action', 'pending_verification',
      'adminRemarks', 'Organization joined the YPOP event.',
      'changedAt', now()
    ))
  )
  returning id into _new_id;

  insert into public.activity_logs (
    actor_user_id, organization_id, action, related_type, related_id, description
  ) values (
    _user_id, _organization.id, 'Joined YPOP event',
    'ypop_event_participation', _new_id,
    format('Joined the city-led YPOP event "%s".', _activity.name)
  );

  return query
  select * from public.ypop_event_participations where id = _new_id;
end;
$$;
