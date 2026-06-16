import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { fetchActiveDeliveriesCount } from './rider-api';

const POLL_MS = 10000;

export type ActiveOrders = {
  /** Number of orders currently assigned to the rider (accepted or picked_up). */
  count: number;
  /** Force an immediate refetch (e.g. right after accepting/completing a job). */
  refresh: () => void;
};

/**
 * Live count of the orders currently assigned to this rider. The deliveries
 * table isn't exposed to the realtime/anon client, so the count is kept live by
 * polling the backend on an interval, plus refetching on screen focus and when
 * the app returns to the foreground.
 */
export function useActiveOrders(riderId: string | null): ActiveOrders {
  const [count, setCount] = useState(0);
  const riderIdRef = useRef(riderId);
  riderIdRef.current = riderId;

  const refresh = useCallback(() => {
    if (!riderIdRef.current) {
      setCount(0);
      return;
    }
    void (async () => {
      const next = await fetchActiveDeliveriesCount();
      // Drop a stale response if the rider changed (logout/switch) meanwhile.
      if (riderIdRef.current) setCount(next);
    })();
  }, []);

  // Initial load + whenever the rider id resolves or changes.
  useEffect(() => {
    if (!riderId) {
      setCount(0);
      return;
    }
    refresh();
  }, [riderId, refresh]);

  // Poll so the count stays live as jobs are assigned or finished elsewhere.
  useEffect(() => {
    if (!riderId) return;
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [riderId, refresh]);

  // Realtime/timers are throttled in the background — refetch on resume.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // Refetch when the hosting screen regains focus.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { count, refresh };
}
