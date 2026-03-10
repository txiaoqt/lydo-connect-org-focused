begin;

alter table public.programs
  add column if not exists location_latitude numeric(9,6),
  add column if not exists location_longitude numeric(9,6);

alter table public.events
  add column if not exists location_latitude numeric(9,6),
  add column if not exists location_longitude numeric(9,6);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'programs_location_latitude_range'
  ) then
    alter table public.programs
      add constraint programs_location_latitude_range
      check (location_latitude is null or (location_latitude between -90 and 90));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'programs_location_longitude_range'
  ) then
    alter table public.programs
      add constraint programs_location_longitude_range
      check (location_longitude is null or (location_longitude between -180 and 180));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_location_latitude_range'
  ) then
    alter table public.events
      add constraint events_location_latitude_range
      check (location_latitude is null or (location_latitude between -90 and 90));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_location_longitude_range'
  ) then
    alter table public.events
      add constraint events_location_longitude_range
      check (location_longitude is null or (location_longitude between -180 and 180));
  end if;
end $$;

create index if not exists idx_programs_location_coords
  on public.programs (location_latitude, location_longitude);

create index if not exists idx_events_location_coords
  on public.events (location_latitude, location_longitude);

commit;
