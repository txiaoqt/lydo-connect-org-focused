-- Run once on an existing database so authenticated organization accounts can
-- load only their own activity history in the website and installed PWA.

alter table public.activity_logs enable row level security;

drop policy if exists activity_logs_organization_read on public.activity_logs;
create policy activity_logs_organization_read on public.activity_logs
for select
using (
  exists (
    select 1
    from public.organization_profiles op
    where op.id = activity_logs.organization_id
      and op.user_id = auth.uid()
  )
);

grant select on public.activity_logs to authenticated;
