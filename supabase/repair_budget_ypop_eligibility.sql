-- Run once on an existing database to prevent budget creation without a
-- qualified YPOP validation in an active period.

create or replace function public.enforce_budget_request_ypop_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.ypop_periods yp
    join public.ypop_entries ye
      on ye.semester = yp.semester_key
     and ye.organization_id = new.organization_id
    where yp.status = 'open'
      and yp.id = (
        select current_period.id
        from public.ypop_periods current_period
        where current_period.status = 'open'
        order by current_period.created_at desc
        limit 1
      )
      and ye.status = 'qualified'
  ) then
    raise exception 'A qualified YPOP validation in the active period is required before creating a budget request.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_budget_request_ypop_eligibility on public.budget_requests;
create trigger trg_budget_request_ypop_eligibility
before insert on public.budget_requests
for each row
execute function public.enforce_budget_request_ypop_eligibility();
