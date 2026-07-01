-- Run once on an existing database to persist organization profile images.
-- The image object itself is stored privately in organization-documents.

alter table public.organization_profiles
  add column if not exists profile_image_url text;

comment on column public.organization_profiles.profile_image_url is
  'Private storage URI for the organization profile image.';
