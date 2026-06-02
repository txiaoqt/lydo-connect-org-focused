begin;

create index if not exists idx_user_roles_role_id on public.user_roles(role_id);
create index if not exists idx_user_profiles_barangay on public.user_profiles(barangay_id);
create index if not exists idx_programs_sector_status on public.programs(sector,status);
create index if not exists idx_events_date_status on public.events(event_date,status);
create index if not exists idx_orgs_status_type on public.organizations(status,type);
create index if not exists idx_disclosure_filters on public.disclosure_documents(fiscal_year,quarter,document_type,barangay_id,office_id);
create index if not exists idx_financial_lookup on public.barangay_financials(barangay_id,fiscal_year,month_no);
create index if not exists idx_youth_metrics_lookup on public.barangay_youth_metrics(barangay_id,fiscal_year);
create index if not exists idx_monthly_lookup on public.monthly_compliance(barangay_id,fiscal_year,month_no);
create index if not exists idx_tickets_status_created on public.youth_tickets(status,created_at desc);
create index if not exists idx_tickets_ref_lower on public.youth_tickets(lower(reference_no));

create unique index if not exists uq_user_program_active
  on public.user_program_memberships(user_id, program_id) where left_at is null;

create unique index if not exists uq_user_org_active
  on public.user_org_memberships(user_id, organization_id) where left_at is null;

create unique index if not exists uq_event_registration_active
  on public.event_registrations(user_id, event_id) where cancelled_at is null;

commit;

