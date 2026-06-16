// Token-based rider account API. Every authenticated call sends the rider
// session token as `Authorization: Bearer <token>` to the Node backend (no
// Supabase anon key). Document bytes still go to Supabase Storage via a signed
// upload URL issued by the backend.
import { DeviceEventEmitter } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { callBackend } from './backend-client';
import { getRiderToken } from './rider-session';
import { supabase } from './supabase-client';

export const PROFILE_UPDATED_EVENT = 'famo.profileUpdated';

export type RiderProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  is_verified: boolean | null;
  status: string | null;
  created_at: string | null;
  vehicle_type: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  vehicle_plate: string | null;
  vehicle_battery_capacity: string | null;
  payout_bank: string | null;
  payout_account_number: string | null;
  payout_bvn: string | null;
  license_path: string | null;
  license_front_path: string | null;
  license_back_path: string | null;
  selfie_path: string | null;
  selfie_with_license_path: string | null;
  avatar_url: string | null;
};

export type ProfileUpdate = Partial<
  Pick<
    RiderProfile,
    | 'full_name'
    | 'phone_number'
    | 'vehicle_type'
    | 'vehicle_brand'
    | 'vehicle_model'
    | 'vehicle_year'
    | 'vehicle_plate'
    | 'vehicle_battery_capacity'
    | 'payout_bank'
    | 'payout_account_number'
    | 'payout_bvn'
    | 'avatar_url'
  >
>;

export type DocType =
  | 'license'
  | 'license_front'
  | 'license_back'
  | 'selfie'
  | 'selfie_with_license';

const DOC_BUCKET = 'rider-documents';
const AVATAR_BUCKET = 'avatars';

/** Read the current rider's own profile (never password/verification_code). */
export async function getRiderProfile(): Promise<RiderProfile | null> {
  const token = await getRiderToken();
  if (!token) return null;
  const { data, error } = await callBackend('rider-profile', { action: 'get' }, { token });
  if (error || !data?.ok) {
    console.warn('[rider-account] getRiderProfile failed', error?.message ?? data?.error);
    return null;
  }
  return (data.rider as RiderProfile) ?? null;
}

/** Update the rider's editable fields (name/phone/vehicle/payout). */
export async function updateRiderProfile(profile: ProfileUpdate): Promise<RiderProfile | null> {
  const token = await getRiderToken();
  if (!token) return null;
  const { data, error } = await callBackend(
    'rider-profile',
    { action: 'update_profile', profile },
    { token },
  );
  if (error || !data?.ok) {
    console.warn('[rider-account] updateRiderProfile failed', error?.message ?? data?.error);
    return null;
  }
  DeviceEventEmitter.emit(PROFILE_UPDATED_EVENT);
  return (data.rider as RiderProfile) ?? null;
}

/** Mark the onboarding application as submitted for admin review. */
export async function submitRiderApplication(): Promise<boolean> {
  const token = await getRiderToken();
  if (!token) return false;
  const { data, error } = await supabase.functions.invoke('rider-submit-application', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {},
  });
  if (error || !data?.ok) {
    console.warn('[rider-account] submitRiderApplication failed', error?.message ?? data?.error);
    return false;
  }
  return true;
}

export type UploadResult = { ok: boolean; path?: string; error?: string };

/** Decode a base64 string to a byte array without any native module. */
function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/^data:[^;]+;base64,/, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  let bufferLength = Math.floor((clean.length * 3) / 4);
  if (clean[clean.length - 1] === '=') bufferLength--;
  if (clean[clean.length - 2] === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)];
    const e2 = lookup[clean.charCodeAt(i + 1)];
    const e3 = lookup[clean.charCodeAt(i + 2)];
    const e4 = lookup[clean.charCodeAt(i + 3)];
    if (p < bufferLength) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < bufferLength) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < bufferLength) bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
  }
  return bytes;
}

/**
 * Upload a rider document. Asks the backend for a one-time signed upload URL
 * (which also records the *_path column server-side), then uploads the file to
 * Supabase Storage with uploadToSignedUrl. The image bytes come from the
 * ImagePicker asset's base64 (decoded in JS) because fetch(fileUri).blob() is
 * unreliable on React Native for file:// URIs ("Network request failed").
 */
export async function uploadRiderDocument(
  docType: DocType,
  fileUri: string,
  contentType?: string,
  base64?: string | null,
): Promise<UploadResult> {
  const token = await getRiderToken();
  if (!token) return { ok: false, error: 'no_session' };

  if (!base64) return { ok: false, error: 'missing_image_data' };

  const ext = (fileUri.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';

  const { data, error } = await callBackend(
    'rider-documents',
    { action: 'sign_upload', doc_type: docType, ext },
    { token },
  );
  if (error || !data?.ok || !data?.path || !data?.token) {
    return { ok: false, error: error?.message ?? data?.error ?? 'sign_failed' };
  }

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(base64);
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'decode_failed' };
  }

  const resolvedType = contentType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const { error: upErr } = await supabase.storage
    .from(DOC_BUCKET)
    .uploadToSignedUrl(data.path as string, data.token as string, bytes, {
      contentType: resolvedType,
      // Overwrite any existing file at this path. Without this, storage-js sends
      // `x-upsert: false` and re-uploading to the same path fails as a duplicate.
      upsert: true,
    });
  if (upErr) return { ok: false, error: upErr.message };

  return { ok: true, path: data.path as string };
}

