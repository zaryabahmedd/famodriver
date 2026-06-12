// Live delivery pricing, sourced from the admin-managed `pricing_settings`
// table (single row, id = 1) instead of hardcoded constants. RLS grants public
// read access, so this fetches with the normal anon-key Supabase client.
import { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

import { supabase } from './supabase-client';

export type PricingSettings = {
  basePrice: number;
  perKmPrice: number;
};

const PRICING_UPDATED_EVENT = 'famo.pricingUpdated';

/** How long a fetched price stays valid before we refetch in the background. */
const CACHE_TTL_MS = 5 * 60 * 1000;

let cached: PricingSettings | null = null;
let cachedAt = 0;
let inFlight: Promise<void> | null = null;

async function fetchPricingSettings(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('pricing_settings')
      .select('base_price, per_km_price')
      .eq('id', 1)
      .single();
    if (!error && data) {
      cached = { basePrice: Number(data.base_price), perKmPrice: Number(data.per_km_price) };
      cachedAt = Date.now();
      DeviceEventEmitter.emit(PRICING_UPDATED_EVENT);
    }
  } catch {
    // Keep serving the last-known price (or null) on network failure.
  }
}

/** Kick off a refetch if the cached price is missing or stale. Safe to call repeatedly. */
function ensureFresh(): void {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return;
  if (inFlight) return;
  inFlight = fetchPricingSettings().finally(() => {
    inFlight = null;
  });
}

/**
 * Current delivery pricing (base price + per-km rate, in Naira), refreshed at
 * most every few minutes. Returns null until the first successful fetch — so
 * an admin's price change is picked up automatically on the next refresh.
 */
export function usePricingSettings(): PricingSettings | null {
  const [settings, setSettings] = useState<PricingSettings | null>(cached);

  useEffect(() => {
    ensureFresh();
    if (cached) setSettings(cached);
    const sub = DeviceEventEmitter.addListener(PRICING_UPDATED_EVENT, () => setSettings(cached));
    return () => sub.remove();
  }, []);

  return settings;
}
