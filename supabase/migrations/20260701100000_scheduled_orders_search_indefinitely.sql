-- Option 2: a scheduled order must never be abandoned just because no rider
-- happened to be online at its exact scheduled minute.
--
-- Previously expire_and_advance_offers() flipped ANY searching delivery with no
-- live offer to 'no_riders' 120s after it entered the pool. For a scheduled
-- order that meant: if no approved rider was online (available + a location
-- fresh within 3 minutes) during the ~2 minutes right after scheduled_at, the
-- order died permanently -- even if a rider came online moments later. That is
-- the root cause of "sometimes the rider receives the scheduled request,
-- sometimes not".
--
-- New behavior: a delivery that originated as a scheduled order
-- (scheduled_at is not null) keeps searching indefinitely. Every cron tick it
-- re-runs dispatch_next_offer, so the moment an approved rider comes online
-- within range, an offer is placed for them. The order only leaves 'searching'
-- when a rider accepts or the user cancels.
--
-- Immediate orders (scheduled_at is null) are unchanged: they still give up
-- after 120s with 'no_riders' so the customer gets prompt feedback.

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

  -- For deliveries still searching with no live pending offers, advance them.
  for r in
    select d.id, d.updated_at, d.scheduled_at
    from public.deliveries d
    where d.status = 'searching'
      and not exists (
        select 1 from public.delivery_offers o
        where o.delivery_id = d.id and o.status = 'pending'
      )
  loop
    if r.scheduled_at is null and now() >= r.updated_at + interval '120 seconds' then
      -- Immediate order that found no rider within its 120s window -> give up.
      update public.deliveries
        set status = 'no_riders', updated_at = now()
      where id = r.id and status = 'searching';
    else
      -- Scheduled order (never give up) or an immediate order still inside its
      -- 120s window: try to place the next offer. When no rider is currently
      -- eligible this is a no-op and we simply retry on the next tick.
      perform public.dispatch_next_offer(r.id, 60);
    end if;
  end loop;
end;
$function$;
