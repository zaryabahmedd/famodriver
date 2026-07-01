import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
    Delivery,
    DeliveryOffer,
    cancelDelivery as cancelDeliveryApi,
    fetchActiveDelivery,
    fetchOfferDelivery,
    respondToOffer,
    updateDeliveryStatus,
} from './rider-api';
import { supabase } from './supabase-client';

type Options = {
  riderId: string | null;
  online: boolean;
};

/** A live offer paired with its (best-effort) delivery detail. */
export type PendingOffer = {
  offer: DeliveryOffer;
  delivery: Delivery | null;
};

export type RiderJobs = {
  /** All live pending offers for this rider (a rider can hold several at once). */
  offers: PendingOffer[];
  activeDelivery: Delivery | null;
  busy: boolean;
  acceptOffer: (offerId: string) => Promise<boolean>;
  declineOffer: (offerId: string) => Promise<void>;
  markPickedUp: () => Promise<boolean>;
  markDelivered: () => Promise<boolean>;
  cancelActiveDelivery: () => Promise<boolean>;
  /**
   * Bumps whenever an in-progress job disappears server-side (i.e. the customer
   * cancelled after the rider accepted). Consumers watch this to force the UI
   * back to the Home screen.
   */
  externalCancelTick: number;
  finishJob: () => void;
};

function isLivePendingOffer(offer: DeliveryOffer): boolean {
  return offer.status === 'pending' && new Date(offer.expires_at).getTime() > Date.now();
}

/**
 * Resolve a usable delivery_offers id for a response. The realtime payload that
 * surfaced the offer can arrive column-stripped under RLS (no `id`), so fall
 * back to reading the rider's live pending offers straight from the table, which
 * always include the primary key.
 */
async function resolveOfferId(
  offer: DeliveryOffer,
  riderId: string,
): Promise<string | null> {
  if (offer.id) return offer.id;
  const { data, error } = await supabase
    .from('delivery_offers')
    .select('id, delivery_id')
    .eq('rider_id', riderId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true });
  if (error) {
    console.warn('[use-rider-jobs] resolveOfferId failed', { riderId, error: error.message });
    return null;
  }
  // Match on delivery_id when we have one; otherwise take the soonest-expiring.
  const rows = (data ?? []) as { id: string; delivery_id: string }[];
  const match = offer.delivery_id
    ? rows.find((r) => r.delivery_id === offer.delivery_id)
    : rows[0];
  return match?.id ?? rows[0]?.id ?? null;
}

