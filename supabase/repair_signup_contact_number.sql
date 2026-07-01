-- Run once on an existing database so signup contact numbers are retained in
-- user_profiles as well as auth metadata. The PWA can still recover directly
-- from auth metadata while this repair is pending.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role_id smallint;
begin
  insert into public.user_profiles (
    user_id,
    email,
    full_name,
    display_name,
    contact_number
  )
  values (
    new.id,
    coalesce(new.email, new.id::text || '@local.invalid'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(trim(new.raw_user_meta_data ->> 'contact_number'), '')
  )
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        display_name = excluded.display_name,
        contact_number = coalesce(excluded.contact_number, user_profiles.contact_number),
        updated_at = now();

  select id into default_role_id
  from public.roles
  where code = 'youth'
  limit 1;

  if default_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, default_role_id)
    on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;

update public.user_profiles profile
set
  contact_number = nullif(trim(auth_user.raw_user_meta_data ->> 'contact_number'), ''),
  updated_at = now()
from auth.users auth_user
where profile.user_id = auth_user.id
  and nullif(trim(profile.contact_number), '') is null
  and nullif(trim(auth_user.raw_user_meta_data ->> 'contact_number'), '') is not null;
