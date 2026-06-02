begin;

-- Optional: enables predefined frontend admin (anon key) to manage Youth Desk tickets.
-- Use only while running frontend-only admin mode.
grant select, insert, update, delete on table public.youth_tickets to anon;

drop policy if exists anon_manage_youth_tickets on public.youth_tickets;
create policy anon_manage_youth_tickets
on public.youth_tickets
for all to anon
using (true)
with check (true);

commit;


