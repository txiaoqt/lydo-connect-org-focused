begin;

-- Fix membership reactivation in program registration RPC.
-- Previous logic updated all rows for a user/program pair to left_at = null,
-- which can violate uq_user_program_active when historical rows exist.
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

commit;
