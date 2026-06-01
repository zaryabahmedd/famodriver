// HTTP client for the FAMO Node.js (Express) backend.
//
// The backend replaced the Supabase Edge Functions. It authenticates riders
// with an opaque session token (SHA-256 hashed in public.rider_sessions), NOT
// the Supabase anon key. So these requests must NOT carry the `apikey` /
// `Authorization: Bearer <anon_key>` headers. When a call needs auth we attach
// the rider session token as `Authorization: Bearer <token>`.
//
// Supabase is still used directly for Realtime (offer pushes, live tracking
// broadcast) and Storage (signed document uploads) — see supabase-client.ts.
import { Platform } from 'react-native';

/**
 * Resolve the backend base URL.
 * - Production / staging: set EXPO_PUBLIC_BACKEND_URL (e.g. the Render URL).
 * - Local dev: Android emulators reach the host machine via 10.0.2.2; iOS
 *   simulators and web use localhost. Port 8080.
 */
function resolveBackendUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/+$/, '');
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
}

export const BACKEND_URL = resolveBackendUrl();

export type BackendError = {
  message: string;
  /** HTTP status (0 for a network/transport failure). */
  status: number;
  /** Parsed JSON error body when present (e.g. { error: 'active_delivery' }). */
  body?: any;
};

export type BackendResponse<T> = {
  data: T | null;
  error: BackendError | null;
  status: number;
};

/**
 * POST JSON to a backend endpoint. Pass the rider session token via opts.token
 * for authenticated endpoints; it is sent as `Authorization: Bearer <token>`.
 * Returns a supabase-style { data, error } pair; `data` is also populated on
 * non-2xx responses so callers can read structured error bodies.
 */
export async function callBackend<T = any>(
  path: string,
  body?: Record<string, unknown>,
  opts?: { token?: string | null },
): Promise<BackendResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts?.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  const url = `${BACKEND_URL}/${path.replace(/^\/+/, '')}`;
  console.log(`[callBackend] POST: ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[callBackend] Request timed out for: ${url}`);
    controller.abort();
  }, 10000); // 10s timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log(`[callBackend] Response status from ${url}: ${res.status}`);

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // Non-JSON or empty body; leave json as null.
    }

    if (!res.ok) {
      return {
        data: json,
        error: {
          message: (json && json.error) || `http_${res.status}`,
          status: res.status,
          body: json,
        },
        status: res.status,
      };
    }

    return { data: json as T, error: null, status: res.status };
  } catch (e: any) {
    clearTimeout(timeoutId);
    console.error(`[callBackend] Error calling ${url}:`, e);
    const isAbort = e?.name === 'AbortError' || e?.message?.includes('abort');
    return {
      data: null,
      error: {
        message: isAbort ? 'timeout' : (e?.message ?? 'network_error'),
        status: 0,
      },
      status: 0,
    };
  }
}
