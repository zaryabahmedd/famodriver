// Read delivery details for a rider without exposing the deliveries table to the
// public anon key. Validates that the rider was actually offered / assigned the
// job before returning customer PII (addresses, phone).
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

const DELIVERY_SELECT =
  "id, user_id, rider_id, status, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, weight, price, created_at, users:user_id ( full_name, phone_number )";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let payload: {
    action?: string;
    rider_id?: string;
    offer_id?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { action, rider_id, offer_id } = payload;
  if (!rider_id) return json({ error: "missing_rider_id" }, 400);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  if (action === "offer_delivery") {
    if (!offer_id) return json({ error: "missing_offer_id" }, 400);
    // The offer must belong to this rider.
    const { data: offer } = await supabase
      .from("delivery_offers")
      .select("delivery_id, rider_id")
      .eq("id", offer_id)
      .maybeSingle();
    if (!offer || offer.rider_id !== rider_id) {
      return json({ error: "forbidden" }, 403);
    }
    const { data: delivery, error } = await supabase
      .from("deliveries")
      .select(DELIVERY_SELECT)
      .eq("id", offer.delivery_id)
      .maybeSingle();
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, delivery }, 200);
  }

  if (action === "active_delivery") {
    const { data: delivery, error } = await supabase
      .from("deliveries")
      .select(DELIVERY_SELECT)
      .eq("rider_id", rider_id)
      .in("status", ["accepted", "picked_up"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, delivery: delivery ?? null }, 200);
  }

  return json({ error: "unknown_action" }, 400);
});
