// This rider's completed-delivery history — the source for the earnings view.
//
// Live data comes from the backend `rider-deliveries` `history` action, which
// reads the `deliveries` table directly (status = 'delivered'), so the rider and
// the admin dashboard see the same numbers and history survives reinstalls /
// new devices. A per-rider AsyncStorage copy is kept only as an offline cache
// and an optimistic entry for the just-completed job (which may briefly lag the
// backend read) — it is never the source of truth when the network is reachable.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

import { callBackend } from './backend-client';
import { Delivery } from './rider-api';
import { getRiderToken } from './rider-session';

export const DELIVERY_HISTORY_UPDATED_EVENT = 'famo.deliveryHistoryUpdated';

/**
 * A delivery this rider has completed. The full delivery payload (so the Jobs
 * "Completed" tab can show order detail) plus the persisted commission split and
 * a completion timestamp.
 */
export type CompletedDelivery = Delivery & {
  /** Authoritative net after commission, written by the backend at delivery. */
  net_amount: number | null;
  /** Commission fraction applied when net_amount was computed (e.g. 0.10). */
  commission_rate: number | null;
  /** Completion time: backend `updated_at` (delivered), or device-local for cached entries. */
  completed_at: string;
};

/** Raw history row from the backend (delivery payload + net columns + updated_at). */
type HistoryRow = Delivery & {
  net_amount: number | null;
  commission_rate: number | null;
  updated_at: string | null;
};

const MAX_HISTORY_ENTRIES = 200;

function historyKey(riderId: string): string {
  return `famo.deliveryHistory.${riderId}`;
}

/** Build a cache entry from a delivery the rider just completed locally. */
function toCompleted(delivery: Delivery, completedAt: string): CompletedDelivery {
  return {
    ...delivery,
    // Local optimistic entries have no stored net; consumers fall back to
    // computing it until the authoritative backend row arrives.
    net_amount: null,
    commission_rate: null,
    completed_at: completedAt,
  };
}

/** Map a backend history row to a CompletedDelivery (updated_at is the completion time). */
function fromHistoryRow(row: HistoryRow): CompletedDelivery {
  const { updated_at, ...delivery } = row;
  return {
    ...delivery,
    net_amount: row.net_amount ?? null,
    commission_rate: row.commission_rate ?? null,
    completed_at: updated_at ?? row.created_at,
  };
}

/**
 * Record a delivery this rider just completed into the offline cache. The
 * backend already owns the durable record (the delivered transition); this is
 * an optimistic entry so earnings update instantly even if the history read
 * briefly lags or the device is offline. No-ops on duplicates.
 */
export async function appendCompletedDelivery(riderId: string, delivery: Delivery): Promise<void> {
  try {
    const existing = await getCachedCompletedDeliveries(riderId);
    if (existing.some((d) => d.id === delivery.id)) return;
    const entry = toCompleted(delivery, new Date().toISOString());
    const next = [entry, ...existing].slice(0, MAX_HISTORY_ENTRIES);
    await AsyncStorage.setItem(historyKey(riderId), JSON.stringify(next));
    DeviceEventEmitter.emit(DELIVERY_HISTORY_UPDATED_EVENT, riderId);
  } catch {
    // ignore storage errors — the cache is best-effort
  }
}

/** Read the offline cache only (no network). */
export async function getCachedCompletedDeliveries(riderId: string): Promise<CompletedDelivery[]> {
  try {
    const raw = await AsyncStorage.getItem(historyKey(riderId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CompletedDelivery[]) : [];
  } catch {
    return [];
  }
}

/** Fetch this rider's completed deliveries live from the backend. */
async function fetchCompletedDeliveries(): Promise<CompletedDelivery[] | null> {
  const token = await getRiderToken();
  if (!token) return null;
  const { data, error } = await callBackend<{ ok: boolean; deliveries: HistoryRow[] }>(
    'rider-deliveries',
    { action: 'history' },
    { token },
  );
  if (error || !data?.ok) {
    console.warn('[rider-delivery-history] fetch failed', error?.message ?? data);
    return null;
  }
  return Array.isArray(data.deliveries) ? data.deliveries.map(fromHistoryRow) : [];
}

/** Merge the live list with any cached entries the backend hasn't returned yet
 *  (e.g. a job completed seconds ago). Backend rows win on id; cache fills gaps. */
function mergeHistory(remote: CompletedDelivery[], cached: CompletedDelivery[]): CompletedDelivery[] {
  const seen = new Set(remote.map((d) => d.id));
  const extras = cached.filter((d) => !seen.has(d.id));
  return [...remote, ...extras].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
  );
}

/**
 * Live list of this rider's completed deliveries, newest first. Reads from the
 * backend (the source of truth) and falls back to the offline cache when the
 * network is unreachable. Successful fetches refresh the cache write-through.
 */
export function useCompletedDeliveries(riderId: string | null): CompletedDelivery[] {
  const [deliveries, setDeliveries] = useState<CompletedDelivery[]>([]);

  const reload = useCallback(async () => {
    if (!riderId) {
      setDeliveries([]);
      return;
    }
    const cached = await getCachedCompletedDeliveries(riderId);
    const remote = await fetchCompletedDeliveries();
    if (remote) {
      const merged = mergeHistory(remote, cached);
      setDeliveries(merged);
      // Write-through so the next offline launch shows the latest known history.
      void AsyncStorage.setItem(historyKey(riderId), JSON.stringify(merged.slice(0, MAX_HISTORY_ENTRIES)));
    } else {
      // Offline / backend error — show what we last cached.
      setDeliveries(cached);
    }
  }, [riderId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(DELIVERY_HISTORY_UPDATED_EVENT, () => {
      void reload();
    });
    return () => sub.remove();
  }, [reload]);

  return deliveries;
}
