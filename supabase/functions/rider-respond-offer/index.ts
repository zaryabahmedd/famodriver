// Rider accepts or declines a delivery offer.
// Riders are NOT on Supabase Auth (custom auth on public.riders), so this runs
// with the service-role key and validates ownership inside the SQL functions
// accept_offer / decline_offer (which check offer.rider_id = p_rider_id).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let payload: { action?: string; offer_id?: string; rider_id?: string; offerId?: string; riderId?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { action } = payload;
  const offer_id = payload.offer_id ?? payload.offerId;
  const rider_id = payload.rider_id ?? payload.riderId;
  if (!offer_id || !rider_id || (action !== "accept" && action !== "decline")) {
    return json({ error: "missing_or_invalid_fields" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const rpc = action === "accept" ? "accept_offer" : "decline_offer";
  const { data: ok, error } = await supabase.rpc(rpc, {
    p_offer_id: offer_id,
    p_rider_id: rider_id,
  });

  if (error) return json({ error: error.message }, 400);

  // Both SQL functions return a boolean success flag.
  if (ok !== true) {
    return json({ ok: false, reason: "offer_unavailable" }, 200);
  }

  if (action === "decline") return json({ ok: true, accepted: false }, 200);

  // On accept, return the full delivery row so the app can render the job.
  const { data: offer } = await supabase
    .from("delivery_offers")
    .select("delivery_id")
    .eq("id", offer_id)
    .maybeSingle();

  let delivery = null;
  if (offer?.delivery_id) {
    const { data } = await supabase
      .from("deliveries")
      .select(
        "id, user_id, rider_id, status, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, weight, price, created_at, payment_method, payment_screenshot_url, users:user_id ( full_name, phone_number )",
      )
      .eq("id", offer.delivery_id)
      .maybeSingle();
    delivery = data;
  }

  return json({ ok: true, accepted: true, delivery }, 200);
});
