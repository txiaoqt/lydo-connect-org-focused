begin;

-- Supports exact start/end time selection in admin and user-facing time ranges.
alter table public.programs
  add column if not exists start_time time,
  add column if not exists end_time time;

alter table public.events
  add column if not exists start_time time,
  add column if not exists end_time time;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'programs_time_order'
  ) then
    alter table public.programs
      add constraint programs_time_order
      check (start_time is null or end_time is null or end_time >= start_time);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_time_order'
  ) then
    alter table public.events
      add constraint events_time_order
      check (start_time is null or end_time is null or end_time >= start_time);
  end if;
end $$;

create index if not exists idx_programs_time_range
  on public.programs (start_time, end_time);

create index if not exists idx_events_time_range
  on public.events (start_time, end_time);

commit;
