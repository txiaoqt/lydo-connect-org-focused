begin;

-- Registration source metadata (from attendance integration)
alter table public.events
  add column if not exists registration_form_url text,
  add column if not exists registration_sheet_url text,
  add column if not exists external_attendance_enabled boolean not null default false;

alter table public.programs
  add column if not exists registration_form_url text,
  add column if not exists registration_sheet_url text,
  add column if not exists external_attendance_enabled boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_registration_form_url_valid'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_registration_form_url_valid
      check (
        registration_form_url is null
        or registration_form_url ~* '^https?://(docs\.google\.com/forms/|forms\.gle/)'
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_registration_sheet_url_valid'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_registration_sheet_url_valid
      check (
        registration_sheet_url is null
        or registration_sheet_url ~* '^https?://docs\.google\.com/spreadsheets/'
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'programs_registration_form_url_valid'
      and conrelid = 'public.programs'::regclass
  ) then
    alter table public.programs
      add constraint programs_registration_form_url_valid
      check (
        registration_form_url is null
        or registration_form_url ~* '^https?://(docs\.google\.com/forms/|forms\.gle/)'
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'programs_registration_sheet_url_valid'
      and conrelid = 'public.programs'::regclass
  ) then
    alter table public.programs
      add constraint programs_registration_sheet_url_valid
      check (
        registration_sheet_url is null
        or registration_sheet_url ~* '^https?://docs\.google\.com/spreadsheets/'
      );
  end if;
end $$;

-- Reliable event registration write path with validation (frontend-safe RPC)
create or replace function public.register_for_event_portal(
  p_event_id uuid,
  p_full_name text,
  p_email text,
  p_contact_number text,
  p_municipality text,
  p_barangay_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_status public.event_status;
  v_capacity integer;
  v_registration_id uuid;
  v_active_count integer;
  v_name text := btrim(coalesce(p_full_name, ''));
  v_email citext := lower(btrim(coalesce(p_email, '')))::citext;
  v_contact text := regexp_replace(coalesce(p_contact_number, ''), '[\s\-\(\)]', '', 'g');
  v_municipality text := btrim(coalesce(p_municipality, ''));
begin
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  if p_event_id is null then
    raise exception 'Event is required.';
  end if;

  if char_length(v_name) < 2 then
    raise exception 'Full name must be at least 2 characters.';
  end if;

  if v_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
    raise exception 'A valid email address is required.';
  end if;

  if v_contact ~ '^09\d{9}$' then
    v_contact := '+63' || substr(v_contact, 2);
  elsif v_contact ~ '^639\d{9}$' then
    v_contact := '+' || v_contact;
  end if;

  if v_contact !~ '^\+639\d{9}$' then
    raise exception 'Use a valid PH mobile number (09XXXXXXXXX or +639XXXXXXXXX).';
  end if;

  if char_length(v_municipality) < 2 then
    raise exception 'Municipality is required.';
  end if;

  select e.status, e.capacity
    into v_event_status, v_capacity
  from public.events e
  where e.id = p_event_id;

  if not found then
    raise exception 'Event not found.';
  end if;

  if v_event_status in ('past', 'cancelled') then
    raise exception 'Registration is closed for this event.';
  end if;

  select er.id
    into v_registration_id
  from public.event_registrations er
  where er.user_id = v_user_id
    and er.event_id = p_event_id
    and er.cancelled_at is null
    and er.registration_status in ('registered', 'waitlisted', 'attended')
  order by er.registered_at desc
  limit 1;

  if v_registration_id is null and v_capacity is not null then
    select count(*)
      into v_active_count
    from public.event_registrations er
    where er.event_id = p_event_id
      and er.cancelled_at is null
      and er.registration_status in ('registered', 'waitlisted', 'attended');

    if v_active_count >= v_capacity then
      raise exception 'Event registration is full.';
    end if;
  end if;

  select er.id
    into v_registration_id
  from public.event_registrations er
  where er.user_id = v_user_id
    and er.event_id = p_event_id
  order by er.registered_at desc
  limit 1;

  if v_registration_id is null then
    insert into public.event_registrations (
      user_id,
      event_id,
      full_name,
      email,
      contact_number,
      municipality,
      barangay_id,
      registration_status,
      registered_at,
      cancelled_at
    )
    values (
      v_user_id,
      p_event_id,
      v_name,
      v_email,
      v_contact,
      v_municipality,
      p_barangay_id,
      'registered',
      now(),
      null
    )
    returning id into v_registration_id;
  else
    update public.event_registrations
    set
      full_name = v_name,
      email = v_email,
      contact_number = v_contact,
      municipality = v_municipality,
      barangay_id = p_barangay_id,
      registration_status = 'registered',
      registered_at = now(),
      cancelled_at = null
    where id = v_registration_id;
  end if;

  return v_registration_id;
end;
$$;

grant execute on function public.register_for_event_portal(uuid, text, text, text, text, uuid) to authenticated;

-- Reliable program registration write path with validation (frontend-safe RPC)
create or replace function public.register_for_program_portal(
  p_program_id uuid,
  p_full_name text,
  p_email text,
  p_contact_number text,
  p_municipality text,
  p_barangay_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_program_status public.program_status;
  v_registration_id uuid;
  v_name text := btrim(coalesce(p_full_name, ''));
  v_email citext := lower(btrim(coalesce(p_email, '')))::citext;
  v_contact text := regexp_replace(coalesce(p_contact_number, ''), '[\s\-\(\)]', '', 'g');
  v_municipality text := btrim(coalesce(p_municipality, ''));
begin
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  if p_program_id is null then
    raise exception 'Program is required.';
  end if;

  if char_length(v_name) < 2 then
    raise exception 'Full name must be at least 2 characters.';
  end if;

  if v_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
    raise exception 'A valid email address is required.';
  end if;

  if v_contact ~ '^09\d{9}$' then
    v_contact := '+63' || substr(v_contact, 2);
  elsif v_contact ~ '^639\d{9}$' then
    v_contact := '+' || v_contact;
  end if;

  if v_contact !~ '^\+639\d{9}$' then
    raise exception 'Use a valid PH mobile number (09XXXXXXXXX or +639XXXXXXXXX).';
  end if;

  if char_length(v_municipality) < 2 then
    raise exception 'Municipality is required.';
  end if;

  select p.status
    into v_program_status
  from public.programs p
  where p.id = p_program_id;

  if not found then
    raise exception 'Program not found.';
  end if;

  if v_program_status <> 'published' then
    raise exception 'Registration is closed for this program.';
  end if;

  select pr.id
    into v_registration_id
  from public.program_registrations pr
  where pr.user_id = v_user_id
    and pr.program_id = p_program_id
  order by pr.registered_at desc
  limit 1;

  if v_registration_id is null then
    insert into public.program_registrations (
      user_id,
      program_id,
      full_name,
      email,
      contact_number,
      municipality,
      barangay_id,
      registration_status,
      registered_at,
      cancelled_at
    )
    values (
      v_user_id,
      p_program_id,
      v_name,
      v_email,
      v_contact,
      v_municipality,
      p_barangay_id,
      'registered',
      now(),
      null
    )
    returning id into v_registration_id;
  else
    update public.program_registrations
    set
      full_name = v_name,
      email = v_email,
      contact_number = v_contact,
      municipality = v_municipality,
      barangay_id = p_barangay_id,
      registration_status = 'registered',
      registered_at = now(),
      cancelled_at = null
    where id = v_registration_id;
  end if;

  insert into public.user_program_memberships (user_id, program_id, left_at)
  values (v_user_id, p_program_id, null)
  on conflict do nothing;

  update public.user_program_memberships upm
  set
    left_at = null,
    joined_at = case when upm.left_at is null then upm.joined_at else now() end
  where upm.id = (
    select candidate.id
    from public.user_program_memberships candidate
    where candidate.user_id = v_user_id
      and candidate.program_id = p_program_id
    order by
      (candidate.left_at is null) desc,
      coalesce(candidate.left_at, candidate.joined_at) desc,
      candidate.created_at desc
    limit 1
  );

  return v_registration_id;
end;
$$;

grant execute on function public.register_for_program_portal(uuid, text, text, text, text, uuid) to authenticated;

commit;
