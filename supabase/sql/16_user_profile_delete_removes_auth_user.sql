begin;

-- When an admin deletes from public.user_profiles, also delete the auth.users row.
-- This keeps user_profiles/user_roles/auth.users in sync without exposing service role in frontend.
create or replace function public.delete_auth_user_on_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.users where id = old.user_id;
  return old;
end;
$$;

revoke all on function public.delete_auth_user_on_profile_delete() from public, anon, authenticated;

drop trigger if exists trg_user_profiles_delete_auth_user on public.user_profiles;
create trigger trg_user_profiles_delete_auth_user
after delete on public.user_profiles
for each row execute function public.delete_auth_user_on_profile_delete();

commit;

