-- Run once on an existing database so approving a document clears old
-- placeholder or revision remarks. Remarks remain required only for revision
-- and rejection decisions in the admin UI.

create or replace function public.update_admin_document_submission_file_review(
  _session_token text,
  _file_id uuid,
  _status public.document_submission_status,
  _admin_remarks text default null
)
returns setof public.document_submission_files
language plpgsql
security definer
set search_path = public
as $$
declare
  _admin_id uuid;
  _reviewed_at timestamptz := now();
  _submission_id uuid;
  _document_name text;
  _overall_status public.document_submission_status;
  _overall_remarks text;
begin
  select vat.admin_id
  into _admin_id
  from public.validate_admin_session_token(_session_token) vat
  limit 1;

  if _admin_id is null then
    raise exception 'Admin account is not authorized.';
  end if;

  select
    document_submission_files.submission_id,
    coalesce(required_document_types.name, document_submission_files.file_name)
  into _submission_id, _document_name
  from public.document_submission_files
  left join public.required_document_types
    on required_document_types.id = document_submission_files.document_type_id
  where document_submission_files.id = _file_id
  limit 1;

  if _submission_id is null then
    raise exception 'Document submission file was not found.';
  end if;

  update public.document_submission_files
  set
    admin_status = _status,
    admin_remarks = case
      when _status in ('needs_revision', 'rejected_red')
        then coalesce(_admin_remarks, document_submission_files.admin_remarks)
      else null
    end,
    reviewed_at = _reviewed_at,
    updated_at = _reviewed_at
  where document_submission_files.id = _file_id;

  select
    case
      when exists (
        select 1
        from public.document_submission_files
        where submission_id = _submission_id
          and admin_status = 'rejected_red'
      ) then 'rejected_red'::public.document_submission_status
      when exists (
        select 1
        from public.document_submission_files
        where submission_id = _submission_id
          and admin_status = 'needs_revision'
      ) then 'needs_revision'::public.document_submission_status
      when exists (
        select 1
        from public.document_submission_files
        where submission_id = _submission_id
      ) and not exists (
        select 1
        from public.document_submission_files
        where submission_id = _submission_id
          and admin_status <> 'approved_green'
      ) then 'approved_green'::public.document_submission_status
      else 'under_admin_review'::public.document_submission_status
    end
  into _overall_status;

  _overall_remarks :=
    case
      when _status = 'approved_green' then format('Admin approved %s.', _document_name)
      when _status = 'needs_revision' then format('Admin requested revisions for %s.', _document_name)
      else format('Admin rejected %s.', _document_name)
    end;

  update public.document_submissions
  set
    status = _overall_status,
    reviewed_by = null,
    reviewed_at = _reviewed_at,
    overall_remarks = _overall_remarks,
    updated_at = _reviewed_at
  where document_submissions.id = _submission_id;

  return query
  select *
  from public.document_submission_files
  where document_submission_files.id = _file_id;
end;
$$;

-- Remove previously stored placeholders such as "Awaiting admin review." and
-- stale approval remarks. Only actionable review outcomes keep feedback.
update public.document_submission_files
set
  admin_remarks = null,
  updated_at = now()
where admin_status not in ('needs_revision', 'rejected_red')
  and admin_remarks is not null;
