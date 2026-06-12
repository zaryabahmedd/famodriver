import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { getRiderToken } from './rider-session';
import { supabase } from './supabase-client';

const PUSH_TOKEN_KEY = 'famo.pushToken';
const OFFER_CHANNEL_ID = 'delivery-offers';

// Remote push requires the native ExpoPushTokenManager module, which only
// exists in a custom dev-client / standalone build — NOT in Expo Go. Skip
// registration there instead of throwing "Cannot find native module".
const HAS_NATIVE_PUSH = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

// Show alerts while the app is foregrounded too (e.g. rider mid-job sees the
// next request banner without backgrounding the app).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(OFFER_CHANNEL_ID, {
    name: 'Delivery requests',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#fbd103',
    sound: 'default',
  });
}

async function registerPushToken(riderId: string): Promise<void> {
  if (!HAS_NATIVE_PUSH) {
    console.log('[use-push-notifications] skipping registration — no native push module (Expo Go)');
    return;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') {
      console.log('[use-push-notifications] permission not granted', { rider_id: riderId, status });
      return;
    }

    await ensureAndroidChannel();

    const projectId =
      (Constants.expoConfig?.extra as any)?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId ??
      null;
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    if (!expoPushToken) return;

    const lastSaved = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (lastSaved === expoPushToken) return;

    const sessionToken = await getRiderToken();
    if (!sessionToken) return;

    const { error } = await supabase.functions.invoke('rider-push-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: { expo_push_token: expoPushToken },
    });
    if (error) {
      console.warn('[use-push-notifications] failed to save push token', {
        rider_id: riderId,
        error: error.message,
      });
      return;
    }
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, expoPushToken);
    console.log('[use-push-notifications] registered push token', { rider_id: riderId });
  } catch (e) {
    console.warn('[use-push-notifications] registration failed', { rider_id: riderId, error: e });
  }
}

function isOfferNotification(data: Record<string, unknown> | undefined | null): boolean {
  return !!data && data.type === 'delivery_offer';
}

/**
 * Registers this device's Expo push token (gated to a logged-in rider) so the
 * `notify_rider_of_offer` DB trigger can reach it while backgrounded/closed,
 * and routes to Home when the rider taps a delivery-offer notification — Home
 * already polls/subscribes for the pending offer (see useRiderJobs) so the
 * request card surfaces as soon as the screen mounts/focuses.
 */
export function usePushNotifications(riderId: string | null): void {
  const router = useRouter();
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!riderId || registeredFor.current === riderId) return;
    registeredFor.current = riderId;
    void registerPushToken(riderId);
  }, [riderId]);

  useEffect(() => {
    if (!HAS_NATIVE_PUSH) return;

    const handleResponse = (data: Record<string, unknown> | undefined | null) => {
      if (!isOfferNotification(data)) return;
      console.log('[use-push-notifications] offer notification tapped, navigating home');
      router.replace('/');
    };

    // Cold start: the app was launched by tapping the notification.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      handleResponse(response.notification.request.content.data as Record<string, unknown>);
      void Notifications.clearLastNotificationResponseAsync();
    });

    // Warm tap: the app was backgrounded when the rider tapped it.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleResponse(response.notification.request.content.data as Record<string, unknown>);
      void Notifications.clearLastNotificationResponseAsync();
    });

    return () => sub.remove();
  }, [router]);
}
