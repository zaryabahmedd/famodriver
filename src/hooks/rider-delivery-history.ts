// On-device log of deliveries this rider has completed through the app.
//
// The `deliveries` table is closed to the anon key and the Node backend only
// exposes `active_delivery` / `offer_delivery` (no "list my history" action),
// so there is no remote source for past jobs yet. Until that endpoint exists,
// we keep a local, per-rider record of completions as they happen — real data
// (not fabricated), just scoped to this device.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

import { Delivery } from './rider-api';

export const DELIVERY_HISTORY_UPDATED_EVENT = 'famo.deliveryHistoryUpdated';

export type CompletedDelivery = Delivery & {
  /** When this rider marked the job delivered (device-local timestamp). */
  completed_at: string;
};

const MAX_HISTORY_ENTRIES = 200;

function historyKey(riderId: string): string {
  return `famo.deliveryHistory.${riderId}`;
}

/** Record a delivery this rider just completed. No-ops on duplicates. */
export async function appendCompletedDelivery(riderId: string, delivery: Delivery): Promise<void> {
  try {
    const existing = await getCompletedDeliveries(riderId);
    if (existing.some((d) => d.id === delivery.id)) return;
    const entry: CompletedDelivery = { ...delivery, completed_at: new Date().toISOString() };
    const next = [entry, ...existing].slice(0, MAX_HISTORY_ENTRIES);
    await AsyncStorage.setItem(historyKey(riderId), JSON.stringify(next));
    DeviceEventEmitter.emit(DELIVERY_HISTORY_UPDATED_EVENT, riderId);
  } catch {
    // ignore storage errors — history is best-effort
  }
}

export async function getCompletedDeliveries(riderId: string): Promise<CompletedDelivery[]> {
  try {
    const raw = await AsyncStorage.getItem(historyKey(riderId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CompletedDelivery[]) : [];
  } catch {
    return [];
  }
}

/** Live list of this rider's locally-recorded completed deliveries, newest first. */
export function useCompletedDeliveries(riderId: string | null): CompletedDelivery[] {
  const [deliveries, setDeliveries] = useState<CompletedDelivery[]>([]);

  const reload = useCallback(async () => {
    if (!riderId) {
      setDeliveries([]);
      return;
    }
    setDeliveries(await getCompletedDeliveries(riderId));
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
