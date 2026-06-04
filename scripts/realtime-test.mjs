// Decisive Realtime auth test: subscribes to public.delivery_offers with two
// different keys and prints the channel status. Run:
//   node scripts/realtime-test.mjs
// A valid key prints "SUBSCRIBED"; an invalid websocket key prints
// "CHANNEL_ERROR"/"TIMED_OUT".
import { createClient } from '@supabase/supabase-js';

const URL = 'https://yoyscueorzeapqolutvp.supabase.co';
const RIDER_ID = 'bcb5441d-2ee0-4b24-afd0-6009eea3add5';

const KEYS = {
  jwt_anon:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlveXNjdWVvcnplYXBxb2x1dHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzE1MjQsImV4cCI6MjA5NTAwNzUyNH0.t5OBmTQto4435r9ilfjO3TMPyxEdDB001v0E6C63bNI',
  publishable: 'sb_publishable_KtzItQ2aEYjoLWQyr71GLg_9hiXVGa_',
};

function testKey(label, key) {
  const supabase = createClient(URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  supabase
    .channel(`all-${label}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'delivery_offers' },
      (payload) => console.log(`[${label} all] payload`, payload.eventType, payload.new?.id),
    )
    .subscribe((status, err) => console.log(`[${label} all] status`, status, err?.message ?? ''));
  supabase
    .channel(`filtered-${label}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_offers',
        filter: `rider_id=eq.${RIDER_ID}`,
      },
      (payload) => console.log(`[${label} filtered] INSERT`, payload.new?.id),
    )
    .subscribe((status, err) =>
      console.log(`[${label} filtered] status`, status, err?.message ?? ''),
    );
}

for (const [label, key] of Object.entries(KEYS)) {
  testKey(label, key);
}
console.log('Subscribed with both keys. Waiting 30s for inserts...');
setTimeout(() => process.exit(0), 30000);
