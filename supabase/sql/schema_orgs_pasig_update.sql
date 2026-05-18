begin;

-- Organizations: prototype-friendly details-first model.
alter table if exists public.organizations
  add column if not exists category text,
  add column if not exists overview text,
  add column if not exists mission text,
  add column if not exists purpose text,
  add column if not exists objectives text,
  add column if not exists programs_projects text,
  add column if not exists coverage_area text,
  add column if not exists target_beneficiaries text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists contact_facebook text,
  add column if not exists contact_website text,
  add column if not exists related_initiatives text,
  add column if not exists related_events text,
  add column if not exists activity_year integer check (activity_year is null or activity_year between 1900 and 2100),
  add column if not exists is_pasig_based boolean not null default false,
  add column if not exists data_status text not null default 'verified',
  add column if not exists source_label text,
  add column if not exists source_reference_title text,
  add column if not exists source_reference_url text,
  add column if not exists source_reference_published_on date,
  add column if not exists prototype_note text,
  add column if not exists credibility_notes text,
  add column if not exists last_verified_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organizations_data_status_check'
  ) then
    alter table public.organizations
      add constraint organizations_data_status_check
      check (data_status in ('verified', 'partially_verified', 'unverified'));
  end if;
end $$;

create table if not exists public.organization_references (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reference_title text not null,
  reference_url text not null,
  publisher text,
  published_on date,
  reference_type text,
  credibility_notes text,
  is_official boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_org_references_org_url
  on public.organization_references(organization_id, reference_url);

create table if not exists public.organization_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  activity_type text,
  date_label text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_organization_projects_org
  on public.organization_projects(organization_id, created_at desc);

create index if not exists idx_orgs_status_type
  on public.organizations(status, type);

create index if not exists idx_orgs_category
  on public.organizations(category);

create index if not exists idx_orgs_activity_year
  on public.organizations(activity_year);

create index if not exists idx_orgs_barangay
  on public.organizations(barangay_id);

create index if not exists idx_orgs_name_lower
  on public.organizations(lower(name));

create index if not exists idx_orgs_source_reference_url
  on public.organizations(source_reference_url);

create index if not exists idx_org_refs_published_on
  on public.organization_references(published_on);

create index if not exists idx_org_refs_reference_type
  on public.organization_references(reference_type);

create index if not exists idx_org_refs_official
  on public.organization_references(is_official);

create index if not exists idx_orgs_search_tsv
  on public.organizations
  using gin (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' ||
      coalesce(type, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(focus, '') || ' ' ||
      coalesce(overview, '') || ' ' ||
      coalesce(programs_projects, '') || ' ' ||
      coalesce(coverage_area, '')
    )
  );

alter table if exists public.organization_references enable row level security;
alter table if exists public.organization_projects enable row level security;

drop policy if exists public_read_organization_references on public.organization_references;
create policy public_read_organization_references
on public.organization_references
for select
using (true);

drop policy if exists manage_organization_references on public.organization_references;
create policy manage_organization_references
on public.organization_references
for all
using (public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]))
with check (public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

drop policy if exists public_read_organization_projects on public.organization_projects;
create policy public_read_organization_projects
on public.organization_projects
for select
using (true);

drop policy if exists manage_organization_projects on public.organization_projects;
create policy manage_organization_projects
on public.organization_projects
for all
using (public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]))
with check (public.current_user_has_any_role(array['admin','staff','sk']::public.app_role_code[]));

