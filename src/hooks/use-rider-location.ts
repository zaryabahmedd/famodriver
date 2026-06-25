import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { callBackend } from './backend-client';
import { getRiderToken } from './rider-session';
import { supabase } from './supabase-client';

const WRITE_INTERVAL_MS = 10_000;

// Persists the rider's online *intent* across app restarts. Once a rider goes
// online they stay online — through backgrounding, force-quit and relaunch —
// until they explicitly tap Offline. On launch we read this flag and, if set,
// silently resume location streaming + server availability.
const ONLINE_FLAG_KEY = 'famo.online';

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
        console.warn('[use-rider-location] missing rider token while writing location', {
          rider_id: id,
        });
        return;
      }
      console.log('[use-rider-location] writing rider location', {
        rider_id: id,
        is_available: available,
        active_delivery_id: activeId,
        lat,
        lng,
      });
      const { error: fnErr } = await callBackend(
        'rider-location',
        { lat, lng, is_available: available },
        { token },
      );
      if (fnErr) {
        console.warn('[use-rider-location] rider-location write failed', {
          rider_id: id,
          is_available: available,
          error: fnErr.message,
        });
        setError(fnErr.message);
      } else {
        console.log('[use-rider-location] rider location saved', {
          rider_id: id,
          is_available: available,
        });
        setError(null);
      }

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
      // A real GPS fix is required to go online. We never broadcast a
      // placeholder location, so customers only ever see the rider's true
      // position — going online simply fails if we can't locate the device.
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setError('Location permission is required to go online.');
        setStarting(false);
        return false;
      }
      setPermissionDenied(false);

      let lat: number;
      let lng: number;
      try {
        const first = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        lat = first.coords.latitude;
        lng = first.coords.longitude;
      } catch (locErr) {
        console.warn('[use-rider-location] Could not get a GPS fix.', locErr);
        setError('Could not get your location. Make sure GPS is on and try again.');
        setStarting(false);
        return false;
      }

      setCoords({ lat, lng });
      await writeLocation(lat, lng, {
        available: true,
        force: true,
      });

      stopWatcher();
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

      setOnline(true);
      setStarting(false);
      // Remember the online intent so a relaunch resumes online automatically.
      void AsyncStorage.setItem(ONLINE_FLAG_KEY, '1');
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
    // Clear the persisted online intent — only an explicit Offline tap does this,
    // so the rider stays online across restarts until they choose to stop.
    void AsyncStorage.removeItem(ONLINE_FLAG_KEY);
    const last = lastCoords.current;
    // Flip availability off server-side. Requires coords (the function validates
    // them); if we never got a fix there's nothing online to clear.
    if (last) {
      await writeLocation(last.lat, last.lng, { available: false, force: true });
    }
  }, [stopWatcher, writeLocation]);

  // On launch (once the rider id is known), resume online automatically if the
  // rider was online when the app last closed. Runs once per mount.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (!riderId || restoredRef.current) return;
    restoredRef.current = true;
    void (async () => {
      const flag = await AsyncStorage.getItem(ONLINE_FLAG_KEY);
      if (flag === '1') {
        console.log('[use-rider-location] resuming persisted online state', { rider_id: riderId });
        await goOnline();
      }
    })();
  }, [riderId, goOnline]);

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
