begin;

-- Add support for custom document type label when document_type = 'other'.
alter table public.disclosure_documents
  add column if not exists document_type_other text;

update public.disclosure_documents
set document_type_other = coalesce(nullif(btrim(document_type_other), ''), 'Other')
where document_type = 'other'
  and (document_type_other is null or btrim(document_type_other) = '');

alter table public.disclosure_documents
  drop constraint if exists disclosure_documents_other_type_check;

alter table public.disclosure_documents
  add constraint disclosure_documents_other_type_check
  check (
    document_type <> 'other'
    or (document_type_other is not null and btrim(document_type_other) <> '')
  );

-- Storage bucket for transparency file uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'transparency-documents',
  'transparency-documents',
  true,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant usage on schema storage to anon;
grant select, insert, update, delete on table storage.objects to anon;

drop policy if exists anon_storage_read_transparency_documents on storage.objects;
create policy anon_storage_read_transparency_documents
on storage.objects
for select to anon
using (bucket_id = 'transparency-documents');

drop policy if exists anon_storage_insert_transparency_documents on storage.objects;
create policy anon_storage_insert_transparency_documents
on storage.objects
for insert to anon
with check (bucket_id = 'transparency-documents');

drop policy if exists anon_storage_update_transparency_documents on storage.objects;
create policy anon_storage_update_transparency_documents
on storage.objects
for update to anon
using (bucket_id = 'transparency-documents')
with check (bucket_id = 'transparency-documents');

drop policy if exists anon_storage_delete_transparency_documents on storage.objects;
create policy anon_storage_delete_transparency_documents
on storage.objects
for delete to anon
using (bucket_id = 'transparency-documents');

-- Allow current frontend predefined admin (anon key) to manage users in admin portal.
grant select, insert, update, delete on table public.user_profiles to anon;
drop policy if exists anon_manage_user_profiles on public.user_profiles;
create policy anon_manage_user_profiles
on public.user_profiles
for all to anon
using (true)
with check (true);

grant select, insert, update, delete on table public.user_roles to anon;
drop policy if exists anon_manage_user_roles on public.user_roles;
create policy anon_manage_user_roles
on public.user_roles
for all to anon
using (true)
with check (true);

commit;

