// Token-based rider account API. Every authenticated call sends the rider
// session token as `Authorization: Bearer <token>` to the Node backend (no
// Supabase anon key). Document bytes still go to Supabase Storage via a signed
// upload URL issued by the backend.
import { callBackend } from './backend-client';
import { getRiderToken } from './rider-session';
import { supabase } from './supabase-client';

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
  payout_bank: string | null;
  payout_account_number: string | null;
  payout_bvn: string | null;
  license_path: string | null;
  license_front_path: string | null;
  license_back_path: string | null;
  selfie_path: string | null;
  selfie_with_license_path: string | null;
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
    | 'payout_bank'
    | 'payout_account_number'
    | 'payout_bvn'
  >
>;

export type DocType =
  | 'license'
  | 'license_front'
  | 'license_back'
  | 'selfie'
  | 'selfie_with_license';

const DOC_BUCKET = 'rider-documents';

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
  return (data.rider as RiderProfile) ?? null;
}

/** Mark the onboarding application as submitted for admin review. */
export async function submitRiderApplication(): Promise<boolean> {
  const token = await getRiderToken();
  if (!token) return false;
  const { data, error } = await callBackend(
    'rider-profile',
    { action: 'submit_application' },
    { token },
  );
  if (error || !data?.ok) {
    console.warn('[rider-account] submitRiderApplication failed', error?.message ?? data?.error);
    return false;
  }
  return true;
}

export type UploadResult = { ok: boolean; path?: string; error?: string };

/**
 * Upload a rider document. Asks the backend for a one-time signed upload URL
 * (which also records the *_path column server-side), then PUTs the file to
 * Supabase Storage with uploadToSignedUrl. The anon key never writes to the
 * bucket.
 */
export async function uploadRiderDocument(
  docType: DocType,
  fileUri: string,
  contentType?: string,
): Promise<UploadResult> {
  const token = await getRiderToken();
  if (!token) return { ok: false, error: 'no_session' };

  const ext = (fileUri.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';

  const { data, error } = await callBackend(
    'rider-documents',
    { action: 'sign_upload', doc_type: docType, ext },
    { token },
  );
  if (error || !data?.ok || !data?.path || !data?.token) {
    return { ok: false, error: error?.message ?? data?.error ?? 'sign_failed' };
  }

  // Pull the captured file into a blob for the signed upload.
  const fileBody = await (await fetch(fileUri)).blob();
  const { error: upErr } = await supabase.storage
    .from(DOC_BUCKET)
    .uploadToSignedUrl(data.path as string, data.token as string, fileBody, {
      contentType: contentType ?? fileBody.type ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    });
  if (upErr) return { ok: false, error: upErr.message };

  return { ok: true, path: data.path as string };
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
