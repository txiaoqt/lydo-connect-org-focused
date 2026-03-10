begin;

-- Optional: enables predefined frontend admin (anon key) to manage Citizen Desk tickets.
-- Use only while running frontend-only admin mode.
grant select, insert, update, delete on table public.citizen_tickets to anon;

drop policy if exists anon_manage_citizen_tickets on public.citizen_tickets;
create policy anon_manage_citizen_tickets
on public.citizen_tickets
for all to anon
using (true)
with check (true);

commit;

