begin;

create table if not exists public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null,
  terms_content text not null,
  privacy_content text not null,
  is_active boolean not null default false,
  effective_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_policy_acceptance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_version_id uuid not null references public.policy_versions(id) on delete restrict,
  accepted_terms boolean not null default true,
  accepted_privacy boolean not null default true,
  accepted_at timestamptz not null default now(),
  accepted_ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint uq_user_policy_acceptance unique (user_id, policy_version_id)
);

create index if not exists idx_policy_versions_is_active on public.policy_versions(is_active);
create index if not exists idx_user_policy_acceptance_user_id on public.user_policy_acceptance(user_id);
create index if not exists idx_user_policy_acceptance_policy_version_id on public.user_policy_acceptance(policy_version_id);

alter table public.policy_versions enable row level security;
alter table public.user_policy_acceptance enable row level security;

drop trigger if exists trg_policy_versions_updated_at on public.policy_versions;
create trigger trg_policy_versions_updated_at
before update on public.policy_versions
for each row execute function public.set_updated_at();

drop policy if exists select_active_policy_versions on public.policy_versions;
create policy select_active_policy_versions on public.policy_versions
for select
using (is_active = true);

drop policy if exists manage_policy_versions_admin on public.policy_versions;
create policy manage_policy_versions_admin on public.policy_versions
for all
using (public.current_user_has_any_role(array['admin']::public.app_role_code[]))
with check (public.current_user_has_any_role(array['admin']::public.app_role_code[]));

drop policy if exists select_user_policy_acceptance on public.user_policy_acceptance;
create policy select_user_policy_acceptance on public.user_policy_acceptance
for select
using (auth.uid() = user_id or public.current_user_has_any_role(array['admin','staff']::public.app_role_code[]));

drop policy if exists insert_user_policy_acceptance on public.user_policy_acceptance;
create policy insert_user_policy_acceptance on public.user_policy_acceptance
for insert
with check (auth.uid() = user_id);

insert into public.policy_versions (
  version,
  title,
  terms_content,
  privacy_content,
  is_active,
  effective_date
) values (
  'v1.0',
  'Terms of Service and Privacy Policy',
  $$# Terms of Service

## Draft Notice
This Terms of Service content is a draft and should be reviewed before production use.

## 1. Purpose of the Platform
This platform provides youth-facing information and services, including programs, events, organization information, transparency records, barangay youth data, and related accountability tools.

## 2. User Accounts
Users are responsible for providing accurate account information and keeping account credentials secure.

## 3. Programs and Events
Users may browse programs and events and submit registrations where available. Registration details must be accurate and respectful.

## 4. Organization Information
Organization records are shown for information and public awareness. Users may view organization profiles, focus areas, activities, and related details.

## 5. Transparency Records
Transparency records and disclosures are provided for accountability and public information. Users must not falsify, misrepresent, or misuse public records.

## 6. Barangay Youth Data
Barangay youth metrics are provided for informational and monitoring purposes and may be updated over time.

## 7. Proper Use of the Platform
Users must not attempt unauthorized access, submit harmful or false content, harass others, or interfere with system operations.

## 8. User Submissions
If users submit registrations, forms, or requests, they are responsible for the accuracy and appropriateness of submitted content.

## 9. Prototype and Demonstration Records
Some records may be prototype or demonstration data intended for testing, presentation, and system validation.

## 10. Account Restrictions
Access may be limited or restricted when platform rules are violated or when system safety requires enforcement.

## 11. Updates to the Terms
These terms may be updated. Users may be required to accept the latest version before continuing authenticated use.

## 12. Agreement Confirmation
By accepting these terms, the user confirms understanding and agreement with these platform rules.$$,
  $$# Privacy Policy

## Draft Notice
This Privacy Policy content is a draft and should be reviewed before production use.

## 1. Information We Collect
We may collect account and profile information (such as name, email, role, barangay, municipality, contact details), registration data for programs/events, request submissions, and policy acceptance records. Technical data may also be processed for security and audit purposes.

## 2. How We Use Information
Information is used to operate user accounts, process registrations, support youth services, maintain transparency workflows, support auditability, and improve reliability and security.

## 3. Public Information
Some records (such as published programs, events, organizations, transparency documents, and barangay-level public data) may be visible publicly. Personal account data is not intended for public display unless explicitly enabled by system settings.

## 4. Admin Access
Authorized administrators may access and manage data necessary for operations, reporting, moderation, and accountability.

## 5. Data Storage
Data is stored in Supabase or configured backend services. Public files and uploaded documents may be stored in associated storage systems.

## 6. Data Sharing
User data is not sold. Data may be used only for platform operations, reporting, compliance, and legitimate administrative functions.

## 7. User Responsibilities
Users should provide accurate information and avoid submitting unnecessary sensitive personal data.

## 8. Security
The platform uses authentication, access controls, and database security policies where applicable. No system can guarantee absolute security.

## 9. Data Retention
Records may be retained for administration, reporting, accountability, and audit requirements.

## 10. Changes to this Privacy Policy
This policy may be updated. Users may be asked to accept the latest version before using authenticated features.

## 11. Contact
For questions, contact the platform administrators through the official support channel provided in the app.$$,
  true,
  date '2026-05-18'
)
on conflict (version) do update set
  title = excluded.title,
  terms_content = excluded.terms_content,
  privacy_content = excluded.privacy_content,
  is_active = excluded.is_active,
  effective_date = excluded.effective_date,
  updated_at = now();

update public.policy_versions
set is_active = case when version = 'v1.0' then true else false end;

commit;

