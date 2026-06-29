-- ============================================================================
-- YPOP Organization-Initiated Activity Logging
-- ============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'ypop_org_activity_status'
  ) then
    create type public.ypop_org_activity_status as enum (
      'draft',
      'submitted',
      'under_review',
      'needs_revision',
      'approved',
      'rejected'
    );
  end if;
end
$$;

create table if not exists public.ypop_org_activities (
  id                uuid primary key default gen_random_uuid(),
  ypop_entry_id     uuid not null references public.ypop_entries(id) on delete cascade,
  organization_id   uuid not null references public.organization_profiles(id) on delete cascade,
  submitted_by      uuid references auth.users(id) on delete set null,
  activity_name     text not null default '',
  activity_date     text not null default '',
  venue             text not null default '',
  narrative_report  text not null default '',
  status            public.ypop_org_activity_status not null default 'draft',
  admin_remarks     text not null default '',
  submitted_at      timestamptz,
  approved_at       timestamptz,
  revision_history  jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default timezone('utc', now()),
  updated_at        timestamptz not null default timezone('utc', now())
);

create table if not exists public.ypop_org_activity_files (
  id                uuid primary key default gen_random_uuid(),
  org_activity_id   uuid not null references public.ypop_org_activities(id) on delete cascade,
  organization_id   uuid not null references public.organization_profiles(id) on delete cascade,
  file_name         text not null,
  file_url          text not null,
  file_type         text not null default '',
  file_size         bigint,
  uploaded_at       timestamptz not null default timezone('utc', now()),
  created_at        timestamptz not null default timezone('utc', now())
);

create index if not exists idx_ypop_org_activities_entry_id on public.ypop_org_activities(ypop_entry_id);
create index if not exists idx_ypop_org_activities_org_id on public.ypop_org_activities(organization_id);
create index if not exists idx_ypop_org_activities_status on public.ypop_org_activities(status);
create index if not exists idx_ypop_org_activity_files_activity_id on public.ypop_org_activity_files(org_activity_id);
create index if not exists idx_ypop_org_activity_files_org_id on public.ypop_org_activity_files(organization_id);

create or replace function public.touch_ypop_org_activity_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_touch_ypop_org_activity_updated_at on public.ypop_org_activities;
create trigger trg_touch_ypop_org_activity_updated_at
before update on public.ypop_org_activities
for each row
execute function public.touch_ypop_org_activity_updated_at();

alter table public.ypop_org_activities enable row level security;
alter table public.ypop_org_activity_files enable row level security;

drop policy if exists ypop_org_activities_self_or_admin on public.ypop_org_activities;
create policy ypop_org_activities_self_or_admin on public.ypop_org_activities
for all using (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.organization_profiles op
    where op.id = ypop_org_activities.organization_id
      and op.user_id = auth.uid()
  )
) with check (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.organization_profiles op
    where op.id = ypop_org_activities.organization_id
      and op.user_id = auth.uid()
  )
);

drop policy if exists ypop_org_activity_files_self_or_admin on public.ypop_org_activity_files;
create policy ypop_org_activity_files_self_or_admin on public.ypop_org_activity_files
for all using (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.organization_profiles op
    where op.id = ypop_org_activity_files.organization_id
      and op.user_id = auth.uid()
  )
) with check (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.organization_profiles op
    where op.id = ypop_org_activity_files.organization_id
      and op.user_id = auth.uid()
  )
);

create or replace function public.admin_update_ypop_org_activity(
  _session_token text,
  _activity_id uuid,
  _status public.ypop_org_activity_status,
  _admin_remarks text,
  _approved_at timestamptz,
  _revision_history jsonb
)
returns setof public.ypop_org_activities
language plpgsql
security definer
set search_path = public
as $$
declare
  _admin_id uuid;
begin
  select vat.admin_id
  into _admin_id
  from public.validate_admin_session_token(_session_token) vat
  limit 1;

  if _admin_id is null then
    raise exception 'Admin account is not authorized.';
  end if;

  update public.ypop_org_activities
  set
    status = coalesce(_status, status),
    admin_remarks = coalesce(_admin_remarks, admin_remarks),
    approved_at = coalesce(_approved_at, approved_at),
    revision_history = coalesce(_revision_history, revision_history),
    updated_at = timezone('utc', now())
  where id = _activity_id;

  return query
  select *
  from public.ypop_org_activities
  where id = _activity_id;
end;
$$;