insert into public.organizations (
  slug,
  name,
  type,
  category,
  focus,
  overview,
  mission,
  purpose,
  objectives,
  programs_projects,
  coverage_area,
  target_beneficiaries,
  contact_email,
  contact_phone,
  source_label,
  source_tag,
  source_post_url,
  source_reference_title,
  source_reference_url,
  source_reference_published_on,
  prototype_note,
  credibility_notes,
  is_pasig_based,
  data_status,
  status,
  last_verified_at
)
values
  (
    'testing-youth-organization-i',
    'Testing Youth Organization I',
    'Civic Volunteer Group',
    'Prototype Civic Group',
    'Community service and civic volunteerism',
    'Prototype youth organization focused on community service and civic participation.',
    'Encourage prototype volunteerism among youth communities.',
    'Provide prototype services and engagement opportunities.',
    'Coordinate outreach and youth support activities for testing flows.',
    'Testing Community Outreach Project I; Testing Volunteer Activity I',
    'Barangay-wide',
    'Prototype youth volunteers',
    'prototype.org1@example.com',
    '+639100200001',
    'Prototype Data',
    'Internal Prototype Seed',
    'https://example.com/prototype-organization-i',
    'Prototype Organization Reference I',
    'https://example.com/prototype-organization-i/reference',
    date '2026-04-01',
    'Prototype record for demonstration and testing.',
    'Internal prototype context only.',
    false,
    'verified',
    'active',
    now()
  ),
  (
    'testing-youth-organization-ii',
    'Testing Youth Organization II',
    'Advocacy Network',
    'Prototype Advocacy Group',
    'Environmental awareness',
    'Prototype advocacy network created for testing organization information display.',
    'Promote prototype awareness campaigns and civic engagement.',
    'Support awareness-driven youth collaboration.',
    'Run prototype campaigns across youth groups.',
    'Testing Environmental Action Drive I; Testing Advocacy Session I',
    'Multi-barangay coverage',
    'Prototype youth advocates',
    'prototype.org2@example.com',
    '+639100200002',
    'Demo Record',
    'Internal Prototype Seed',
    'https://example.com/prototype-organization-ii',
    'Prototype Organization Reference II',
    'https://example.com/prototype-organization-ii/reference',
    date '2026-04-05',
    'Prototype record for demonstration and testing.',
    'Internal prototype context only.',
    false,
    'verified',
    'partner',
    now()
  ),
  (
    'testing-youth-organization-iii',
    'Testing Youth Organization III',
    'Multi-organization Network',
    'Prototype Network',
    'Youth leadership and governance',
    'Prototype multi-organization network for profile and details-view testing.',
    'Build collaborative leadership pathways for prototype records.',
    'Coordinate prototype organizations under one umbrella workflow.',
    'Facilitate shared activities and records for demo use.',
    'Testing Youth Leadership Activity I; Testing Network Assembly I',
    'Prototype Municipality',
    'Prototype youth leaders',
    'prototype.org3@example.com',
    '+639100200003',
    'Prototype Data',
    'Internal Prototype Seed',
    'https://example.com/prototype-organization-iii',
    'Prototype Organization Reference III',
    'https://example.com/prototype-organization-iii/reference',
    date '2026-04-09',
    'Prototype record for demonstration and testing.',
    'Internal prototype context only.',
    false,
    'partially_verified',
    'active',
    now()
  ),
  (
    'testing-youth-organization-iv',
    'Testing Youth Organization IV',
    'Youth Interest Group',
    'Prototype Interest Group',
    'Digital literacy and skills development',
    'Prototype youth interest group used for digital literacy record testing.',
    'Promote prototype digital skills and technology awareness.',
    'Offer prototype learning sessions for youth.',
    'Support digital skills development demos.',
    'Testing Digital Skills Workshop I',
    'Youth community coverage',
    'Prototype student participants',
    'prototype.org4@example.com',
    '+639100200004',
    'Demo Record',
    'Internal Prototype Seed',
    'https://example.com/prototype-organization-iv',
    'Prototype Organization Reference IV',
    'https://example.com/prototype-organization-iv/reference',
    date '2026-04-12',
    'Prototype record for demonstration and testing.',
    'Internal prototype context only.',
    false,
    'verified',
    'inactive',
    now()
  ),
  (
    'testing-youth-organization-v',
    'Testing Youth Organization V',
    'Youth Governance',
    'Prototype Governance Group',
    'Education support',
    'Prototype governance-oriented organization profile for testing.',
    'Encourage structured youth participation in prototype policy activities.',
    'Demonstrate governance workflows and role-based records.',
    'Facilitate prototype education support planning.',
    'Testing Education Support Activity I',
    'Barangay-wide',
    'Prototype youth councils',
    'prototype.org5@example.com',
    '+639100200005',
    'Prototype Data',
    'Internal Prototype Seed',
    'https://example.com/prototype-organization-v',
    'Prototype Organization Reference V',
    'https://example.com/prototype-organization-v/reference',
    date '2026-04-15',
    'Prototype record for demonstration and testing.',
    'Internal prototype context only.',
    false,
    'verified',
    'active',
    now()
  ),
  (
    'testing-youth-organization-vi',
    'Testing Youth Organization VI',
    'Campus Youth Partner',
    'Prototype Campus Partner',
    'Sports and wellness',
    'Prototype campus youth partner used for demonstrating organization profiles.',
    'Promote balanced prototype activities for wellness and participation.',
    'Support prototype wellness and sports engagement.',
    'Coordinate campus-oriented demo activities.',
    'Testing Sports and Wellness Activity I',
    'Campus-based coverage',
    'Prototype campus members',
    'prototype.org6@example.com',
    '+639100200006',
    'Demo Record',
    'Internal Prototype Seed',
    'https://example.com/prototype-organization-vi',
    'Prototype Organization Reference VI',
    'https://example.com/prototype-organization-vi/reference',
    date '2026-04-18',
    'Prototype record for demonstration and testing.',
    'Internal prototype context only.',
    false,
    'verified',
    'partner',
    now()
  )