function loggableOffer(offer: DeliveryOffer) {
  return {
    id: offer.id,
    delivery_id: offer.delivery_id,
    rider_id: offer.rider_id,
    status: offer.status,
    expires_at: offer.expires_at,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Subscribes to delivery_offers for this rider over Supabase Realtime, surfaces
 * every live pending offer (a rider may receive several requests at once), and
 * exposes per-offer accept/decline + status-advance actions (all routed through
 * service-role Edge Functions).
 */
export function useRiderJobs({ riderId, online }: Options): RiderJobs {
  const [offers, setOffers] = useState<PendingOffer[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [externalCancelTick, setExternalCancelTick] = useState(0);
  const [busy, setBusy] = useState(false);

  const activeRef = useRef<Delivery | null>(null);
  activeRef.current = activeDelivery;

  const offersRef = useRef<PendingOffer[]>(offers);
  offersRef.current = offers;

  // Pull every live pending offer for this rider, attaching each one's delivery
  // detail. Already-loaded deliveries are reused so we don't refetch them on
  // every poll. Offers are ignored entirely while a job is in progress.
  const fetchCurrentPendingOffers = useCallback(
    async (source: string) => {
      if (!riderId || !online) {
        console.log('[use-rider-jobs] skip pending offer fetch', { source, rider_id: riderId, online });
        return;
      }

      if (activeRef.current) {
        if (offersRef.current.length) setOffers([]);
        return;
      }

      const { data, error } = await supabase
        .from('delivery_offers')
        .select('*')
        .eq('rider_id', riderId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

      if (error) {
        console.warn('[use-rider-jobs] pending offers fetch failed', {
          source,
          rider_id: riderId,
          error: error.message,
        });
        return;
      }

      const live = ((data ?? []) as DeliveryOffer[]).filter(isLivePendingOffer);
      console.log('[use-rider-jobs] pending offer rows', {
        source,
        rider_id: riderId,
        count: live.length,
        rows: live.map(loggableOffer),
      });

      if (live.length === 0) {
        if (offersRef.current.length) setOffers([]);
        return;
      }

      // Reuse deliveries we already fetched; only look up newly-arrived offers.
      const known = new Map(offersRef.current.map((p) => [p.offer.id, p.delivery]));
      const result: PendingOffer[] = [];
      for (const offer of live) {
        if (known.has(offer.id)) {
          result.push({ offer, delivery: known.get(offer.id) ?? null });
          continue;
        }
        const delivery = await fetchOfferDelivery(offer.id);
        if (!delivery) {
          console.warn('[use-rider-jobs] offer delivery fetch empty; showing anyway', {
            source,
            rider_id: riderId,
            offer_id: offer.id,
            delivery_id: offer.delivery_id,
          });
        }
        result.push({ offer, delivery });
      }
      setOffers(result);
    },
    [online, riderId],
  );

  // Resume an in-progress job after an app restart.
  useEffect(() => {
    if (!riderId) return;
    let cancelled = false;
    void (async () => {
      const active = await fetchActiveDelivery();
      if (!cancelled && active) {
        console.log('[use-rider-jobs] resumed active delivery', {
          rider_id: riderId,
          delivery_id: active.id,
          status: active.status,
        });
        setActiveDelivery(active);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [riderId]);

  useFocusEffect(
    useCallback(() => {
      void fetchCurrentPendingOffers('screen_focus');
    }, [fetchCurrentPendingOffers]),
  );

  // Realtime websockets are suspended while the app is backgrounded, so any
  // delivery_offers INSERT that arrives in that window is missed. When the app
  // returns to the foreground, re-fetch the current pending offers. (navigation
  // useFocusEffect does NOT fire on background->active transitions.)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        console.log('[use-rider-jobs] app became active, refetching offers', { rider_id: riderId });
        void fetchCurrentPendingOffers('app_active');
      }
    });
    return () => sub.remove();
  }, [fetchCurrentPendingOffers, riderId]);

  // Safety-net poll: while online with no active job, re-check for pending
  // offers every few seconds in case a realtime event was dropped (transient
  // socket loss, reconnect gap, etc.). This also prunes offers that have expired
  // and surfaces newly-arrived ones.
  useEffect(() => {
    if (!riderId || !online) return;
    const id = setInterval(() => {
      if (!activeRef.current) {
        void fetchCurrentPendingOffers('poll');
      }
    }, 8000);
    return () => clearInterval(id);
  }, [fetchCurrentPendingOffers, online, riderId]);

  // Listen for incoming offers while online and not already on a job.
  useEffect(() => {
    if (!riderId || !online) return;

    console.log('[use-rider-jobs] subscribing to delivery_offers', { rider_id: riderId });
    void fetchCurrentPendingOffers('subscription_start');

    const channel = supabase
      .channel(`rider-offers:${riderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_offers',
          filter: `rider_id=eq.${riderId}`,
        },
        async (payload) => {
          const offer = payload.new as Partial<DeliveryOffer>;
          console.log('[use-rider-jobs] realtime INSERT delivery_offers', {
            rider_id: riderId,
            offer_id: offer?.id ?? null,
          });
          // Treat the realtime event as a notification only. Under RLS the anon
          // payload can arrive without its column data (notably no `id`); re-read
          // the authoritative pending rows (select *) so each offer carries its
          // real id and delivery detail.
          await fetchCurrentPendingOffers('realtime_insert');
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_offers',
          filter: `rider_id=eq.${riderId}`,
        },
        (payload) => {
          const offer = payload.new as Partial<DeliveryOffer>;
          console.log('[use-rider-jobs] realtime UPDATE delivery_offers', {
            rider_id: riderId,
            offer_id: offer?.id ?? null,
            offer_status: offer?.status ?? null,
          });

          // The offer for our ACTIVE job just went terminal (the customer
          // cancelled after we accepted). Kill the active job and signal the UI
          // to return Home. (Guarded on offer.status existing so a
          // column-stripped payload can't false-trigger.)
          const active = activeRef.current;
          if (
            active &&
            offer.delivery_id === active.id &&
            !!offer.status &&
            offer.status !== 'pending' &&
            offer.status !== 'accepted'
          ) {
            console.log('[use-rider-jobs] active delivery offer went terminal; clearing active job', {
              rider_id: riderId,
              delivery_id: active.id,
              offer_status: offer.status,
            });
            setActiveDelivery(null);
            setExternalCancelTick((t) => t + 1);
            return;
          }

          // Re-read the authoritative pending rows rather than trusting the
          // (possibly column-stripped) payload. This surfaces still-live offers
          // with real ids and drops any that are no longer pending.
          void fetchCurrentPendingOffers('realtime_update');
        },
      )
      .subscribe((status, error) => {
        console.log('[use-rider-jobs] realtime subscription status', {
          rider_id: riderId,
          status,
          error: error?.message,
        });
      });

    return () => {
      console.log('[use-rider-jobs] removing delivery_offers subscription', { rider_id: riderId });
      supabase.removeChannel(channel);
    };
  }, [fetchCurrentPendingOffers, online, riderId]);

  const acceptOffer = useCallback(
    async (offerId: string): Promise<boolean> => {
      if (!offerId || !riderId || busy) return false;
      setBusy(true);
      try {
        const entry = offersRef.current.find((p) => p.offer.id === offerId);
        const resolvedId = entry ? (await resolveOfferId(entry.offer, riderId)) ?? offerId : offerId;
        console.log('[use-rider-jobs] accepting offer', {
          rider_id: riderId,
          offer_id: resolvedId,
          delivery_id: entry?.offer.delivery_id ?? null,
        });
        const res = await respondToOffer('accept', resolvedId);
        if (res.ok) {
          // Give the backend a brief window to persist the accepted job before
          // hiding the requests. If the job never materializes, keep the offers
          // visible so the rider can retry instead of bouncing back to Home.
          let active: Delivery | null = null;
          for (let attempt = 0; attempt < 3 && !active; attempt += 1) {
            active = await fetchActiveDelivery();
            if (!active && attempt < 2) {
              await sleep(300 * (attempt + 1));
            }
          }
          if (active) {
            setActiveDelivery(active);
            setOffers([]); // rider is now busy — drop every other request
            return true;
          }
          console.warn('[use-rider-jobs] accept confirmed but active delivery not readable yet', {
            rider_id: riderId,
            offer_id: resolvedId,
          });
          await fetchCurrentPendingOffers('accept_pending');
          return false;
        }
        // Offer was taken/expired before we responded.
        console.warn('[use-rider-jobs] accept offer failed', {
          rider_id: riderId,
          offer_id: offerId,
          error: res.error,
        });
        await fetchCurrentPendingOffers('accept_failed');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [riderId, busy, fetchCurrentPendingOffers],
  );

  const declineOffer = useCallback(
    async (offerId: string) => {
      if (!offerId) return;
      const entry = offersRef.current.find((p) => p.offer.id === offerId);
      // Optimistically drop it from the list so the card disappears at once.
      setOffers((prev) => prev.filter((p) => p.offer.id !== offerId));
      if (!riderId) return;
      const resolvedId = entry ? (await resolveOfferId(entry.offer, riderId)) ?? offerId : offerId;
      console.log('[use-rider-jobs] declining offer', {
        rider_id: riderId,
        offer_id: resolvedId,
        delivery_id: entry?.offer.delivery_id ?? null,
      });
      const res = await respondToOffer('decline', resolvedId);
      if (!res.ok) {
        console.warn('[use-rider-jobs] decline offer failed', {
          rider_id: riderId,
          offer_id: offerId,
          error: res.error,
        });
      }
    },
    [riderId],
  );

  const advance = useCallback(
    async (status: 'picked_up' | 'delivered'): Promise<boolean> => {
      const delivery = activeRef.current;
      if (!delivery || !riderId || busy) return false;
      setBusy(true);
      try {
        const res = await updateDeliveryStatus(delivery.id, status);
        if (res.ok && res.delivery) {
          setActiveDelivery((cur) => (cur ? { ...cur, status: res.delivery!.status } : cur));
          return true;
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [riderId, busy],
  );

  const markPickedUp = useCallback(() => advance('picked_up'), [advance]);
  const markDelivered = useCallback(() => advance('delivered'), [advance]);

  // While a job is in progress, poll the backend so that if the customer cancels
  // the delivery (it leaves the accepted/picked_up state) we detect the
  // disappearance and kill the active job locally. A 'delivered' job is awaiting
  // the completion screen and must not be poll-cleared.
  useEffect(() => {
    if (!riderId || !activeDelivery) return;
    if (activeDelivery.status === 'delivered') return;

    const id = setInterval(async () => {
      const current = activeRef.current;
      if (!current || current.status === 'delivered') return;
      const fresh = await fetchActiveDelivery();
      // Bail if the active job changed while we were awaiting the response.
      if (activeRef.current?.id !== current.id) return;
      if (!fresh) {
        console.log('[use-rider-jobs] active delivery vanished server-side; treating as customer cancellation', {
          rider_id: riderId,
          delivery_id: current.id,
        });
        setActiveDelivery(null);
        setExternalCancelTick((t) => t + 1);
      } else if (fresh.status !== current.status) {
        setActiveDelivery(fresh);
      }
    }, 6000);

    return () => clearInterval(id);
  }, [riderId, activeDelivery]);

  // Cancel within the 1-minute grace. The backend enforces ownership and the
  // grace window; on success the job is released to the next riders.
  const cancelActiveDelivery = useCallback(async (): Promise<boolean> => {
    const delivery = activeRef.current;
    if (!delivery || !riderId || busy) return false;
    setBusy(true);
    try {
      console.log('[use-rider-jobs] cancelling active delivery', {
        rider_id: riderId,
        delivery_id: delivery.id,
      });
      const res = await cancelDeliveryApi(delivery.id);
      if (res.ok) {
        setActiveDelivery(null);
        return true;
      }
      console.warn('[use-rider-jobs] cancel active delivery failed', {
        rider_id: riderId,
        delivery_id: delivery.id,
        error: res.error,
      });
      return false;
    } finally {
      setBusy(false);
    }
  }, [riderId, busy]);

  const finishJob = useCallback(() => {
    setActiveDelivery(null);
  }, []);

  return {
    offers,
    activeDelivery,
    busy,
    acceptOffer,
    declineOffer,
    markPickedUp,
    markDelivered,
    cancelActiveDelivery,
    externalCancelTick,
    finishJob,
  };
}
