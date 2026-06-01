import { callBackend } from './backend-client';
import { getRiderToken } from './rider-session';

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

export type Delivery = {
  id: string;
  user_id: string;
  rider_id: string | null;
  status: DeliveryStatus;
  pickup_address: string | null;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string | null;
  dropoff_lat: number;
  dropoff_lng: number;
  weight: number | null;
  price: number | null;
  created_at: string;
  users?: DeliveryCustomer | null;
};

export type DeliveryOffer = {
  id: string;
  delivery_id: string;
  rider_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
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
  const { data, error } = await callBackend('rider-deliveries', {
    action: 'offer_delivery',
    offer_id: offerId,
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
  const { data, error } = await callBackend('rider-deliveries', {
    action: 'active_delivery',
  }, { token });
  if (error) {
    console.warn('[rider-api] fetchActiveDelivery failed', error.message);
    return null;
  }
  return (data?.delivery as Delivery | null) ?? null;
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
  const { data, error } = await callBackend<RespondResult>('rider-respond-offer', {
    action,
    offerId,
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
  const { data, error } = await callBackend<UpdateResult>('rider-update-delivery', {
    deliveryId,
    status,
  }, { token });
  if (error) return { ok: false, error: data?.error ?? error.message };
  return data as UpdateResult;
}
