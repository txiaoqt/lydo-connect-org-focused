begin;

-- Organizations: expand to a details-first model for Pasig youth information.
alter table if exists public.organizations
  add column if not exists category text,
  add column if not exists overview text,
  add column if not exists mission text,
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
  add column if not exists is_pasig_based boolean not null default true,
  add column if not exists data_status text not null default 'verified',
  add column if not exists source_reference_title text,
  add column if not exists source_reference_url text,
  add column if not exists source_reference_published_on date,
  add column if not exists credibility_notes text,
  add column if not exists last_verified_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organizations_data_status_check'
  ) then
    alter table public.organizations
      add constraint organizations_data_status_check
      check (data_status in ('verified', 'partially_verified', 'unverified'));
  end if;
end $$;

-- Normalized references: supports multiple official sources per organization.
create table if not exists public.organization_references (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reference_title text not null,
  reference_url text not null,
  publisher text,
  published_on date,
  reference_type text,
  credibility_notes text,
  is_official boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_org_references_org_url
  on public.organization_references(organization_id, reference_url);

create index if not exists idx_orgs_pasig_status_type
  on public.organizations(is_pasig_based, status, type);

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

-- Pasig-based, source-backed organization records.
insert into public.organizations (
  slug,
  name,
  type,
  category,
  focus,
  overview,
  mission,
  objectives,
  programs_projects,
  coverage_area,
  target_beneficiaries,
  contact_email,
  contact_phone,
  contact_facebook,
  contact_website,
  related_initiatives,
  related_events,
  activity_year,
  source_tag,
  source_post_url,
  source_reference_title,
  source_reference_url,
  source_reference_published_on,
  credibility_notes,
  is_pasig_based,
  data_status,
  status,
  last_verified_at
)
values
  (
    'pasig-city-youth-development-office',
    'Pasig City Youth Development Office (PCYDO / LYDO)',
    'City Government Office',
    'Local Youth Development Office',
    'Youth governance support, YORP implementation, youth program coordination',
    'Pasig City office under the Office of the Mayor that manages youth and youth-serving program coordination and organization registration support.',
    null,
    'Facilitate Youth Organization Registration Program and support youth-sector coordination in Pasig City.',
    'Youth Organization Registration Program (YORP); correspondence support for youth, scholarship, CSO, and sports/youth concerns.',
    'Pasig City',
    'Youth organizations and youth-serving organizations in Pasig City',
    'lydo@pasigcity.gov.ph',
    null,
    'https://www.facebook.com/Local-Youth-Development-Office-Pasig-City-104618617612581',
    'https://pasigcity.gov.ph',
    'YORP implementation under RA 10742',
    null,
    2026,
    'Pasig City official services and YORP policy context',
    'https://pasigcity.gov.ph/services/infrastructure-development-sector',
    'YORP Registration Bukas na para sa mga Kabataang Pasigueno!',
    'https://pasigcity.gov.ph/news-and-releases/yorp-registration-bukas-na-para-sa-mga-kabataang-pasigueno-670',
    date '2025-03-19',
    null,
    'Official Pasig City government page and city-hosted LYDO charter PDF.',
    true,
    'verified',
    'active',
    now()
  ),
  (
    'pasig-sk-federation',
    'Pasig City Sangguniang Kabataan Federation',
    'Youth Governance',
    'SK Federation',
    'City-level youth council federation and youth policy/program leadership',
    'City-wide SK federation recognized in official Pasig City announcements and youth governance activities.',
    null,
    'Represent barangay SK councils and lead city-level youth activities with LGU partners.',
    'Linggo ng Kabataan 2025 activities; city youth governance and recognition initiatives.',
    'Pasig City',
    'Kabataang Pasigueno and barangay youth councils',
    null,
    null,
    null,
    'https://pasigcity.gov.ph',
    'Linggo ng Kabataan 2025; SK Awards participation',
    null,
    2025,
    'Pasig City news release',
    'https://pasigcity.gov.ph/news-and-releases/natatanging-kabataang-pasigueno-pinarangalan-sa-sgyg-at-gka-2025-481',
    'Natatanging Kabataang Pasigueno, Pinarangalan sa SGYG at GKA 2025',
    'https://pasigcity.gov.ph/news-and-releases/natatanging-kabataang-pasigueno-pinarangalan-sa-sgyg-at-gka-2025-481',
    null,
    'Official city release references Pasig SK Federation in SGYG/GKA 2025 implementation.',
    true,
    'verified',
    'active',
    now()
  ),
  (
    'pasig-city-youth-development-council',
    'Pasig City Youth Development Council (PCYDC)',
    'Youth Governance',
    'Youth Development Council',
    'Multi-stakeholder youth development coordination',
    'Youth development council referenced in official Pasig SGYG/GKA 2025 ecosystem.',
    null,
    null,
    null,
    'Pasig City',
    'Kabataang Pasigueno and youth sector stakeholders',
    null,
    null,
    null,
    'https://pasigcity.gov.ph',
    'SGYG 2025 validation process',
    'SGYG and GKA 2025',
    2025,
    'Pasig City news release',
    'https://pasigcity.gov.ph/news-and-releases/natatanging-kabataang-pasigueno-pinarangalan-sa-sgyg-at-gka-2025-481',
    'Natatanging Kabataang Pasigueno, Pinarangalan sa SGYG at GKA 2025',
    'https://pasigcity.gov.ph/news-and-releases/natatanging-kabataang-pasigueno-pinarangalan-sa-sgyg-at-gka-2025-481',
    null,
    'Official city announcement references PCYDC; additional structural details not explicitly published in source pack.',
    true,
    'partially_verified',
    'active',
    now()
  ),
  (
    'pasiglaban-kabataan',
    'PasigLaban Kabataan',
    'Youth/Youth-Serving Organization',
    'YO/YSO',
    'Positive youth development and youth-serving initiatives',
    'Youth/youth-serving organization cited by Pasig City as a national finalist in an official youth development-related announcement.',
    null,
    null,
    null,
    'Pasig City',
    'Kabataang Pasigueno',
    null,
    null,
    null,
    'https://pasigcity.gov.ph',
    'Positive Youth Development Awards participation',
    null,
    2024,
    'Pasig City news release',
    'https://pasigcity.gov.ph/news-and-releases/national-finalists-outstanding-sk-council-category-federation-724',
    'National Finalists | Outstanding SK Council Category - Federation',
    'https://pasigcity.gov.ph/news-and-releases/national-finalists-outstanding-sk-council-category-federation-724',
    date '2024-08-06',
    'Entity mentioned by official Pasig City announcement; unavailable details are intentionally null.',
    true,
    'partially_verified',
    'active',
    now()
  ),
  (
    'pasig-yo-yso-network',
    'Pasig Youth/Youth-Serving Organizations Network (YO/YSO sector)',
    'Multi-organization Network',
    'Youth Organization Network',
    'Coordination network of youth and youth-serving organizations in Pasig',
    'Sector-level representation referenced by Pasig City in youth agenda convenings.',
    null,
    'Support youth agenda alignment and participation through coordinated city-level activities.',
    null,
    'Pasig City',
    'Registered and participating youth/youth-serving organizations in Pasig',
    null,
    null,
    null,
    'https://pasigcity.gov.ph',
    'S1NCRO One Pasig, One Agenda',
    'S1NCRO: One Pasig, One Agenda',
    2026,
    'Pasig City news release',
    'https://pasigcity.gov.ph/news-and-releases/s1ncro-one-pasig-one-agenda-idinaos-para-sa-pagpapalakas-ng-sektor-ng-kabataan-sa-lungsod-ng-pasig-209',
    'S1NCRO: One Pasig, One Agenda',
    'https://pasigcity.gov.ph/news-and-releases/s1ncro-one-pasig-one-agenda-idinaos-para-sa-pagpapalakas-ng-sektor-ng-kabataan-sa-lungsod-ng-pasig-209',
    null,
    'Official city announcement references 51 YO/YSOs and participation counts; organization-level specifics not individually published.',
    true,
    'partially_verified',
    'active',
    now()
  )
on conflict (slug) do update set
  name = excluded.name,
  type = excluded.type,
  category = excluded.category,
  focus = excluded.focus,
  overview = excluded.overview,
  mission = excluded.mission,
  objectives = excluded.objectives,
  programs_projects = excluded.programs_projects,
  coverage_area = excluded.coverage_area,
  target_beneficiaries = excluded.target_beneficiaries,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  contact_facebook = excluded.contact_facebook,
  contact_website = excluded.contact_website,
  related_initiatives = excluded.related_initiatives,
  related_events = excluded.related_events,
  activity_year = excluded.activity_year,
  source_tag = excluded.source_tag,
  source_post_url = excluded.source_post_url,
  source_reference_title = excluded.source_reference_title,
  source_reference_url = excluded.source_reference_url,
  source_reference_published_on = excluded.source_reference_published_on,
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
    (
      'pasig-city-youth-development-office',
      'Pasig City Services: Pasig City Youth Development Office',
      'https://pasigcity.gov.ph/services/infrastructure-development-sector',
      'Pasig City Government',
      null::date,
      'official_page',
      'Office profile and service summary for Pasig City Youth Development Office.',
      true
    ),
    (
      'pasig-city-youth-development-office',
      'Pasig City Directory',
      'https://pasigcity.gov.ph/about-pasig-city/directory',
      'Pasig City Government',
      null::date,
      'directory',
      'Official city directory page used for office listings and contact references.',
      true
    ),
    (
      'pasig-city-youth-development-office',
      'LYDO Citizens Charter (Tagalog)',
      'https://assets.pasigcity.gov.ph/storage/attachments/local_youth_development_office/686b66e11a2fb1751869153Citizen_s%20Charter%20Tagalog.pdf',
      'Pasig City Government',
      null::date,
      'citizen_charter',
      'Contains YORP process, office details, and official contact channels.',
      true
    ),
    (
      'pasig-city-youth-development-office',
      'YORP Registration Bukas na para sa mga Kabataang Pasigueno!',
      'https://pasigcity.gov.ph/news-and-releases/yorp-registration-bukas-na-para-sa-mga-kabataang-pasigueno-670',
      'Pasig City Government',
      date '2025-03-19',
      'news_release',
      'References NYC mandate, Pasig Ordinance 14-2018 and 50-2024, and LYDO verification role.',
      true
    ),
    (
      'pasig-sk-federation',
      'Natatanging Kabataang Pasigueno, Pinarangalan sa SGYG at GKA 2025',
      'https://pasigcity.gov.ph/news-and-releases/natatanging-kabataang-pasigueno-pinarangalan-sa-sgyg-at-gka-2025-481',
      'Pasig City Government',
      null::date,
      'news_release',
      'Official city release referencing Pasig SK Federation in SGYG/GKA collaboration.',
      true
    ),
    (
      'pasig-city-youth-development-council',
      'Natatanging Kabataang Pasigueno, Pinarangalan sa SGYG at GKA 2025',
      'https://pasigcity.gov.ph/news-and-releases/natatanging-kabataang-pasigueno-pinarangalan-sa-sgyg-at-gka-2025-481',
      'Pasig City Government',
      null::date,
      'news_release',
      'Official city release includes PCYDC among SGYG 2025 validation stakeholders.',
      true
    ),
    (
      'pasiglaban-kabataan',
      'National Finalists | Outstanding SK Council Category - Federation',
      'https://pasigcity.gov.ph/news-and-releases/national-finalists-outstanding-sk-council-category-federation-724',
      'Pasig City Government',
      date '2024-08-06',
      'news_release',
      'Official city announcement naming PasigLaban Kabataan as national finalist.',
      true
    ),
    (
      'pasig-yo-yso-network',
      'S1NCRO: One Pasig, One Agenda',
      'https://pasigcity.gov.ph/news-and-releases/s1ncro-one-pasig-one-agenda-idinaos-para-sa-pagpapalakas-ng-sektor-ng-kabataan-sa-lungsod-ng-pasig-209',
      'Pasig City Government',
      null::date,
      'news_release',
      'Official city release referencing participation from 51 youth/youth-serving organizations.',
      true
    )
) as v(
  slug,
  reference_title,
  reference_url,
  publisher,
  published_on,
  reference_type,
  credibility_notes,
  is_official
)
  on o.slug = v.slug
on conflict do nothing;

commit;
