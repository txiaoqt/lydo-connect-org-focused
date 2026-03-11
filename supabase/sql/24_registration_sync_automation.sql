begin;

-- Event/program sync metadata (used by worker)
alter table public.events
  add column if not exists gform_response_url text,
  add column if not exists gform_email_entry_id text,
  add column if not exists gform_name_entry_id text;

alter table public.programs
  add column if not exists gform_response_url text,
  add column if not exists gform_email_entry_id text,
  add column if not exists gform_name_entry_id text;

-- Event registrations sync lifecycle fields
alter table public.event_registrations
  add column if not exists source text,
  add column if not exists gform_sync_status text,
  add column if not exists gform_synced_at timestamptz,
  add column if not exists gform_sync_error text;

update public.event_registrations
set source = coalesce(source, 'portal_direct')
where source is null;

update public.event_registrations
set gform_sync_status = coalesce(gform_sync_status, 'skipped')
where gform_sync_status is null;

alter table public.event_registrations
  alter column source set default 'portal_direct',
  alter column source set not null,
  alter column gform_sync_status set default 'pending',
  alter column gform_sync_status set not null;

alter table public.event_registrations
  drop constraint if exists event_registrations_source_check;

alter table public.event_registrations
  add constraint event_registrations_source_check
  check (source in ('portal_direct', 'admin_csv_sync', 'imported'));

alter table public.event_registrations
  drop constraint if exists event_registrations_gform_sync_status_check;

alter table public.event_registrations
  add constraint event_registrations_gform_sync_status_check
  check (gform_sync_status in ('pending', 'synced', 'failed', 'skipped'));

create index if not exists idx_event_registrations_sync_status
  on public.event_registrations (gform_sync_status, registered_at desc);

create index if not exists idx_event_registrations_event_email
  on public.event_registrations (event_id, email);

-- Program registrations sync lifecycle fields
alter table public.program_registrations
  add column if not exists source text,
  add column if not exists gform_sync_status text,
  add column if not exists gform_synced_at timestamptz,
  add column if not exists gform_sync_error text;

update public.program_registrations
set source = coalesce(source, 'portal_direct')
where source is null;

update public.program_registrations
set gform_sync_status = coalesce(gform_sync_status, 'skipped')
where gform_sync_status is null;

alter table public.program_registrations
  alter column source set default 'portal_direct',
  alter column source set not null,
  alter column gform_sync_status set default 'pending',
  alter column gform_sync_status set not null;

alter table public.program_registrations
  drop constraint if exists program_registrations_source_check;

alter table public.program_registrations
  add constraint program_registrations_source_check
  check (source in ('portal_direct', 'admin_csv_sync', 'imported'));

alter table public.program_registrations
  drop constraint if exists program_registrations_gform_sync_status_check;

alter table public.program_registrations
  add constraint program_registrations_gform_sync_status_check
  check (gform_sync_status in ('pending', 'synced', 'failed', 'skipped'));

create index if not exists idx_program_registrations_sync_status
  on public.program_registrations (gform_sync_status, registered_at desc);

create index if not exists idx_program_registrations_program_email
  on public.program_registrations (program_id, email);

-- Replace event RPC so new registrations are queued for sync when enabled
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
  v_sync_enabled boolean := false;
  v_registration_form_url text;
  v_gform_response_url text;
  v_registration_id uuid;
  v_active_count integer;
  v_name text := btrim(coalesce(p_full_name, ''));
  v_email citext := lower(btrim(coalesce(p_email, '')))::citext;
  v_contact text := regexp_replace(coalesce(p_contact_number, ''), '[\s\-\(\)]', '', 'g');
  v_municipality text := btrim(coalesce(p_municipality, ''));
  v_sync_status text := 'skipped';
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

  select
    e.status,
    e.capacity,
    coalesce(e.external_attendance_enabled, false),
    e.registration_form_url,
    e.gform_response_url
  into
    v_event_status,
    v_capacity,
    v_sync_enabled,
    v_registration_form_url,
    v_gform_response_url
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

  if v_sync_enabled and coalesce(v_gform_response_url, v_registration_form_url) is not null then
    v_sync_status := 'pending';
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
      cancelled_at,
      source,
      gform_sync_status,
      gform_sync_error,
      gform_synced_at
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
      null,
      'portal_direct',
      v_sync_status,
      null,
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
      cancelled_at = null,
      source = 'portal_direct',
      gform_sync_status = v_sync_status,
      gform_sync_error = null,
      gform_synced_at = null
    where id = v_registration_id;
  end if;

  return v_registration_id;
end;
$$;

grant execute on function public.register_for_event_portal(uuid, text, text, text, text, uuid) to authenticated;

-- Replace program RPC so new registrations are queued for sync when enabled
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
  v_sync_enabled boolean := false;
  v_registration_form_url text;
  v_gform_response_url text;
  v_registration_id uuid;
  v_name text := btrim(coalesce(p_full_name, ''));
  v_email citext := lower(btrim(coalesce(p_email, '')))::citext;
  v_contact text := regexp_replace(coalesce(p_contact_number, ''), '[\s\-\(\)]', '', 'g');
  v_municipality text := btrim(coalesce(p_municipality, ''));
  v_sync_status text := 'skipped';
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

  select
    p.status,
    coalesce(p.external_attendance_enabled, false),
    p.registration_form_url,
    p.gform_response_url
  into
    v_program_status,
    v_sync_enabled,
    v_registration_form_url,
    v_gform_response_url
  from public.programs p
  where p.id = p_program_id;

  if not found then
    raise exception 'Program not found.';
  end if;

  if v_program_status <> 'published' then
    raise exception 'Registration is closed for this program.';
  end if;

  if v_sync_enabled and coalesce(v_gform_response_url, v_registration_form_url) is not null then
    v_sync_status := 'pending';
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
      cancelled_at,
      source,
      gform_sync_status,
      gform_sync_error,
      gform_synced_at
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
      null,
      'portal_direct',
      v_sync_status,
      null,
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
      cancelled_at = null,
      source = 'portal_direct',
      gform_sync_status = v_sync_status,
      gform_sync_error = null,
      gform_synced_at = null
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

-- Admin retry entrypoint for failed sync rows
create or replace function public.retry_registration_sync(
  p_kind text,
  p_registration_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  if not public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]) then
    raise exception 'You do not have permission to retry registration sync.';
  end if;

  if p_kind = 'event' then
    update public.event_registrations
    set
      gform_sync_status = 'pending',
      gform_sync_error = null,
      gform_synced_at = null
    where id = p_registration_id;
  elsif p_kind = 'program' then
    update public.program_registrations
    set
      gform_sync_status = 'pending',
      gform_sync_error = null,
      gform_synced_at = null
    where id = p_registration_id;
  else
    raise exception 'Unknown registration kind. Use event or program.';
  end if;
end;
$$;

grant execute on function public.retry_registration_sync(text, uuid) to authenticated;

commit;
