begin;

-- Remove legacy free-text event time field.
-- Event time display should come only from start_time/end_time.
alter table public.events
  add column if not exists start_time time,
  add column if not exists end_time time;

do $$
begin
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

alter table public.events
  drop column if exists time_text;

commit;
