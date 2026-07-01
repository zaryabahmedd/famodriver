-- Make offers reach riders faster.
--
-- All scheduled-order promotion and offer dispatch is driven by the pg_cron job
-- that calls expire_and_advance_offers(). It ran every 10 seconds, so a rider
-- could wait up to ~10s after their scheduled time (or after coming online)
-- before an offer was even created. The rider app itself surfaces offers over a
-- realtime websocket within ~1s of the row being inserted, so the cron interval
-- was the dominant latency.
--
-- Halve it to 5 seconds. Each run is a few milliseconds and never overlaps, so
-- this is safe at current volume; revisit if many unfilled orders accumulate.

select cron.alter_job(job_id := 1, schedule := '5 seconds');
