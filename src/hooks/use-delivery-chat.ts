// Persisted in-app chat between rider and customer for an active delivery,
// backed by the public.messages table and Postgres Changes realtime — the
// same pattern as the existing delivery-status subscriptions (not the
// ephemeral broadcast pattern used for GPS tracking).
//
// Riders authenticate through an external token-based system rather than
// Supabase Auth, so auth.uid() is always null for them. RLS therefore scopes
// rider access by knowledge of delivery_id (mirroring delivery_offers/
// rider_locations), while the customer side is enforced via auth.uid(). See
// the `messages` table policies for the exact rules.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getStoredRiderId } from './rider-session';
import { supabase } from './supabase-client';

export type ChatSender = 'rider' | 'customer';

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  sentAt: number;
};

type MessageRow = {
  id: string;
  sender_id: string | null;
  sender_role: 'user' | 'rider';
  body: string;
  created_at: string;
};

function toChatMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    sender: row.sender_role === 'rider' ? 'rider' : 'customer',
    text: row.body,
    sentAt: new Date(row.created_at).getTime(),
  };
}

/**
 * Loads message history for `deliveryId` and subscribes to new inserts via
 * Postgres Changes. `self` identifies which side of the conversation this app
 * is on — `'rider'` here, `'customer'` in the User App — which determines how
 * outgoing messages are tagged (`sender_role` + `sender_id`).
 */
export function useDeliveryChat(deliveryId: string | null | undefined, self: ChatSender) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const riderIdRef = useRef<string | null>(null);

  useEffect(() => {
    setMessages([]);
    if (!deliveryId) return;
    let cancelled = false;

    (async () => {
      if (self === 'rider' && riderIdRef.current == null) {
        riderIdRef.current = await getStoredRiderId();
      }

      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, sender_role, body, created_at')
        .eq('delivery_id', deliveryId)
        .order('created_at', { ascending: true });
      if (!cancelled && !error && data) {
        setMessages(data.map(toChatMessage));
      }
    })();

    const channel = supabase
      .channel(`delivery-chat:${deliveryId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `delivery_id=eq.${deliveryId}` },
        ({ new: row }) => {
          const msg = toChatMessage(row as MessageRow);
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [deliveryId, self]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !deliveryId) return;

      const senderId = self === 'rider' ? (riderIdRef.current ?? (await getStoredRiderId())) : null;
      const { error } = await supabase.from('messages').insert({
        delivery_id: deliveryId,
        sender_id: senderId,
        sender_role: self === 'rider' ? 'rider' : 'user',
        body: trimmed,
      });
      if (error) {
        console.warn('[use-delivery-chat] failed to send message', { deliveryId, self, error: error.message });
      }
      // On success the insert is echoed back through the realtime subscription
      // above and appended there — no optimistic update needed.
    },
    [deliveryId, self],
  );

  return { messages, send };
}

/**
 * Tracks how many messages from the *other* party have arrived for a delivery
 * since this side last opened the chat — used to render an unread badge on the
 * chat entry-point icon. `self` is this app's role ('rider' here), so the badge
 * counts incoming 'user' messages. The last-read marker is persisted per
 * delivery in AsyncStorage so the badge survives app restarts, and `markRead`
 * clears it (call when the chat is opened/closed).
 */
export function useUnreadDeliveryMessages(deliveryId: string | null | undefined, self: ChatSender) {
  const [unread, setUnread] = useState(0);
  const lastReadRef = useRef(0);
  const storageKey = deliveryId ? `famo.chatRead.${deliveryId}` : null;

  useEffect(() => {
    setUnread(0);
    if (!deliveryId || !storageKey) return;
    let cancelled = false;
    const otherRole: 'user' | 'rider' = self === 'rider' ? 'user' : 'rider';

    (async () => {
      const stored = await AsyncStorage.getItem(storageKey);
      lastReadRef.current = stored ? Number(stored) || 0 : 0;

      const { data, error } = await supabase
        .from('messages')
        .select('created_at')
        .eq('delivery_id', deliveryId)
        .eq('sender_role', otherRole)
        .order('created_at', { ascending: true });
      if (cancelled || error || !data) return;
      const count = data.filter((m) => new Date(m.created_at).getTime() > lastReadRef.current).length;
      setUnread(count);
    })();

    const channel = supabase
      .channel(`delivery-chat-unread:${deliveryId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `delivery_id=eq.${deliveryId}` },
        ({ new: row }) => {
          const r = row as MessageRow;
          if (r.sender_role === otherRole && new Date(r.created_at).getTime() > lastReadRef.current) {
            setUnread((c) => c + 1);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [deliveryId, self, storageKey]);

  const markRead = useCallback(async () => {
    lastReadRef.current = Date.now();
    setUnread(0);
    if (!storageKey) return;
    try {
      await AsyncStorage.setItem(storageKey, String(lastReadRef.current));
    } catch {
      // ignore storage errors — the badge just won't persist across restarts
    }
  }, [storageKey]);

  return { unread, markRead };
}
