begin;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='app_role_code' and n.nspname='public') then
    create type public.app_role_code as enum ('admin','staff','sk','youth');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='program_status' and n.nspname='public') then
    create type public.program_status as enum (
      'draft',
      'published',
      'upcoming',
      'ongoing',
      'completed',
      'pending',
      'past',
      'postponed',
      'cancelled',
      'archived'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='event_status' and n.nspname='public') then
    create type public.event_status as enum (
      'draft',
      'published',
      'upcoming',
      'ongoing',
      'completed',
      'pending',
      'past',
      'postponed',
      'cancelled',
      'archived'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='organization_status' and n.nspname='public') then
    create type public.organization_status as enum ('active','partner','pending','inactive','archived');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='registration_status' and n.nspname='public') then
    create type public.registration_status as enum ('registered','waitlisted','attended','no_show','cancelled');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='quarter_code' and n.nspname='public') then
    create type public.quarter_code as enum ('Q1','Q2','Q3','Q4');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='disclosure_doc_type' and n.nspname='public') then
    create type public.disclosure_doc_type as enum ('ordinance','resolution','executive_order','bac_document','financial_statement','program_outcome','other');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='doc_state' and n.nspname='public') then
    create type public.doc_state as enum ('ok','partial','issue');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='submission_state' and n.nspname='public') then
    create type public.submission_state as enum ('submitted','late','missing');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='ticket_status' and n.nspname='public') then
    create type public.ticket_status as enum ('received','in_progress','resolved','closed');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typname='barangay_compliance_status' and n.nspname='public') then
    create type public.barangay_compliance_status as enum ('compliant','pending','overdue');
  end if;
end $$;

commit;
