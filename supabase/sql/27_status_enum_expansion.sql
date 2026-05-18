begin;

do $$ begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'program_status' and n.nspname = 'public'
  ) then
    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = 'program_status' and e.enumlabel = 'upcoming'
    ) then
      alter type public.program_status add value 'upcoming';
    end if;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = 'program_status' and e.enumlabel = 'ongoing'
    ) then
      alter type public.program_status add value 'ongoing';
    end if;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = 'program_status' and e.enumlabel = 'past'
    ) then
      alter type public.program_status add value 'past';
    end if;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = 'program_status' and e.enumlabel = 'postponed'
    ) then
      alter type public.program_status add value 'postponed';
    end if;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = 'program_status' and e.enumlabel = 'cancelled'
    ) then
      alter type public.program_status add value 'cancelled';
    end if;
  end if;
end $$;

do $$ begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'event_status' and n.nspname = 'public'
  ) then
    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = 'event_status' and e.enumlabel = 'published'
    ) then
      alter type public.event_status add value 'published';
    end if;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = 'event_status' and e.enumlabel = 'ongoing'
    ) then
      alter type public.event_status add value 'ongoing';
    end if;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = 'event_status' and e.enumlabel = 'archived'
    ) then
      alter type public.event_status add value 'archived';
    end if;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = 'event_status' and e.enumlabel = 'postponed'
    ) then
      alter type public.event_status add value 'postponed';
    end if;
  end if;
end $$;

do $$ begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'organization_status' and n.nspname = 'public'
  ) then
    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typname = 'organization_status' and e.enumlabel = 'pending'
    ) then
      alter type public.organization_status add value 'pending';
    end if;
  end if;
end $$;

commit;
