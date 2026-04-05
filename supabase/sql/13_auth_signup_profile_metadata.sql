begin;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  youth_role_id smallint;
  raw_barangay_id text;
  selected_barangay_id uuid;
begin
  raw_barangay_id := nullif(new.raw_user_meta_data ->> 'barangay_id', '');
  if raw_barangay_id is not null
     and raw_barangay_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    selected_barangay_id := raw_barangay_id::uuid;
    if not exists (select 1 from public.barangays b where b.id = selected_barangay_id) then
      selected_barangay_id := null;
    end if;
  end if;

  insert into public.user_profiles (
    user_id,
    email,
    full_name,
    display_name,
    contact_number,
    municipality,
    barangay_id
  )
  values (
    new.id,
    coalesce(new.email, new.id::text || '@local.invalid'),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'contact_number', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'municipality', ''), 'Metro Manila'),
    selected_barangay_id
  )
  on conflict (user_id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
      display_name = coalesce(excluded.display_name, public.user_profiles.display_name),
      contact_number = coalesce(excluded.contact_number, public.user_profiles.contact_number),
      municipality = coalesce(excluded.municipality, public.user_profiles.municipality),
      barangay_id = coalesce(excluded.barangay_id, public.user_profiles.barangay_id),
      updated_at = now();

  select id into youth_role_id from public.roles where code = 'youth' limit 1;
  if youth_role_id is not null then
    insert into public.user_roles(user_id, role_id) values (new.id, youth_role_id)
    on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;

commit;
