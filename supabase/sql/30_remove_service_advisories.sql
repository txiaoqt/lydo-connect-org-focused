begin;

-- Service advisories were removed from the user/admin interface and are no
-- longer part of the LYDO Connect data model.
drop table if exists public.service_advisories cascade;
drop type if exists public.service_status;

commit;