on conflict (slug) do update set
  name = excluded.name,
  type = excluded.type,
  category = excluded.category,
  focus = excluded.focus,
  overview = excluded.overview,
  mission = excluded.mission,
  purpose = excluded.purpose,
  objectives = excluded.objectives,
  programs_projects = excluded.programs_projects,
  coverage_area = excluded.coverage_area,
  target_beneficiaries = excluded.target_beneficiaries,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  source_label = excluded.source_label,
  source_tag = excluded.source_tag,
  source_post_url = excluded.source_post_url,
  source_reference_title = excluded.source_reference_title,
  source_reference_url = excluded.source_reference_url,
  source_reference_published_on = excluded.source_reference_published_on,
  prototype_note = excluded.prototype_note,
  credibility_notes = excluded.credibility_notes,
  is_pasig_based = excluded.is_pasig_based,
  data_status = excluded.data_status,
  status = excluded.status,
  last_verified_at = excluded.last_verified_at,
  updated_at = now();

insert into public.organization_references (
  organization_id,
  reference_title,
  reference_url,
  publisher,
  published_on,
  reference_type,
  credibility_notes,
  is_official
)
select
  o.id,
  v.reference_title,
  v.reference_url,
  v.publisher,
  v.published_on,
  v.reference_type,
  v.credibility_notes,
  v.is_official
from public.organizations o
join (
  values
    ('testing-youth-organization-i', 'Prototype Organization Reference I', 'https://example.com/prototype-organization-i/reference', 'Prototype Publisher', date '2026-04-01', 'prototype_reference', 'Prototype reference record.', false),
    ('testing-youth-organization-ii', 'Prototype Organization Reference II', 'https://example.com/prototype-organization-ii/reference', 'Prototype Publisher', date '2026-04-05', 'prototype_reference', 'Prototype reference record.', false),
    ('testing-youth-organization-iii', 'Prototype Organization Reference III', 'https://example.com/prototype-organization-iii/reference', 'Prototype Publisher', date '2026-04-09', 'prototype_reference', 'Prototype reference record.', false),
    ('testing-youth-organization-iv', 'Prototype Organization Reference IV', 'https://example.com/prototype-organization-iv/reference', 'Prototype Publisher', date '2026-04-12', 'prototype_reference', 'Prototype reference record.', false),
    ('testing-youth-organization-v', 'Prototype Organization Reference V', 'https://example.com/prototype-organization-v/reference', 'Prototype Publisher', date '2026-04-15', 'prototype_reference', 'Prototype reference record.', false),
    ('testing-youth-organization-vi', 'Prototype Organization Reference VI', 'https://example.com/prototype-organization-vi/reference', 'Prototype Publisher', date '2026-04-18', 'prototype_reference', 'Prototype reference record.', false)
) as v(slug, reference_title, reference_url, publisher, published_on, reference_type, credibility_notes, is_official)
  on o.slug = v.slug
on conflict do nothing;

insert into public.organization_projects (
  organization_id,
  title,
  description,
  activity_type,
  date_label,
  status
)
select
  o.id,
  p.title,
  p.description,
  p.activity_type,
  p.date_label,
  p.status
from public.organizations o
join (
  values
    ('testing-youth-organization-i', 'Testing Community Outreach Project I', 'Prototype community outreach project for demo display.', 'project', 'Q2 2026', 'active'),
    ('testing-youth-organization-ii', 'Testing Environmental Action Drive I', 'Prototype environmental action activity for demo display.', 'activity', 'Q2 2026', 'active'),
    ('testing-youth-organization-iii', 'Testing Youth Leadership Activity I', 'Prototype leadership activity for demo display.', 'activity', 'Q2 2026', 'active'),
    ('testing-youth-organization-iv', 'Testing Digital Skills Workshop I', 'Prototype digital skills workshop for demo display.', 'workshop', 'Q2 2026', 'planned'),
    ('testing-youth-organization-v', 'Testing Education Support Activity I', 'Prototype education support activity for demo display.', 'activity', 'Q3 2026', 'active'),
    ('testing-youth-organization-vi', 'Testing Sports and Wellness Activity I', 'Prototype sports and wellness activity for demo display.', 'activity', 'Q3 2026', 'active')
) as p(slug, title, description, activity_type, date_label, status)
  on o.slug = p.slug
on conflict do nothing;

commit;
