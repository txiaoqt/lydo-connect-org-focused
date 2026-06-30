-- Run once on an existing database to support the live email availability
-- check on the public Create Account page.

create or replace function public.is_signup_email_registered(_email text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when nullif(trim(_email), '') is null then false
    else exists (
      select 1
      from auth.users
      where lower(email) = lower(trim(_email))
    )
  end;
$$;

revoke all on function public.is_signup_email_registered(text) from public;
grant execute on function public.is_signup_email_registered(text) to anon, authenticated;
