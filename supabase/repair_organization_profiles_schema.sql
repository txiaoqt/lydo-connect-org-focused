-- Run this in the Supabase SQL editor for existing LYDO Connect projects
-- that were created before the latest organization profile fields existed.

alter table if exists public.organization_profiles
  add column if not exists organization_email citext,
  add column if not exists major_classification text,
  add column if not exists sub_classification text,
  add column if not exists district text,
  add column if not exists advocacies text[],
  add column if not exists adviser_name text,
  add column if not exists representative_name text,
  add column if not exists address text,
  add column if not exists facebook_page_url text,
  add column if not exists profile_status public.profile_status,
  add column if not exists verified_at timestamptz,
  add column if not exists internal_notes text;

update public.organization_profiles
set
  major_classification = coalesce(major_classification, ''),
  sub_classification = coalesce(sub_classification, ''),
  district = coalesce(district, ''),
  advocacies = coalesce(advocacies, '{}'::text[]),
  profile_status = coalesce(profile_status, 'incomplete'::public.profile_status)
where
  major_classification is null
  or sub_classification is null
  or district is null
  or advocacies is null
  or profile_status is null;

alter table if exists public.organization_profiles
  alter column major_classification set default '',
  alter column sub_classification set default '',
  alter column district set default '',
  alter column advocacies set default '{}'::text[],
  alter column profile_status set default 'incomplete';

alter table if exists public.organization_profiles
  alter column major_classification set not null,
  alter column sub_classification set not null,
  alter column district set not null,
  alter column advocacies set not null,
  alter column profile_status set not null;
