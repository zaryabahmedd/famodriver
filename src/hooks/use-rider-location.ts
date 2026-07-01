import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { callBackend } from './backend-client';
import { getRiderToken } from './rider-session';
import { supabase } from './supabase-client';

const WRITE_INTERVAL_MS = 10_000;

// Guaranteed location ping cadence while online. watchPositionAsync only fires
// on movement (distanceInterval), so a stationary rider — parked and waiting for
// offers, which is exactly when they need to be dispatchable — would otherwise
// stop refreshing rider_locations.updated_at and silently drop out of dispatch
// (the backend only offers to riders whose location is recent). This heartbeat
// re-sends the last known fix on a fixed schedule so updated_at always stays
// fresh regardless of whether the device is moving.
const HEARTBEAT_INTERVAL_MS = 25_000;

/**
 * Dev-only location override. Set EXPO_PUBLIC_MOCK_RIDER_LOCATION="lat,lng"
 * (e.g. "6.5244,3.3792" for Lagos) so a tester whose real GPS is far from the
 * test pickup reports a fixed coordinate instead — the backend's distance-based
 * dispatch can then match them. Hard-gated on __DEV__ so it can never take
 * effect in a production build even if the env var leaks in. Returns null
 * (real GPS) in production, when unset, or when malformed.
 */
function parseMockRiderLocation(): { lat: number; lng: number } | null {
  if (!__DEV__) return null;
  const raw = process.env.EXPO_PUBLIC_MOCK_RIDER_LOCATION;
  if (!raw) return null;
  const [latStr, lngStr] = raw.split(',').map((s) => s.trim());
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.warn('[use-rider-location] ignoring invalid EXPO_PUBLIC_MOCK_RIDER_LOCATION', { raw });
    return null;
  }
  console.warn('[use-rider-location] DEV mock location active — reporting fixed coords, not real GPS', { lat, lng });
  return { lat, lng };
}

const MOCK_RIDER_LOCATION = parseMockRiderLocation();

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

      // Report the dev mock coordinate when set (see MOCK_RIDER_LOCATION); falls
      // back to the real GPS fix otherwise. Applied here so it covers every
      // write path — heartbeat, movement watcher, go-online — plus the live
      // tracking broadcast below, so a mocked rider also appears near the pickup
      // to the customer during an accepted job.
      const writeLat = MOCK_RIDER_LOCATION?.lat ?? lat;
      const writeLng = MOCK_RIDER_LOCATION?.lng ?? lng;

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
        lat: writeLat,
        lng: writeLng,
        mocked: MOCK_RIDER_LOCATION != null,
      });
      const { error: fnErr } = await callBackend(
        'rider-location',
        { lat: writeLat, lng: writeLng, is_available: available },
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
          payload: { rider_id: id, delivery_id: activeId, lat: writeLat, lng: writeLng, at: now },
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

  // Heartbeat: while online, re-send the last known fix on a fixed schedule so
  // rider_locations.updated_at stays fresh even when the rider is stationary and
  // the movement-driven watcher isn't firing. Without this, a parked rider goes
  // stale within minutes and the backend stops offering them deliveries.
  useEffect(() => {
    if (!online) return;
    const id = setInterval(() => {
      const last = lastCoords.current;
      if (last) void writeLocation(last.lat, last.lng, { force: true });
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [online, writeLocation]);

  // JS timers are suspended while the app is backgrounded, so the heartbeat
  // pauses and the rider can age out of dispatch. When the app returns to the
  // foreground, immediately push a fresh location so the rider re-enters the
  // dispatch pool right away instead of waiting for the next heartbeat tick.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !online) return;
      const last = lastCoords.current;
      if (last) void writeLocation(last.lat, last.lng, { force: true });
    });
    return () => sub.remove();
  }, [online, writeLocation]);

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
