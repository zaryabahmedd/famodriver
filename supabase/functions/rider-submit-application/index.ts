// Marks a rider's onboarding application as submitted by updating their status
// from 'pending_verification' to 'pending_approval'. Validates the rider's
// session token (SHA-256 hashed in rider_sessions) without the Node backend.
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

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const rawToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!rawToken) return json({ error: "missing_token" }, 401);

  const tokenHash = await sha256Hex(rawToken);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: session } = await supabase
    .from("rider_sessions")
    .select("rider_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!session) return json({ error: "invalid_token" }, 401);
  if (new Date(session.expires_at) < new Date()) {
    return json({ error: "session_expired" }, 401);
  }

  const { error: updateErr } = await supabase
    .from("riders")
    .update({ status: "pending_approval" })
    .eq("id", session.rider_id);

  if (updateErr) return json({ error: updateErr.message }, 500);

  return json({ ok: true });
});
