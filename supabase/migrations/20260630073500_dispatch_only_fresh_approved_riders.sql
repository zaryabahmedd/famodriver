-- Fix: offers were being dispatched to "ghost" riders — riders whose
-- rider_locations.is_available was still true from days/weeks ago because they
-- closed the app without tapping Offline. Being geographically closer, those
-- stale rows grabbed the limited dispatch slots and starved riders who are
-- actually online right now. We also never filtered on rider approval status,
-- so rejected/pending riders could receive offers.
--
-- The app rewrites rider_locations every ~10s while online (WRITE_INTERVAL_MS),
-- so a 3-minute freshness window keeps every genuinely-online rider eligible
-- while excluding anyone who hasn't reported a location recently.

create or replace function public.dispatch_next_offer(
  p_delivery_id uuid,
  p_timeout_seconds integer default 120
)
returns integer
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_pickup_lat double precision;
  v_pickup_lng double precision;
  v_status text;
  v_inserted integer := 0;
  v_max_radius_meters constant double precision := 20000;
  v_freshness constant interval := interval '3 minutes';
begin
  select status, pickup_lat, pickup_lng
    into v_status, v_pickup_lat, v_pickup_lng
  from public.deliveries
  where id = p_delivery_id
  for update;

  if not found or v_status <> 'searching' then
    return 0;
  end if;

  if exists (
    select 1 from public.delivery_offers
    where delivery_id = p_delivery_id and status = 'pending'
  ) then
    return 0;
  end if;

  with eligible as (
    select rl.rider_id,
           extensions.st_distance(
             extensions.st_setsrid(extensions.st_makepoint(rl.lng, rl.lat), 4326)::extensions.geography,
             extensions.st_setsrid(extensions.st_makepoint(v_pickup_lng, v_pickup_lat), 4326)::extensions.geography
           ) as dist
    from public.rider_locations rl
    join public.riders r on r.id = rl.rider_id
    where rl.is_available = true
      and rl.updated_at > now() - v_freshness
      and r.status = 'approved'
      and not exists (
        select 1 from public.delivery_offers o2
        where o2.rider_id = rl.rider_id and o2.status = 'pending'
      )
      and not exists (
        select 1 from public.delivery_offers o3
        where o3.delivery_id = p_delivery_id
          and o3.rider_id = rl.rider_id
          and o3.status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')
      )
    order by dist asc
    limit 4
  )
  insert into public.delivery_offers (delivery_id, rider_id, distance_meters, status, expires_at)
  select p_delivery_id, rider_id, dist, 'pending', now() + make_interval(secs => p_timeout_seconds)
  from eligible
  where dist <= v_max_radius_meters;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$function$;

create or replace function public.nearest_available_riders(
  p_lat double precision,
  p_lng double precision,
  p_limit integer default 5
)
returns table(rider_id uuid, lat double precision, lng double precision, distance_meters double precision)
language sql
stable security definer
set search_path to 'public', 'extensions'
as $function$
  select
    rl.rider_id,
    rl.lat,
    rl.lng,
    extensions.st_distance(
      extensions.st_setsrid(extensions.st_makepoint(rl.lng, rl.lat), 4326)::extensions.geography,
      extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
    ) as distance_meters
  from public.rider_locations rl
  join public.riders r on r.id = rl.rider_id
  where rl.is_available = true
    and rl.updated_at > now() - interval '3 minutes'
    and r.status = 'approved'
  order by distance_meters asc
  limit p_limit;
$function$;
