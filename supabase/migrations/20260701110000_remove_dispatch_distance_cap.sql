-- Make dispatch work worldwide: drop the hard 20 km radius cap.
--
-- dispatch_next_offer previously only offered a delivery to riders within
-- v_max_radius_meters (20 km) of the pickup point. Any rider farther than that
-- was never offered the order at all, so the service effectively only worked
-- within a 20 km bubble around each rider. This removes that cap.
--
-- We still ORDER BY distance and LIMIT 4, so the *nearest* eligible riders are
-- always preferred -- we simply no longer refuse to offer when the nearest
-- rider happens to be far away. Distance is still recorded on each offer
-- (delivery_offers.distance_meters) for display ("X km away").
--
-- NOTE: this preserves the current live behavior of dispatch_next_offer
-- (5-minute location freshness, the 'superseded' exclusion) and changes only
-- the distance filter.

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
  v_freshness constant interval := interval '5 minutes';
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
        select 1 from public.delivery_offers o3
        where o3.delivery_id = p_delivery_id
          and o3.rider_id = rl.rider_id
          and o3.status in ('pending', 'accepted', 'declined', 'cancelled', 'expired', 'superseded')
      )
    order by dist asc
    limit 4
  )
  insert into public.delivery_offers (delivery_id, rider_id, distance_meters, status, expires_at)
  select p_delivery_id, rider_id, dist, 'pending', now() + make_interval(secs => p_timeout_seconds)
  from eligible;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$function$;
