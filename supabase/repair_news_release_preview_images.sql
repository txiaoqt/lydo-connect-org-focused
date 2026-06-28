-- ============================================================================
-- News Release Preview Image Support
-- ============================================================================

alter table if exists public.news_releases
  add column if not exists preview_image_url text not null default '';

insert into storage.buckets (id, name, public)
values ('news-release-images', 'news-release-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists news_release_images_admin_manage on storage.objects;
create policy news_release_images_admin_manage on storage.objects
for all using (bucket_id = 'news-release-images')
with check (bucket_id = 'news-release-images');

drop function if exists public.create_admin_news_release(text, text, text, text, date, public.visibility_status);
create or replace function public.create_admin_news_release(
  _session_token text,
  _title text,
  _description text,
  _facebook_post_url text,
  _preview_image_url text,
  _date_posted date,
  _visibility_status public.visibility_status
)
returns table (
  id uuid,
  title text,
  description text,
  facebook_post_url text,
  preview_image_url text,
  date_posted date,
  visibility_status public.visibility_status,
  created_by uuid,
  created_at timestamptz,
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
  insert into public.news_releases (
    title,
    description,
    facebook_post_url,
    preview_image_url,
    date_posted,
    visibility_status,
    created_by
  )
  values (
    trim(_title),
    coalesce(_description, ''),
    trim(_facebook_post_url),
    coalesce(trim(_preview_image_url), ''),
    _date_posted,
    coalesce(_visibility_status, 'draft'::public.visibility_status),
    null
  )
  returning
    news_releases.id,
    news_releases.title,
    news_releases.description,
    news_releases.facebook_post_url,
    news_releases.preview_image_url,
    news_releases.date_posted,
    news_releases.visibility_status,
    news_releases.created_by,
    news_releases.created_at,
    news_releases.updated_at;
end;
$$;

drop function if exists public.update_admin_news_release(text, uuid, text, text, text, date, public.visibility_status);
create or replace function public.update_admin_news_release(
  _session_token text,
  _news_release_id uuid,
  _title text,
  _description text,
  _facebook_post_url text,
  _preview_image_url text,
  _date_posted date,
  _visibility_status public.visibility_status
)
returns table (
  id uuid,
  title text,
  description text,
  facebook_post_url text,
  preview_image_url text,
  date_posted date,
  visibility_status public.visibility_status,
  created_by uuid,
  created_at timestamptz,
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
  update public.news_releases
  set
    title = coalesce(trim(_title), news_releases.title),
    description = coalesce(_description, news_releases.description),
    facebook_post_url = coalesce(trim(_facebook_post_url), news_releases.facebook_post_url),
    preview_image_url = coalesce(trim(_preview_image_url), news_releases.preview_image_url),
    date_posted = coalesce(_date_posted, news_releases.date_posted),
    visibility_status = coalesce(_visibility_status, news_releases.visibility_status),
    updated_at = now()
  where news_releases.id = _news_release_id
  returning
    news_releases.id,
    news_releases.title,
    news_releases.description,
    news_releases.facebook_post_url,
    news_releases.preview_image_url,
    news_releases.date_posted,
    news_releases.visibility_status,
    news_releases.created_by,
    news_releases.created_at,
    news_releases.updated_at;
end;
$$;
