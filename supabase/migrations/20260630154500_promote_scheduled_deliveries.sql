-- Fix: scheduled deliveries never got dispatched. on_delivery_created only
-- calls dispatch_next_offer when status = 'searching' at INSERT time, and
-- expire_and_advance_offers() (the every-10s pg_cron job that drives all
-- dispatch/retry/timeout logic) only ever looked at status = 'searching' rows.
-- Nothing in the system ever flipped a 'scheduled' delivery to 'searching'
-- once its scheduled_at arrived, so it sat untouched forever and no rider was
-- ever offered it. Confirmed live: a delivery scheduled for 2026-06-27 16:23
-- was still status='scheduled' as of this migration, almost 3 days later.
--
-- Fix: promote due 'scheduled' rows to 'searching' at the top of the existing
-- poll, then let the rest of the function dispatch them exactly like an
-- immediate order.
--
-- The 120s "give up -> no_riders" window was keyed off created_at, which for a
-- scheduled order can be hours/days in the past. Promoting straight to
-- 'searching' would then immediately blow that window on the very next loop
-- iteration (same function call), giving the promoted order zero dispatch
-- attempts. Both created_at and updated_at default to now() on insert, so for
-- immediate orders updated_at == created_at; switching the window to
-- updated_at keeps immediate-order behavior identical while giving a promoted
-- scheduled order a fresh 120s window starting from its promotion.

create or replace function public.expire_and_advance_offers()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  r record;
begin
  -- Promote scheduled orders whose pickup time has arrived into the live
  -- dispatch pool.
  update public.deliveries
    set status = 'searching', updated_at = now()
  where status = 'scheduled'
    and scheduled_at is not null
    and scheduled_at <= now();

  -- Time-based expiry.
  update public.delivery_offers
    set status = 'expired', responded_at = now()
  where status = 'pending' and expires_at <= now();

  -- State-based expiry: offers whose delivery left the searching pool.
  update public.delivery_offers o
    set status = 'expired', responded_at = now()
  from public.deliveries d
  where o.delivery_id = d.id
    and o.status = 'pending'
    and d.status <> 'searching';

  -- For deliveries still searching with no live pending offers:
  -- if 120s since entering the pool has elapsed → no_riders; otherwise →
  -- next batch.
  for r in
    select d.id, d.updated_at
    from public.deliveries d
    where d.status = 'searching'
      and not exists (
        select 1 from public.delivery_offers o
        where o.delivery_id = d.id and o.status = 'pending'
      )
  loop
    if now() >= r.updated_at + interval '120 seconds' then
      update public.deliveries
        set status = 'no_riders', updated_at = now()
      where id = r.id and status = 'searching';
    else
      perform public.dispatch_next_offer(r.id, 60);
    end if;
  end loop;
end;
$function$;
