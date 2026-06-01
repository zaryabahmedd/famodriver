// Rider advances an accepted delivery's status: picked_up -> delivered.
// Service-role write; ownership is enforced by matching deliveries.rider_id.
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

// Allowed forward transitions for a rider.
const NEXT: Record<string, string[]> = {
  accepted: ["picked_up", "cancelled"],
  picked_up: ["delivered"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let payload: { delivery_id?: string; rider_id?: string; status?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { delivery_id, rider_id, status } = payload;
  if (!delivery_id || !rider_id || !status) {
    return json({ error: "missing_fields" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: current, error: readErr } = await supabase
    .from("deliveries")
    .select("id, rider_id, status")
    .eq("id", delivery_id)
    .maybeSingle();

  if (readErr) return json({ error: readErr.message }, 400);
  if (!current) return json({ error: "delivery_not_found" }, 404);
  if (current.rider_id !== rider_id) return json({ error: "forbidden" }, 403);

  const allowed = NEXT[current.status] ?? [];
  if (!allowed.includes(status)) {
    return json(
      { error: "invalid_transition", from: current.status, to: status },
      409,
    );
  }

  const { data: updated, error: updErr } = await supabase
    .from("deliveries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", delivery_id)
    .eq("rider_id", rider_id)
    .eq("status", current.status)
    .select(
      "id, status, rider_id, pickup_address, dropoff_address, price, updated_at",
    )
    .maybeSingle();

  if (updErr) return json({ error: updErr.message }, 400);
  if (!updated) return json({ ok: false, reason: "stale_status" }, 200);

  // When the job ends, free the rider so dispatch can offer new jobs again.
  if (status === "delivered" || status === "cancelled") {
    await supabase
      .from("rider_locations")
      .update({ is_available: true, updated_at: new Date().toISOString() })
      .eq("rider_id", rider_id);
  }

  return json({ ok: true, delivery: updated }, 200);
});
