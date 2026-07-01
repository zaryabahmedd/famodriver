import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

// The rider id is not a secret (it's a public uuid) so it can live in
// AsyncStorage. The session token IS a bearer credential, so on native it goes
// into the OS keystore via expo-secure-store.
//
// expo-secure-store ships native code. On a dev client that was built BEFORE
// this dependency was added — or on web — the native module isn't present, and
// a static `import ... from 'expo-secure-store'` would throw at module load and
// crash the whole app on boot. So we load it only when the native module is
// actually available and fall back to AsyncStorage otherwise. A proper build
// still keeps the token in the OS keystore; the fallback only kicks in where no
// keystore exists (web, or a stale dev build missing the module).
const SecureStore: typeof import('expo-secure-store') | null =
  Platform.OS !== 'web' && requireOptionalNativeModule('ExpoSecureStore')
    ? require('expo-secure-store')
    : null;

const RIDER_ID_KEY = 'famo.riderId';
const TOKEN_KEY = 'famo.riderToken';
const TOKEN_EXP_KEY = 'famo.riderTokenExp';

async function secureSet(key: string, value: string): Promise<void> {
  if (!SecureStore) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureGet(key: string): Promise<string | null> {
  if (!SecureStore) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function secureDelete(key: string): Promise<void> {
  if (!SecureStore) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export type RiderSession = {
  token: string;
  riderId: string;
  /** ISO timestamp from rider-auth (30-day life). */
  expiresAt: string;
};

/** Persist a freshly issued login session (token in the keystore). */
export async function setRiderSession(session: RiderSession): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(RIDER_ID_KEY, session.riderId),
      secureSet(TOKEN_KEY, session.token),
      secureSet(TOKEN_EXP_KEY, session.expiresAt),
    ]);
    console.log('[rider-session] stored rider session', {
      rider_id: session.riderId,
      expires_at: session.expiresAt,
    });
  } catch (error) {
    console.warn('[rider-session] failed to store rider session', {
      rider_id: session.riderId,
      error,
    });
    throw error;
  }
}

/**
 * Return the stored session token, or null if missing/expired. Expired tokens
 * are cleared so the app falls back to the login screen.
 */
export async function getRiderToken(): Promise<string | null> {
  try {
    const [token, exp] = await Promise.all([
      secureGet(TOKEN_KEY),
      secureGet(TOKEN_EXP_KEY),
    ]);
    if (!token) return null;
    if (exp && new Date(exp).getTime() <= Date.now()) {
      await clearRiderSession();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export async function setStoredRiderId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(RIDER_ID_KEY, id);
  } catch {
    // ignore storage errors
  }
}

export async function getStoredRiderId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(RIDER_ID_KEY);
  } catch {
    return null;
  }
}

/** Wipe the rider session (token + id). Used on logout. Does NOT clear the
 *  avatar — that persists across logins and is only removed on account deletion. */
export async function clearRiderSession(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(RIDER_ID_KEY),
      secureDelete(TOKEN_KEY),
      secureDelete(TOKEN_EXP_KEY),
    ]);
  } catch {
    // ignore storage errors
  }
}

/** @deprecated use clearRiderSession (kept so existing call sites compile). */
export async function clearStoredRiderId(): Promise<void> {
  await clearRiderSession();
}
