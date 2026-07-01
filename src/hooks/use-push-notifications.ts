import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useRouter } from 'expo-router';
import type * as NotificationsModule from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { callBackend } from './backend-client';
import { getRiderToken } from './rider-session';

// expo-notifications ships native code. On a dev client built BEFORE it was
// added, a static `import ... from 'expo-notifications'` throws at load and
// crashes the app. Load it at runtime and null it out if the native module is
// absent; every use below is guarded, so the app simply runs without push
// (foreground offer polling still works) instead of crashing. The `import type`
// above is erased at compile time, so it never touches the native module.
const Notifications: typeof import('expo-notifications') | null = (() => {
  try {
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
})();

const PUSH_TOKEN_KEY = 'famo.pushToken';
const OFFER_CHANNEL_ID = 'delivery-offers';
const CHAT_CHANNEL_ID = 'chat-messages';

const TAG = '[push]';

function hasNativePushModule(): boolean {
  if (!Notifications) return false;
  try {
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      return false;
    }
  } catch {
    // If the enum is unavailable, assume native (dev build / standalone).
  }
  return true;
}

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android' || !Notifications) return;
  await Notifications.setNotificationChannelAsync(OFFER_CHANNEL_ID, {
    name: 'Delivery requests',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#fbd103',
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync(CHAT_CHANNEL_ID, {
    name: 'Chat messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#0078d4',
    sound: 'default',
  });
}

async function registerPushToken(riderId: string): Promise<void> {
  console.log(TAG, 'registration starting', { rider_id: riderId, platform: Platform.OS });

  if (!hasNativePushModule() || !Notifications) {
    console.log(TAG, 'skipping — no native push module (Expo Go or stale dev build)');
    return;
  }
  console.log(TAG, 'step 1/6 — native module present');

  // Step 2: permissions
  let status: NotificationsModule.PermissionStatus;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    status = existing;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
  } catch (e) {
    console.warn(TAG, 'step 2 FAILED — permission check threw', e);
    return;
  }
  if (status !== 'granted') {
    console.warn(TAG, 'step 2 FAILED — permission not granted', { status });
    return;
  }
  console.log(TAG, 'step 2/6 — permission granted');

  // Step 3: Android channels
  try {
    await ensureAndroidChannels();
  } catch (e) {
    console.warn(TAG, 'step 3 FAILED — channel creation threw (non-fatal)', e);
  }
  console.log(TAG, 'step 3/6 — channels ready');

  // Step 4: get Expo push token
  let expoPushToken: string;
  try {
    const projectId =
      (Constants.expoConfig?.extra as any)?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId ??
      null;
    console.log(TAG, 'step 4 — requesting token', { projectId });
    const result = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    expoPushToken = result.data;
  } catch (e: any) {
    console.error(TAG, 'step 4 FAILED — getExpoPushTokenAsync threw', {
      message: e?.message,
      code: e?.code,
      error: e,
    });
    return;
  }
  if (!expoPushToken) {
    console.warn(TAG, 'step 4 FAILED — token was empty');
    return;
  }
  console.log(TAG, 'step 4/6 — got token', { token: expoPushToken.substring(0, 30) + '...' });

  // Step 5: skip if already saved
  const lastSaved = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (lastSaved === expoPushToken) {
    console.log(TAG, 'step 5/6 — token unchanged, skipping save');
    return;
  }

  // Step 6: save to backend
  const sessionToken = await getRiderToken();
  if (!sessionToken) {
    console.warn(TAG, 'step 6 FAILED — no session token');
    return;
  }

  console.log(TAG, 'step 6/6 — saving token via backend');
  const { error } = await callBackend(
    'rider-push-token',
    { expo_push_token: expoPushToken },
    { token: sessionToken },
  );

  if (error) {
    console.warn(TAG, 'step 6 FAILED — backend rejected token', {
      rider_id: riderId,
      error: error.message,
      status: error.status,
    });
    return;
  }

  await AsyncStorage.setItem(PUSH_TOKEN_KEY, expoPushToken);
  console.log(TAG, 'registration complete', { rider_id: riderId });
}

function isOfferNotification(data: Record<string, unknown> | undefined | null): boolean {
  return !!data && data.type === 'delivery_offer';
}

function isChatNotification(data: Record<string, unknown> | undefined | null): boolean {
  return !!data && data.type === 'chat_message';
}

export function usePushNotifications(riderId: string | null): void {
  const router = useRouter();
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!riderId || registeredFor.current === riderId) return;
    registeredFor.current = riderId;
    void registerPushToken(riderId);
  }, [riderId]);

  useEffect(() => {
    if (!hasNativePushModule() || !Notifications) return;
    const Notif = Notifications;

    const handleResponse = (data: Record<string, unknown> | undefined | null) => {
      if (isOfferNotification(data)) {
        console.log(TAG, 'offer notification tapped, navigating home');
        router.replace('/');
      } else if (isChatNotification(data)) {
        console.log(TAG, 'chat notification tapped, navigating home');
        router.replace('/');
      }
    };

    void Notif.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      handleResponse(response.notification.request.content.data as Record<string, unknown>);
      void Notif.clearLastNotificationResponseAsync();
    });

    const sub = Notif.addNotificationResponseReceivedListener((response) => {
      handleResponse(response.notification.request.content.data as Record<string, unknown>);
      void Notif.clearLastNotificationResponseAsync();
    });

    return () => sub.remove();
  }, [router]);
}
