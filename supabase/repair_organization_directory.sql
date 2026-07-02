-- Run once on an existing database. Adds an opt-in, authenticated
-- organization directory without exposing private organization profile rows.

alter table public.organization_profiles
  add column if not exists directory_visibility boolean not null default false,
  add column if not exists directory_show_representative boolean not null default false,
  add column if not exists directory_show_adviser boolean not null default false,
  add column if not exists directory_visibility_initialized boolean not null default false;

-- Existing verified organizations predate the visibility control. Enroll them
-- once so the new directory is useful immediately. The initialized marker
-- prevents a later rerun from undoing a user's decision to hide.
update public.organization_profiles
set
  directory_visibility = true,
  directory_visibility_initialized = true,
  updated_at = now()
where profile_status = 'verified'
  and directory_visibility_initialized = false;

update public.organization_profiles
set directory_visibility_initialized = true
where directory_visibility_initialized = false;

alter table public.organization_profiles
  alter column directory_visibility_initialized set default true;

create index if not exists idx_organization_profiles_public_directory
  on public.organization_profiles (organization_name)
  where profile_status = 'verified' and directory_visibility = true;

create or replace function public.update_organization_directory_preferences(
  _visible boolean,
  _show_representative boolean default false,
  _show_adviser boolean default false
)
returns setof public.organization_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
begin
  if _user_id is null then
    raise exception 'Please sign in with your organization account first.';
  end if;

  update public.organization_profiles
  set
    directory_visibility = coalesce(_visible, false),
    directory_show_representative = coalesce(_show_representative, false),
    directory_show_adviser = coalesce(_show_adviser, false),
    updated_at = now()
  where user_id = _user_id;

  if not found then
    raise exception 'Organization profile not found.';
  end if;

  return query
  select *
  from public.organization_profiles
  where user_id = _user_id;
end;
$$;

create or replace function public.search_public_organizations()
returns table (
  organization_id uuid,
  organization_name text,
  profile_image_url text,
  major_classification text,
  sub_classification text,
  district text,
  barangay text,
  advocacies text[],
  facebook_page_url text,
  verified_at timestamptz,
  yorp_registered_year smallint,
  representative_name text,
  adviser_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_profiles viewer
    where viewer.user_id = auth.uid() and viewer.profile_status = 'verified'
  ) then raise exception 'A verified organization account is required.'; end if;

  return query
  select
    op.id,
    op.organization_name,
    coalesce(op.profile_image_url, ''),
    coalesce(op.major_classification::text, ''),
    coalesce(op.sub_classification::text, ''),
    coalesce(op.district, ''),
    coalesce(op.barangay, ''),
    coalesce(op.advocacies::text[], array[]::text[]),
    coalesce(op.facebook_page_url, ''),
    op.verified_at,
    op.yorp_registered_year,
    case when op.directory_show_representative then coalesce(op.representative_name, '') else '' end,
    case when op.directory_show_adviser then coalesce(op.adviser_name, '') else '' end
  from public.organization_profiles op
  where op.profile_status = 'verified'
    and op.directory_visibility = true
    and op.user_id <> auth.uid()
  order by op.organization_name;
end;
$$;

create or replace function public.get_public_organization_profile(_organization_id uuid)
returns table (
  organization_id uuid,
  organization_name text,
  profile_image_url text,
  major_classification text,
  sub_classification text,
  district text,
  barangay text,
  advocacies text[],
  facebook_page_url text,
  verified_at timestamptz,
  yorp_registered_year smallint,
  representative_name text,
  adviser_name text,
  activities jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_profiles viewer
    where viewer.user_id = auth.uid() and viewer.profile_status = 'verified'
  ) then raise exception 'A verified organization account is required.'; end if;

  return query
  select
    op.id,
    op.organization_name,
    coalesce(op.profile_image_url, ''),
    coalesce(op.major_classification::text, ''),
    coalesce(op.sub_classification::text, ''),
    coalesce(op.district, ''),
    coalesce(op.barangay, ''),
    coalesce(op.advocacies::text[], array[]::text[]),
    coalesce(op.facebook_page_url, ''),
    op.verified_at,
    op.yorp_registered_year,
    case when op.directory_show_representative then coalesce(op.representative_name, '') else '' end,
    case when op.directory_show_adviser then coalesce(op.adviser_name, '') else '' end,
    (
      select coalesce(jsonb_agg(activity order by activity ->> 'date' desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'id', yep.id,
          'name', coalesce(yca.name, yep.activity_name),
          'date', coalesce(yca.date, yep.activity_date),
          'venue', coalesce(yca.venue, yep.venue),
          'kind', 'city_led'
        ) as activity
        from public.ypop_event_participations yep
        left join public.ypop_city_activities yca on yca.id = yep.activity_id
        where yep.organization_id = op.id
          and yep.status = 'verified'
        union all
        select jsonb_build_object(
          'id', yoa.id,
          'name', yoa.activity_name,
          'date', yoa.activity_date,
          'venue', yoa.venue,
          'kind', 'organization_led'
        )
        from public.ypop_org_activities yoa
        where yoa.organization_id = op.id
          and yoa.status = 'approved'
      ) safe_activities
    )
  from public.organization_profiles op
  where op.id = _organization_id
    and op.profile_status = 'verified'
    and op.directory_visibility = true
    and op.user_id <> auth.uid();
end;
$$;

revoke all on function public.update_organization_directory_preferences(boolean, boolean, boolean) from public;
revoke all on function public.search_public_organizations() from public;
revoke all on function public.get_public_organization_profile(uuid) from public;
grant execute on function public.update_organization_directory_preferences(boolean, boolean, boolean) to authenticated;
grant execute on function public.search_public_organizations() to authenticated;
grant execute on function public.get_public_organization_profile(uuid) to authenticated;
