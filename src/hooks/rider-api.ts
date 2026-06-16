import { callBackend } from './backend-client';
import { getRiderToken, getStoredRiderId } from './rider-session';

export type DeliveryStatus =
  | 'searching'
  | 'accepted'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export type DeliveryCustomer = {
  full_name: string | null;
  phone_number: string | null;
};

export type PackageCategory = 'documents' | 'electronics' | 'fragile' | 'food' | 'other';
export type PackageSize = 's' | 'm' | 'l' | 'xl';
export type PaymentMethod = 'cod' | 'bank_transfer';

export type Delivery = {
  id: string;
  user_id: string;
  rider_id: string | null;
  status: DeliveryStatus;
  accepted_at: string | null;
  pickup_address: string | null;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string | null;
  dropoff_lat: number;
  dropoff_lng: number;
  weight: number | null;
  price: number | null;
  created_at: string;
  // Order payload written by the customer app (all nullable; old rows are null).
  package_category: PackageCategory | string | null;
  package_description: string | null;
  package_size: PackageSize | string | null;
  sender_name: string | null;
  sender_phone: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  pickup_notes: string | null;
  dropoff_notes: string | null;
  special_instructions: string | null;
  // How the customer chose to pay, and optional proof-of-payment screenshot
  // they attached for bank transfers (both null on older orders).
  payment_method: PaymentMethod | string | null;
  payment_screenshot_url: string | null;
  users?: DeliveryCustomer | null;
};

const PACKAGE_CATEGORY_LABELS: Record<string, string> = {
  documents: 'Documents',
  electronics: 'Electronics',
  fragile: 'Fragile',
  food: 'Food',
  other: 'Other',
};

const PACKAGE_SIZE_LABELS: Record<string, string> = {
  s: 'Small',
  m: 'Medium',
  l: 'Large',
  xl: 'Extra large',
};

/** Human-readable package category label, or null when unset. */
export function formatPackageCategory(value: string | null | undefined): string | null {
  if (!value) return null;
  return PACKAGE_CATEGORY_LABELS[value] ?? value;
}

/** Human-readable package size label, or null when unset. */
export function formatPackageSize(value: string | null | undefined): string | null {
  if (!value) return null;
  return PACKAGE_SIZE_LABELS[value] ?? value;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery (COD)',
  bank_transfer: 'Bank Account',
};

/** Human-readable payment method label, or null when the customer hasn't specified one. */
export function formatPaymentMethod(value: string | null | undefined): string | null {
  if (!value) return null;
  return PAYMENT_METHOD_LABELS[value] ?? value;
}

export type DeliveryOffer = {
  id: string;
  delivery_id: string;
  rider_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'superseded' | 'cancelled';
  distance_meters: number | null;
  offered_at: string;
  expires_at: string;
  responded_at: string | null;
};

/**
 * Fetch the delivery behind a pending offer. Goes through the Node backend
 * (the deliveries table is closed to the anon key) which validates the offer
 * belongs to this rider, derived from the session token, before returning
 * customer details.
 */
export async function fetchOfferDelivery(offerId: string): Promise<Delivery | null> {
  const token = await getRiderToken();
  if (!token) return null;
  const riderId = await getStoredRiderId();
  const { data, error } = await callBackend('rider-deliveries', {
    action: 'offer_delivery',
    offer_id: offerId,
    offerId,
    rider_id: riderId ?? undefined,
    riderId: riderId ?? undefined,
  }, { token });
  if (error) {
    console.warn('[rider-api] fetchOfferDelivery failed', error.message);
    return null;
  }
  return (data?.delivery as Delivery | null) ?? null;
}

/**
 * Re-fetch a rider's still-active delivery on app launch so an in-progress job
 * survives a restart. Validated by the Node backend (rider derived from the
 * session token).
 */
