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

export type RiderJobs = {
  pendingOffer: DeliveryOffer | null;
  offerDelivery: Delivery | null;
  activeDelivery: Delivery | null;
  busy: boolean;
  acceptOffer: () => Promise<boolean>;
  declineOffer: () => Promise<void>;
  markPickedUp: () => Promise<boolean>;
  markDelivered: () => Promise<boolean>;
  cancelActiveDelivery: () => Promise<boolean>;
  /**
   * Bumps whenever an in-progress job disappears server-side (i.e. the customer
   * cancelled after the rider accepted). Consumers watch this to force the UI
   * back to the Home screen.
   */
  externalCancelTick: number;
  dismissOffer: () => void;
  finishJob: () => void;
};

function isLivePendingOffer(offer: DeliveryOffer): boolean {
  return offer.status === 'pending' && new Date(offer.expires_at).getTime() > Date.now();
}

/**
 * Resolve a usable delivery_offers id for a response. The realtime payload that
 * surfaced the offer can arrive column-stripped under RLS (no `id`), so fall
 * back to reading the rider's live pending offer straight from the table, which
 * always includes the primary key.
 */
async function resolveOfferId(
  offer: DeliveryOffer,
  riderId: string,
): Promise<string | null> {
  if (offer.id) return offer.id;
  const { data, error } = await supabase
    .from('delivery_offers')
    .select('id')
    .eq('rider_id', riderId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })
    .limit(1);
  if (error) {
    console.warn('[use-rider-jobs] resolveOfferId failed', { riderId, error: error.message });
    return null;
  }
  return (data?.[0] as { id: string } | undefined)?.id ?? null;
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
 * the current pending offer, and exposes accept/decline + status-advance actions
 * (all routed through service-role Edge Functions).
 */
