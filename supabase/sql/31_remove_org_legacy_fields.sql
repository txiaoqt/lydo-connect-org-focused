begin;

-- Removes organization fields tied to the older location-specific/prototype
-- model. Organization records now stay generic and source-focused.
alter table if exists public.organizations
  drop column if exists is_pasig_based,
  drop column if exists prototype_note,
  drop column if exists credibility_notes;

alter table if exists public.organization_references
  drop column if exists credibility_notes;

commit;
