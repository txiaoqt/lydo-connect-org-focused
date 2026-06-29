-- ============================================================================
-- Template Scope Support
-- ============================================================================

alter table if exists public.required_document_types
  add column if not exists template_scope text not null default 'document_submission';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'required_document_types_template_scope_check'
      and conrelid = 'public.required_document_types'::regclass
  ) then
    alter table public.required_document_types
      add constraint required_document_types_template_scope_check
      check (template_scope in ('document_submission', 'other'));
  end if;
end
$$;

update public.required_document_types
set template_scope = 'document_submission'
where template_scope is null
   or template_scope not in ('document_submission', 'other');

drop function if exists public.create_admin_template_document(text, text, text, text);
create or replace function public.create_admin_template_document(
  _session_token text,
  _name text,
  _description text,
  _template_description text,
  _template_scope text
)
returns table (
  id uuid,
  name text,
  description text,
  template_url text,
  template_description text,
  sort_order integer,
  is_required boolean,
  is_active boolean,
  template_scope text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _next_sort_order integer;
  _admin_id uuid;
  _resolved_scope text;
begin
  select vat.admin_id
  into _admin_id
  from public.validate_admin_session_token(_session_token) vat
  limit 1;

  if _admin_id is null then
    raise exception 'Admin account is not authorized.';
  end if;

  _resolved_scope := case
    when _template_scope in ('document_submission', 'other') then _template_scope
    else 'document_submission'
  end;

  select coalesce(max(rdt.sort_order), 0) + 1
  into _next_sort_order
  from public.required_document_types rdt;

  return query
  insert into public.required_document_types (
    name,
    description,
    required_year,
    is_required,
    template_url,
    template_description,
    sort_order,
    is_active,
    template_scope
  )
  values (
    trim(_name),
    coalesce(_description, ''),
    extract(year from now())::integer,
    _resolved_scope = 'document_submission',
    '',
    coalesce(_template_description, ''),
    _next_sort_order,
    true,
    _resolved_scope
  )
  returning
    required_document_types.id,
    required_document_types.name,
    required_document_types.description,
    required_document_types.template_url,
    required_document_types.template_description,
    required_document_types.sort_order,
    required_document_types.is_required,
    required_document_types.is_active,
    required_document_types.template_scope,
    required_document_types.updated_at;
end;
$$;

drop function if exists public.update_admin_template_document(text, uuid, text, text, text);
create or replace function public.update_admin_template_document(
  _session_token text,
  _template_id uuid,
  _name text,
  _description text,
  _template_description text,
  _template_scope text
)
returns table (
  id uuid,
  name text,
  description text,
  template_url text,
  template_description text,
  sort_order integer,
  is_required boolean,
  is_active boolean,
  template_scope text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _admin_id uuid;
  _resolved_scope text;
begin
  select vat.admin_id
  into _admin_id
  from public.validate_admin_session_token(_session_token) vat
  limit 1;

  if _admin_id is null then
    raise exception 'Admin account is not authorized.';
  end if;

  _resolved_scope := case
    when _template_scope in ('document_submission', 'other') then _template_scope
    else 'document_submission'
  end;

  return query
  update public.required_document_types
  set
    name = trim(_name),
    description = coalesce(_description, ''),
    template_description = coalesce(_template_description, ''),
    template_scope = _resolved_scope,
    is_required = (_resolved_scope = 'document_submission'),
    updated_at = now()
  where required_document_types.id = _template_id
  returning
    required_document_types.id,
    required_document_types.name,
    required_document_types.description,
    required_document_types.template_url,
    required_document_types.template_description,
    required_document_types.sort_order,
    required_document_types.is_required,
    required_document_types.is_active,
    required_document_types.template_scope,
    required_document_types.updated_at;
end;
$$;

drop function if exists public.update_admin_template_file_url(text, uuid, text);
create or replace function public.update_admin_template_file_url(
  _session_token text,
  _template_id uuid,
  _template_url text
)
returns table (
  id uuid,
  name text,
  description text,
  template_url text,
  template_description text,
  sort_order integer,
  is_required boolean,
  is_active boolean,
  template_scope text,
  updated_at timestamptz
)
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

  return query
  update public.required_document_types
  set
    template_url = coalesce(_template_url, ''),
    updated_at = now()
  where required_document_types.id = _template_id
  returning
    required_document_types.id,
    required_document_types.name,
    required_document_types.description,
    required_document_types.template_url,
    required_document_types.template_description,
    required_document_types.sort_order,
    required_document_types.is_required,
    required_document_types.is_active,
    required_document_types.template_scope,
    required_document_types.updated_at;
end;
$$;