create or replace function public.get_admin_portal_snapshot(_session_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _admin_id uuid;
begin
  select vat.admin_id
  into _admin_id
  from public.validate_admin_session_token(_session_token) vat
  limit 1;

  if _admin_id is null then
    raise exception 'Admin account is not authorized.';
  end if;

  return jsonb_build_object(
    'organization_profiles',
    coalesce((select jsonb_agg(to_jsonb(op) order by op.created_at desc) from public.organization_profiles op), '[]'::jsonb),
    'document_submissions',
    coalesce((select jsonb_agg(to_jsonb(ds) order by ds.created_at desc) from public.document_submissions ds), '[]'::jsonb),
    'document_submission_files',
    coalesce(
      (select jsonb_agg(
        jsonb_build_object(
          'id', dsf.id, 'submission_id', dsf.submission_id, 'file_url', dsf.file_url,
          'file_name', dsf.file_name, 'file_type', dsf.file_type, 'file_size', dsf.file_size,
          'ocr_text', dsf.ocr_text, 'ocr_status', dsf.ocr_status, 'ocr_confidence', dsf.ocr_confidence,
          'validation_status', dsf.validation_status, 'admin_status', dsf.admin_status,
          'admin_remarks', dsf.admin_remarks, 'ocr_metadata', dsf.ocr_metadata,
          'uploaded_at', dsf.uploaded_at, 'reviewed_at', dsf.reviewed_at,
          'created_at', dsf.created_at, 'updated_at', dsf.updated_at,
          'required_document_types', jsonb_build_object('id', rdt.id, 'name', rdt.name)
        ) order by dsf.created_at desc)
       from public.document_submission_files dsf
       left join public.required_document_types rdt on rdt.id = dsf.document_type_id),
      '[]'::jsonb),
    'budget_requests',
    coalesce((select jsonb_agg(to_jsonb(br) order by br.created_at desc) from public.budget_requests br), '[]'::jsonb),
    'budget_request_files',
    coalesce((select jsonb_agg(to_jsonb(brf) order by brf.created_at desc) from public.budget_request_files brf), '[]'::jsonb),
    'liquidation_reports',
    coalesce((select jsonb_agg(to_jsonb(lr) order by lr.created_at desc) from public.liquidation_reports lr), '[]'::jsonb),
    'liquidation_report_files',
    coalesce((select jsonb_agg(to_jsonb(lrf) order by lrf.created_at desc) from public.liquidation_report_files lrf), '[]'::jsonb),
    'news_releases',
    coalesce((select jsonb_agg(to_jsonb(nr) order by nr.date_posted desc, nr.created_at desc) from public.news_releases nr), '[]'::jsonb),
    'transparency_posts',
    coalesce((select jsonb_agg(to_jsonb(tp) order by tp.post_date desc, tp.created_at desc) from public.transparency_posts tp), '[]'::jsonb),
    'compliance_remarks',
    coalesce((select jsonb_agg(to_jsonb(cr) order by cr.created_at desc) from public.compliance_remarks cr), '[]'::jsonb),
    'notifications',
    coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc) from public.notifications n), '[]'::jsonb),
    'activity_logs',
    coalesce((select jsonb_agg(to_jsonb(al) order by al.created_at desc) from public.activity_logs al), '[]'::jsonb),
    'templates',
    coalesce((select jsonb_agg(to_jsonb(rdt) order by rdt.sort_order asc) from public.required_document_types rdt where rdt.is_active = true), '[]'::jsonb),
    'ypop_periods',
    coalesce((select jsonb_agg(to_jsonb(yp) order by yp.created_at desc) from public.ypop_periods yp), '[]'::jsonb),
    'ypop_city_activities',
    coalesce((select jsonb_agg(to_jsonb(ya) order by ya.created_at asc) from public.ypop_city_activities ya), '[]'::jsonb),
    'ypop_entries',
    coalesce((select jsonb_agg(to_jsonb(ye) order by ye.created_at desc) from public.ypop_entries ye), '[]'::jsonb),
    'ypop_files',
    coalesce((select jsonb_agg(to_jsonb(yf) order by yf.uploaded_at desc) from public.ypop_files yf), '[]'::jsonb),
    'ypop_event_participations',
    coalesce((select jsonb_agg(to_jsonb(yep) order by yep.created_at desc) from public.ypop_event_participations yep), '[]'::jsonb),
    'ypop_event_files',
    coalesce((select jsonb_agg(to_jsonb(yef) order by yef.uploaded_at desc) from public.ypop_event_files yef), '[]'::jsonb),
    'ypop_org_activities',
    coalesce((select jsonb_agg(to_jsonb(yoa) order by yoa.created_at desc) from public.ypop_org_activities yoa), '[]'::jsonb),
    'ypop_org_activity_files',
    coalesce((select jsonb_agg(to_jsonb(yoaf) order by yoaf.uploaded_at desc) from public.ypop_org_activity_files yoaf), '[]'::jsonb)
  );
end;
$$;
