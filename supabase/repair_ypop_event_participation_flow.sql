-- Apply this on an existing database after supabase_all_in_one.sql.
-- Adds YPOP event join / proof / verification flow.

do $$ begin
  create type public.ypop_event_participation_status as enum (
    'pending_verification',
    'verified',
    'needs_revision',
    'rejected'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.ypop_event_participations (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organization_profiles(id) on delete cascade,
  submitted_by       uuid references auth.users(id),
  activity_id        uuid not null references public.ypop_city_activities(id) on delete cascade,
  activity_name      text not null,
  activity_date      text,
  venue              text,
  status             public.ypop_event_participation_status not null default 'pending_verification',
  admin_remarks      text not null default '',
  joined_at          timestamptz not null default now(),
  proof_submitted_at timestamptz,
  verified_at        timestamptz,
  revision_history   jsonb not null default '[]',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint ypop_event_participations_org_activity_unique unique (organization_id, activity_id)
);

create table if not exists public.ypop_event_files (
  id               uuid primary key default gen_random_uuid(),
  participation_id uuid not null references public.ypop_event_participations(id) on delete cascade,
  organization_id  uuid not null references public.organization_profiles(id) on delete cascade,
  file_name        text not null,
  file_url         text not null default '',
  file_type        text not null default '',
  file_size        bigint,
  uploaded_at      timestamptz not null default now()
);

create index if not exists idx_ypop_event_participations_organization_id on public.ypop_event_participations(organization_id);
create index if not exists idx_ypop_event_participations_activity_id on public.ypop_event_participations(activity_id);
create index if not exists idx_ypop_event_participations_status on public.ypop_event_participations(status);
create index if not exists idx_ypop_event_files_participation_id on public.ypop_event_files(participation_id);
create index if not exists idx_ypop_event_files_organization_id on public.ypop_event_files(organization_id);

alter table public.ypop_event_participations enable row level security;
alter table public.ypop_event_files enable row level security;

drop policy if exists ypop_event_participations_self_or_admin on public.ypop_event_participations;
create policy ypop_event_participations_self_or_admin on public.ypop_event_participations
  for all using (
    public.current_user_is_admin()
    or submitted_by = auth.uid()
    or exists (
      select 1 from public.organization_profiles op
      where op.id = ypop_event_participations.organization_id
        and op.user_id = auth.uid()
    )
  ) with check (
    public.current_user_is_admin()
    or submitted_by = auth.uid()
    or exists (
      select 1 from public.organization_profiles op
      where op.id = ypop_event_participations.organization_id
        and op.user_id = auth.uid()
    )
  );

drop policy if exists ypop_event_files_self_or_admin on public.ypop_event_files;
create policy ypop_event_files_self_or_admin on public.ypop_event_files
  for all using (
    public.current_user_is_admin()
    or exists (
      select 1 from public.organization_profiles op
      where op.id = ypop_event_files.organization_id
        and op.user_id = auth.uid()
    )
  ) with check (
    public.current_user_is_admin()
    or exists (
      select 1 from public.organization_profiles op
      where op.id = ypop_event_files.organization_id
        and op.user_id = auth.uid()
    )
  );

create or replace function public.admin_update_ypop_event_participation(
  _session_token      text,
  _participation_id   uuid,
  _status             public.ypop_event_participation_status,
  _admin_remarks      text,
  _proof_submitted_at timestamptz,
  _verified_at        timestamptz,
  _revision_history   jsonb
)
returns setof public.ypop_event_participations
language plpgsql
security definer
set search_path = public
as $$
declare
  _admin_id uuid;
begin
  select vat.admin_id into _admin_id
  from public.validate_admin_session_token(_session_token) vat limit 1;
  if _admin_id is null then raise exception 'Admin account is not authorized.'; end if;

  update public.ypop_event_participations set
    status             = coalesce(_status, status),
    admin_remarks      = coalesce(_admin_remarks, admin_remarks),
    proof_submitted_at = coalesce(_proof_submitted_at, proof_submitted_at),
    verified_at        = case
                           when coalesce(_status, status) = 'verified'::public.ypop_event_participation_status
                             then coalesce(_verified_at, now())
                           else _verified_at
                         end,
    revision_history   = coalesce(_revision_history, revision_history),
    updated_at         = now()
  where id = _participation_id;

  return query select * from public.ypop_event_participations where id = _participation_id;
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
    coalesce((select jsonb_agg(to_jsonb(rdt) order by rdt.sort_order asc, rdt.created_at asc) from public.required_document_types rdt), '[]'::jsonb),
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
    coalesce((select jsonb_agg(to_jsonb(yef) order by yef.uploaded_at desc) from public.ypop_event_files yef), '[]'::jsonb)
  );
end;
$$;
