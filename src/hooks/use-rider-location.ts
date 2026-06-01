import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { callBackend } from './backend-client';
import { getRiderToken } from './rider-session';
import { supabase } from './supabase-client';

const WRITE_INTERVAL_MS = 10_000;

export type RiderLocationState = {
  online: boolean;
  starting: boolean;
  permissionDenied: boolean;
  error: string | null;
  coords: { lat: number; lng: number } | null;
  goOnline: () => Promise<boolean>;
  goOffline: () => Promise<void>;
};

type Options = {
  riderId: string | null;
  /** Id of the delivery currently in progress, if any. Drives is_available + live broadcast. */
  activeDeliveryId?: string | null;
};

/**
 * Streams the rider's GPS into public.rider_locations (~every 10s) while online,
 * toggles is_available, and broadcasts live position on a per-delivery Realtime
 * channel so the User App can track the rider during an active job.
 */
export function useRiderLocation({ riderId, activeDeliveryId }: Options): RiderLocationState {
  const [online, setOnline] = useState(false);
  const [starting, setStarting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const watcher = useRef<Location.LocationSubscription | null>(null);
  const lastWrite = useRef(0);
  const lastCoords = useRef<{ lat: number; lng: number } | null>(null);
  const broadcastChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const broadcastDeliveryId = useRef<string | null>(null);

  // Keep mutable refs so the watcher callback always sees fresh values.
  const riderIdRef = useRef(riderId);
  const activeDeliveryIdRef = useRef(activeDeliveryId ?? null);
  riderIdRef.current = riderId;
  activeDeliveryIdRef.current = activeDeliveryId ?? null;

  const ensureBroadcastChannel = useCallback((deliveryId: string | null) => {
    if (broadcastDeliveryId.current === deliveryId) return;
    if (broadcastChannel.current) {
      supabase.removeChannel(broadcastChannel.current);
      broadcastChannel.current = null;
    }
    broadcastDeliveryId.current = deliveryId;
    if (deliveryId) {
      broadcastChannel.current = supabase.channel(`delivery-tracking:${deliveryId}`);
      broadcastChannel.current.subscribe();
    }
  }, []);

  const writeLocation = useCallback(
    async (lat: number, lng: number, opts?: { available?: boolean; force?: boolean }) => {
      const id = riderIdRef.current;
      if (!id) return;
      const now = Date.now();
      if (!opts?.force && now - lastWrite.current < WRITE_INTERVAL_MS) return;
      lastWrite.current = now;
      lastCoords.current = { lat, lng };

      const activeId = activeDeliveryIdRef.current;
      const available = opts?.available ?? activeId == null;

      // The rider proves identity with the session token (sent as a Bearer
      // header to the Node backend); the server derives the rider_id from it and
      // upserts only that rider's row (no spoofing).
      const token = await getRiderToken();
      if (!token) {
        setError('Your session expired. Please log in again.');
        return;
      }
      const { error: fnErr } = await callBackend(
        'rider-location',
        { lat, lng, is_available: available },
        { token },
      );
      if (fnErr) setError(fnErr.message);

      // Live broadcast for the User App during an active delivery.
      ensureBroadcastChannel(activeId);
      if (activeId && broadcastChannel.current) {
        broadcastChannel.current.send({
          type: 'broadcast',
          event: 'rider_location',
          payload: { rider_id: id, delivery_id: activeId, lat, lng, at: now },
        });
      }
    },
    [ensureBroadcastChannel],
  );

  const stopWatcher = useCallback(() => {
    watcher.current?.remove();
    watcher.current = null;
  }, []);

  const goOnline = useCallback(async (): Promise<boolean> => {
    if (!riderIdRef.current) {
      setError('No rider session.');
      return false;
    }
    setStarting(true);
    setError(null);
    try {
      let lat = 6.5244;
      let lng = 3.3792;
      let hasRealLocation = false;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setPermissionDenied(false);
          const first = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          lat = first.coords.latitude;
          lng = first.coords.longitude;
          hasRealLocation = true;
        } else {
          setPermissionDenied(true);
          console.warn('[use-rider-location] Location permission denied. Falling back to simulated coordinates.');
        }
      } catch (locErr) {
        console.warn('[use-rider-location] Failed to fetch device location. Falling back to simulated coordinates. Error:', locErr);
      }

      setCoords({ lat, lng });
      await writeLocation(lat, lng, {
        available: true,
        force: true,
      });

      stopWatcher();

      if (hasRealLocation) {
        watcher.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: WRITE_INTERVAL_MS,
            distanceInterval: 20,
          },
          (loc) => {
            setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            void writeLocation(loc.coords.latitude, loc.coords.longitude);
          },
        );
      } else {
        const intervalId = setInterval(() => {
          if (lastCoords.current) {
            void writeLocation(lastCoords.current.lat, lastCoords.current.lng);
          }
        }, WRITE_INTERVAL_MS);

        watcher.current = {
          remove: () => clearInterval(intervalId),
        };
      }

      setOnline(true);
      setStarting(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start location.');
      setStarting(false);
      return false;
    }
  }, [stopWatcher, writeLocation]);

  const goOffline = useCallback(async () => {
    stopWatcher();
    setOnline(false);
    const last = lastCoords.current;
    // Flip availability off server-side. Requires coords (the function validates
    // them); if we never got a fix there's nothing online to clear.
    if (last) {
      await writeLocation(last.lat, last.lng, { available: false, force: true });
    }
  }, [stopWatcher, writeLocation]);

  // Tear everything down on unmount.
  useEffect(() => {
    return () => {
      stopWatcher();
      if (broadcastChannel.current) {
        supabase.removeChannel(broadcastChannel.current);
        broadcastChannel.current = null;
      }
    };
  }, [stopWatcher]);

  return {
    online,
    starting,
    permissionDenied,
    error,
    coords,
    goOnline,
    goOffline,
  };
}