export function useRiderJobs({ riderId, online }: Options): RiderJobs {
  const [pendingOffer, setPendingOffer] = useState<DeliveryOffer | null>(null);
  const [offerDelivery, setOfferDelivery] = useState<Delivery | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [externalCancelTick, setExternalCancelTick] = useState(0);
  const [busy, setBusy] = useState(false);

  const activeRef = useRef<Delivery | null>(null);
  activeRef.current = activeDelivery;

  const pendingOfferRef = useRef<DeliveryOffer | null>(null);
  pendingOfferRef.current = pendingOffer;


  const clearPendingOffer = useCallback((source: string, offerId?: string) => {
    const current = pendingOfferRef.current;
    if (offerId && current && current.id !== offerId) return;
    if (current) {
      console.log('[use-rider-jobs] clearing pending offer', {
        source,
        rider_id: riderId,
        offer_id: current.id,
      });
    }
    setPendingOffer(null);
    setOfferDelivery(null);
  }, [riderId]);

  const showPendingOffer = useCallback(
    async (offer: DeliveryOffer, source: string) => {
      console.log('[use-rider-jobs] pending offer candidate', {
        source,
        offer: loggableOffer(offer),
      });

      if (!isLivePendingOffer(offer)) {
        clearPendingOffer(source, offer.id);
        return;
      }

      if (activeRef.current) {
        console.log('[use-rider-jobs] ignoring offer while active delivery exists', {
          source,
          rider_id: riderId,
          offer_id: offer.id,
          active_delivery_id: activeRef.current.id,
        });
        return;
      }

      // Surface the offer immediately. The delivery detail is best-effort:
      // if the backend lookup fails the rider can still see and respond to the
      // offer (DeliveryRequest renders fallbacks for a null delivery).
      const delivery = await fetchOfferDelivery(offer.id);
      if (!delivery) {
        console.warn('[use-rider-jobs] pending offer delivery fetch returned empty; showing anyway', {
          source,
          rider_id: riderId,
          offer_id: offer.id,
          delivery_id: offer.delivery_id,
        });
      }

      console.log('[use-rider-jobs] showing pending offer', {
        source,
        rider_id: riderId,
        offer_id: offer.id,
        delivery_id: delivery?.id ?? null,
      });
      setPendingOffer(offer);
      setOfferDelivery(delivery);
    },
    [clearPendingOffer, riderId],
  );

  const fetchCurrentPendingOffer = useCallback(
    async (source: string) => {
      if (!riderId || !online) {
        console.log('[use-rider-jobs] skip pending offer fetch', {
          source,
          rider_id: riderId,
          online,
        });
        return;
      }

      console.log('[use-rider-jobs] fetching pending offers', { source, rider_id: riderId });
      const { data, error } = await supabase
        .from('delivery_offers')
        .select('*')
        .eq('rider_id', riderId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true })
        .limit(1);

      if (error) {
        console.warn('[use-rider-jobs] pending offer fetch failed', {
          source,
          rider_id: riderId,
          error: error.message,
        });
        return;
      }

      const rows = (data ?? []) as DeliveryOffer[];
      console.log('[use-rider-jobs] pending offer rows', {
        source,
        rider_id: riderId,
        count: rows.length,
        rows: rows.map(loggableOffer),
      });

      if (rows[0]) {
        await showPendingOffer(rows[0], source);
        return;
      }

      // No live pending offer for this rider in the database. Clear any card
      // still on screen. We intentionally do NOT gate on isLivePendingOffer
      // here: a column-stripped realtime payload can leave a stale local offer
      // whose status still reads 'pending', which would otherwise never clear.
      if (pendingOfferRef.current) {
        clearPendingOffer(source);
      }
    },
    [clearPendingOffer, online, riderId, showPendingOffer],
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
      void fetchCurrentPendingOffer('screen_focus');
    }, [fetchCurrentPendingOffer]),
  );

  // Realtime websockets are suspended while the app is backgrounded, so any
  // delivery_offers INSERT that arrives in that window is missed. When the app
  // returns to the foreground, re-fetch the current pending offer. (navigation
  // useFocusEffect does NOT fire on background->active transitions.)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        console.log('[use-rider-jobs] app became active, refetching offers', {
          rider_id: riderId,
        });
        void fetchCurrentPendingOffer('app_active');
      }
    });
    return () => sub.remove();
  }, [fetchCurrentPendingOffer, riderId]);

  // Safety-net poll: while online with no active job, re-check for a pending
  // offer every few seconds in case a realtime event was dropped (transient
  // socket loss, reconnect gap, etc.). The 35s offer window comfortably covers
  // an 8s poll.
  useEffect(() => {
    if (!riderId || !online) return;
    const id = setInterval(() => {
      if (!pendingOfferRef.current && !activeRef.current) {
        void fetchCurrentPendingOffer('poll');
      }
    }, 8000);
    return () => clearInterval(id);
  }, [fetchCurrentPendingOffer, online, riderId]);

  // Listen for incoming offers while online and not already on a job.
  useEffect(() => {
    if (!riderId || !online) return;

    console.log('[use-rider-jobs] subscribing to delivery_offers', { rider_id: riderId });
    void fetchCurrentPendingOffer('subscription_start');

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
          // payload can arrive without its column data (notably no `id`), which
          // previously surfaced an offer the rider could not accept (the POST
          // carried an empty offerId). Re-read the authoritative pending row
          // (select *) so the offer always carries its real id.
          await fetchCurrentPendingOffer('realtime_insert');
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

          // Phase 4: the offer for our ACTIVE job just went terminal (the
          // customer cancelled after we accepted). Kill the active job and
          // signal the UI to return Home. (Guarded on offer.status existing so a
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

          // Re-read the authoritative pending row rather than trusting the
          // (possibly column-stripped) payload. This surfaces a still-live offer
          // with its real id and clears the card once it is no longer pending.
          void fetchCurrentPendingOffer('realtime_update');
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
  }, [clearPendingOffer, fetchCurrentPendingOffer, online, riderId, showPendingOffer]);

  const dismissOffer = useCallback(() => {
    setPendingOffer(null);
    setOfferDelivery(null);
  }, []);

  const acceptOffer = useCallback(async (): Promise<boolean> => {
    if (!pendingOffer || !riderId || busy) return false;
    setBusy(true);
    try {
      const offerId = await resolveOfferId(pendingOffer, riderId);
      if (!offerId) {
        console.warn('[use-rider-jobs] accept aborted: could not resolve offer id', {
          rider_id: riderId,
        });
        dismissOffer();
        return false;
      }
      console.log('[use-rider-jobs] accepting offer', {
        rider_id: riderId,
        offer_id: offerId,
        delivery_id: pendingOffer.delivery_id ?? null,
      });
      const res = await respondToOffer('accept', offerId);
      if (res.ok) {
        // Give the backend a brief window to persist the accepted job before
        // hiding the request. If the job never materializes, keep the offer
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
          dismissOffer();
          return true;
        }
        console.warn('[use-rider-jobs] accept confirmed but active delivery was not readable yet', {
          rider_id: riderId,
          offer_id: offerId,
        });
        await fetchCurrentPendingOffer('accept_pending');
        return false;
      }
      // Offer was taken/expired before we responded.
      console.warn('[use-rider-jobs] accept offer failed', {
        rider_id: riderId,
        offer_id: pendingOffer.id,
        error: res.error,
      });
      await fetchCurrentPendingOffer('accept_failed');
      return false;
    } finally {
      setBusy(false);
    }
  }, [pendingOffer, riderId, busy, dismissOffer, fetchCurrentPendingOffer]);

  const declineOffer = useCallback(async () => {
    const offer = pendingOffer;
    dismissOffer();
    if (offer && riderId) {
      const offerId = await resolveOfferId(offer, riderId);
      if (!offerId) {
        console.warn('[use-rider-jobs] decline skipped: could not resolve offer id', {
          rider_id: riderId,
        });
        return;
      }
      console.log('[use-rider-jobs] declining offer', {
        rider_id: riderId,
        offer_id: offerId,
        delivery_id: offer.delivery_id ?? null,
      });
      const res = await respondToOffer('decline', offerId);
      if (!res.ok) {
        console.warn('[use-rider-jobs] decline offer failed', {
          rider_id: riderId,
          offer_id: offer.id,
          error: res.error,
        });
      }
    }
  }, [pendingOffer, riderId, dismissOffer]);

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

  // Phase 4: while a job is in progress, poll the backend so that if the
  // customer cancels the delivery (it leaves the accepted/picked_up state) we
  // detect the disappearance and kill the active job locally. A 'delivered'
  // job is awaiting the completion screen and must not be poll-cleared.
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

  // Phase 3: cancel within the 1-minute grace. The backend enforces ownership
  // and the grace window; on success the job is released to the next riders.
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
    pendingOffer,
    offerDelivery,
    activeDelivery,
    busy,
    acceptOffer,
    declineOffer,
    markPickedUp,
    markDelivered,
    cancelActiveDelivery,
    externalCancelTick,
    dismissOffer,
    finishJob,
  };
}