export async function fetchActiveDelivery(): Promise<Delivery | null> {
  const token = await getRiderToken();
  if (!token) return null;
  const riderId = await getStoredRiderId();
  const { data, error } = await callBackend('rider-deliveries', {
    action: 'active_delivery',
    rider_id: riderId ?? undefined,
    riderId: riderId ?? undefined,
  }, { token });
  if (error) {
    console.warn('[rider-api] fetchActiveDelivery failed', error.message);
    return null;
  }
  return (data?.delivery as Delivery | null) ?? null;
}

/**
 * Count every order currently assigned to this rider (status accepted or
 * picked_up). Unlike fetchActiveDelivery (which returns just one job to work),
 * this reflects the true number of live jobs so the dashboard can display it.
 * Returns 0 on any error so the UI degrades gracefully.
 */
export async function fetchActiveDeliveriesCount(): Promise<number> {
  const token = await getRiderToken();
  if (!token) return 0;
  const riderId = await getStoredRiderId();
  const { data, error } = await callBackend<{ ok: boolean; count: number; ids: string[] }>(
    'rider-deliveries',
    {
      action: 'active_deliveries',
      rider_id: riderId ?? undefined,
      riderId: riderId ?? undefined,
    },
    { token },
  );
  if (error) {
    console.warn('[rider-api] fetchActiveDeliveriesCount failed', error.message);
    return 0;
  }
  return typeof data?.count === 'number' ? data.count : 0;
}

export type RespondResult = {
  ok: boolean;
  action?: 'accept' | 'decline';
  error?: string;
};

/**
 * Accept or decline an offer via the Node backend. The rider is identified by
 * the session token; the backend returns only { ok, action }, so the caller
 * re-fetches the delivery after a successful accept.
 */
export async function respondToOffer(
  action: 'accept' | 'decline',
  offerId: string,
): Promise<RespondResult> {
  const token = await getRiderToken();
  if (!token) return { ok: false, error: 'no_session' };
  const riderId = await getStoredRiderId();
  const { data, error } = await callBackend<RespondResult>('rider-respond-offer', {
    action,
    offerId,
    offer_id: offerId,
    rider_id: riderId ?? undefined,
    riderId: riderId ?? undefined,
  }, { token });
  if (error) return { ok: false, error: data?.error ?? error.message };
  return data as RespondResult;
}

export type UpdateResult = {
  ok: boolean;
  delivery?: { id: string; status: DeliveryStatus } | null;
  reason?: string;
  error?: string;
};

/** Advance a delivery status (picked_up / delivered) via the Node backend. */
export async function updateDeliveryStatus(
  deliveryId: string,
  status: 'picked_up' | 'delivered',
): Promise<UpdateResult> {
  const token = await getRiderToken();
  if (!token) return { ok: false, error: 'no_session' };
  const riderId = await getStoredRiderId();
  const { data, error } = await callBackend<UpdateResult>('rider-update-delivery', {
    deliveryId,
    delivery_id: deliveryId,
    status,
    rider_id: riderId ?? undefined,
    riderId: riderId ?? undefined,
  }, { token });
  if (error) return { ok: false, error: data?.error ?? error.message };
  return data as UpdateResult;
}

export type CancelResult = {
  ok: boolean;
  error?: string;
};

/**
 * Cancel a just-accepted delivery within the 1-minute grace period. The backend
 * enforces ownership + the grace window; on success the job is released and
 * re-dispatched to the next nearest riders.
 */
export async function cancelDelivery(deliveryId: string): Promise<CancelResult> {
  const token = await getRiderToken();
  if (!token) return { ok: false, error: 'no_session' };
  const riderId = await getStoredRiderId();
  const { data, error } = await callBackend<CancelResult>('rider-cancel-delivery', {
    deliveryId,
    delivery_id: deliveryId,
    rider_id: riderId ?? undefined,
    riderId: riderId ?? undefined,
  }, { token });
  if (error) return { ok: false, error: data?.error ?? error.message };
  return data as CancelResult;
}
