import { useCallback, useEffect, useRef, useState } from 'react';

import {
    Delivery,
    DeliveryOffer,
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
  dismissOffer: () => void;
  finishJob: () => void;
};

/**
 * Subscribes to delivery_offers for this rider over Supabase Realtime, surfaces
 * the current pending offer, and exposes accept/decline + status-advance actions
 * (all routed through service-role Edge Functions).
 */
export function useRiderJobs({ riderId, online }: Options): RiderJobs {
  const [pendingOffer, setPendingOffer] = useState<DeliveryOffer | null>(null);
  const [offerDelivery, setOfferDelivery] = useState<Delivery | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [busy, setBusy] = useState(false);

  const activeRef = useRef<Delivery | null>(null);
  activeRef.current = activeDelivery;

  // Resume an in-progress job after an app restart.
  useEffect(() => {
    if (!riderId) return;
    let cancelled = false;
    void (async () => {
      const active = await fetchActiveDelivery();
      if (!cancelled && active) setActiveDelivery(active);
    })();
    return () => {
      cancelled = true;
    };
  }, [riderId]);

  // Listen for incoming offers while online and not already on a job.
  useEffect(() => {
    if (!riderId || !online) return;

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
          const offer = payload.new as DeliveryOffer;
          if (offer.status !== 'pending') return;
          if (new Date(offer.expires_at).getTime() <= Date.now()) return;
          if (activeRef.current) return; // already on a job
          const delivery = await fetchOfferDelivery(offer.id);
          setPendingOffer(offer);
          setOfferDelivery(delivery);
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
          const offer = payload.new as DeliveryOffer;
          // Dismiss the card if the current offer was expired/declined elsewhere.
          setPendingOffer((cur) =>
            cur && cur.id === offer.id && offer.status !== 'pending' ? null : cur,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [riderId, online]);

  const dismissOffer = useCallback(() => {
    setPendingOffer(null);
    setOfferDelivery(null);
  }, []);

  const acceptOffer = useCallback(async (): Promise<boolean> => {
    if (!pendingOffer || !riderId || busy) return false;
    setBusy(true);
    try {
      const res = await respondToOffer('accept', pendingOffer.id);
      if (res.ok) {
        // The respond fn only confirms success; pull the full assigned job.
        const active = await fetchActiveDelivery();
        if (active) setActiveDelivery(active);
        dismissOffer();
        return !!active;
      }
      // Offer was taken/expired before we responded.
      dismissOffer();
      return false;
    } finally {
      setBusy(false);
    }
  }, [pendingOffer, riderId, busy, dismissOffer]);

  const declineOffer = useCallback(async () => {
    const offer = pendingOffer;
    dismissOffer();
    if (offer && riderId) {
      await respondToOffer('decline', offer.id);
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
    dismissOffer,
    finishJob,
  };
}