export type AvatarUploadResult = { ok: boolean; url?: string; error?: string };

/**
 * Upload a new profile photo to the public 'avatars' bucket and return its
 * public URL. This only writes the file to storage — it does NOT update the
 * rider's profile row or any shared/global state. Callers should pass the
 * returned url as `avatar_url` to `updateRiderProfile` to persist it.
 */
export async function uploadRiderAvatar(
  fileUri: string,
  contentType?: string,
  base64?: string | null,
): Promise<AvatarUploadResult> {
  const token = await getRiderToken();
  if (!token) return { ok: false, error: 'no_session' };

  if (!base64) return { ok: false, error: 'missing_image_data' };

  const ext = (fileUri.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';

  const { data, error } = await callBackend(
    'rider-profile',
    { action: 'sign_avatar_upload', ext },
    { token },
  );
  if (error || !data?.ok) {
    return { ok: false, error: error?.message ?? data?.error ?? 'sign_failed' };
  }
  if (!data?.path || !data?.token) {
    return { ok: false, error: 'sign_missing_token' };
  }
  // Fall back to building the public URL ourselves if the backend didn't send
  // one (older backend builds may omit `publicUrl`).
  const publicUrl =
    (data.publicUrl as string | undefined) ??
    supabase.storage.from(AVATAR_BUCKET).getPublicUrl(data.path as string).data.publicUrl;
  if (!publicUrl) {
    return { ok: false, error: 'sign_missing_url' };
  }

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(base64);
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'decode_failed' };
  }

  const resolvedType = contentType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const { error: upErr } = await supabase.storage
    .from(AVATAR_BUCKET)
    .uploadToSignedUrl(data.path as string, data.token as string, bytes, {
      contentType: resolvedType,
      // The avatar path is fixed per rider, so every change after the first is
      // an overwrite. Without upsert, storage-js sends `x-upsert: false` and the
      // upload fails with "The resource already exists".
      upsert: true,
    });
  if (upErr) return { ok: false, error: upErr.message };

  // Bust CDN/client image caches since the path is deterministic per rider.
  return { ok: true, url: `${publicUrl}?v=${Date.now()}` };
}

/**
 * Get a short-lived (5 min) signed URL to view a previously uploaded document.
 * `ext` must match what was uploaded; derive it from the stored *_path.
 */
export async function getDocumentUrl(docType: DocType, ext: string): Promise<string | null> {
  const token = await getRiderToken();
  if (!token) return null;
  const { data, error } = await callBackend(
    'rider-documents',
    { action: 'sign_download', doc_type: docType, ext },
    { token },
  );
  if (error || !data?.ok) return null;
  return (data.signedUrl as string) ?? null;
}

/**
 * Permanently delete the rider account. Returns reason 'active_delivery' when
 * the server refuses (HTTP 409) because a job is in progress.
 */
export async function deleteRiderAccount(
  tokenOverride?: string,
): Promise<{ ok: boolean; reason?: string }> {
  const token = tokenOverride ?? (await getRiderToken());
  if (!token) return { ok: false, reason: 'no_session' };
  const { data, error } = await callBackend('rider-delete', {}, { token });
  if (error) {
    return { ok: false, reason: data?.error ?? error.message };
  }
  return { ok: data?.ok !== false };
}

/**
 * Verify a rider's email + password by attempting a login. Returns a fresh
 * session token on success (used to re-authenticate before destructive actions).
 */
export async function verifyRiderPassword(email: string, password: string): Promise<string | null> {
  const { data, error } = await callBackend('rider-auth', {
    action: 'login',
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data?.ok || !data?.token) return null;
  return data.token as string;
}

import { useEffect, useState } from 'react';

const PROFILE_CACHE_KEY = 'famo.profileCache';

/** Custom hook to listen to profile and avatar changes instantly.
 *  Shows the last-known profile from local cache immediately on mount so
 *  the rider's name is never blank while the backend fetch is in flight. */
export function useRiderProfileData() {
  const [profile, setProfile] = useState<RiderProfile | null>(null);

  const loadData = async () => {
    const p = await getRiderProfile();
    if (p) {
      setProfile(p);
      void AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p));
    }
  };

  useEffect(() => {
    // Show cached profile instantly while the network fetch is in-flight.
    void AsyncStorage.getItem(PROFILE_CACHE_KEY).then((cached) => {
      if (cached) setProfile(JSON.parse(cached) as RiderProfile);
    });
    void loadData();
    const sub = DeviceEventEmitter.addListener(PROFILE_UPDATED_EVENT, () => void loadData());
    return () => sub.remove();
  }, []);

  return { profile, avatar: profile?.avatar_url ?? null };
}

