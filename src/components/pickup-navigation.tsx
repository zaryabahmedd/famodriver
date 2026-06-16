import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RouteMap } from '@/components/route-map';
import { estimateMinutes, formatDuration, formatKm, haversineMeters, maneuverIcon, openTurnByTurn } from '@/hooks/maps';
import type { Delivery } from '@/hooks/rider-api';
import { useUnreadDeliveryMessages } from '@/hooks/use-delivery-chat';
import { useTurnByTurn } from '@/hooks/use-navigation';
import { Chat } from './chat';
import { ChatBadge } from './chat-badge';

const COLORS = {
  mapBg: '#f1f3f4',
  road: '#e0e0e0',
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
  surfaceContainerHighest: '#e3e2e2',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  primaryContainer: '#fbd103',
  outlineVariant: '#d0c6ab',
};

type PickupNavigationProps = {
  onArrived: () => void;
  onBack: () => void;
  delivery?: Delivery | null;
  riderCoords?: { lat: number; lng: number } | null;
  onCancel?: () => void;
};

// Riders may cancel a freshly accepted job only within this grace window.
const CANCEL_GRACE_SECONDS = 60;

export function PickupNavigation({ onArrived, onBack, delivery, riderCoords, onCancel }: PickupNavigationProps) {
  const insets = useSafeAreaInsets();
  const [chatOpen, setChatOpen] = useState(false);
  const { unread, markRead } = useUnreadDeliveryMessages(delivery?.id ?? null, 'rider');

  const openChat = () => {
    markRead();
    setChatOpen(true);
  };
  const closeChat = () => {
    markRead();
    setChatOpen(false);
  };

  // Countdown for the 1-minute cancellation grace period.
  const acceptedAt = delivery?.accepted_at ?? null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!acceptedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [acceptedAt]);

  const graceRemaining = acceptedAt
    ? Math.max(0, CANCEL_GRACE_SECONDS - Math.floor((now - new Date(acceptedAt).getTime()) / 1000))
    : 0;
  const canCancel = !!onCancel && !!acceptedAt && graceRemaining > 0;

  const pickup = delivery ? { lat: delivery.pickup_lat, lng: delivery.pickup_lng } : null;
  const pickupAddress = delivery?.pickup_address ?? 'Pickup location';
  const senderName = delivery?.sender_name ?? delivery?.users?.full_name ?? 'Customer';
  const customerName = delivery?.users?.full_name ?? senderName;
  const senderPhone = delivery?.sender_phone ?? delivery?.users?.phone_number ?? null;
  const pickupNotes = delivery?.pickup_notes?.trim() || null;
  const toPickup = pickup && riderCoords ? haversineMeters(riderCoords, pickup) : null;

  // Live in-app turn-by-turn driven by the rider's GPS.
  const nav = useTurnByTurn(riderCoords ?? null, pickup);
  const navTitle = nav.currentStep?.instruction ?? 'Navigate to pickup';
  const navDistance =
    nav.distanceToManeuver != null ? formatKm(nav.distanceToManeuver) : pickupAddress;
  const etaLabel =
    nav.remainingSeconds != null ? formatDuration(nav.remainingSeconds) : estimateMinutes(toPickup);
  const distLabel = nav.remainingMeters != null ? formatKm(nav.remainingMeters) : formatKm(toPickup);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Live map */}
      <View style={styles.map}>
        {pickup ? (
          <RouteMap
            origin={riderCoords ?? null}
            destination={pickup}
            routeOverride={nav.polyline}
            navigation
            style={StyleSheet.absoluteFill}
            originLabel="You"
            destinationLabel="Pickup"
          />
        ) : null}
      </View>

      {/* Top navigation */}
      <View style={[styles.topSection, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={22} color={COLORS.onSurface} />
        </Pressable>

        <Pressable
          style={styles.instructionCard}
          onPress={() => pickup && openTurnByTurn(pickup, pickupAddress)}
          accessibilityRole="button"
          accessibilityLabel="Open turn-by-turn navigation">
          <View style={styles.instructionIcon}>
            <MaterialIcons
              name={maneuverIcon(nav.currentStep?.maneuver ?? null) as any}
              size={32}
              color={COLORS.onSurface}
            />
          </View>
          <View style={styles.instructionText}>
            <Text style={styles.instructionTitle} numberOfLines={2}>{navTitle}</Text>
            <Text style={styles.instructionSubtitle} numberOfLines={1}>
              {navDistance}
            </Text>
          </View>
          <MaterialIcons name="open-in-new" size={20} color={COLORS.onSurfaceVariant} />
        </Pressable>

        <View style={styles.statusPill}>
          <Text style={styles.statusText}>
            {etaLabel} • {distLabel}
          </Text>
        </View>
      </View>

      {/* Bottom pickup sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />

        <View style={styles.customerRow}>
          <View style={styles.customerInfo}>
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialIcons name="person" size={34} color={COLORS.onSurfaceVariant} />
            </View>
            <View style={styles.customerText}>
              <Text style={styles.customerName}>{senderName}</Text>
              <Text style={styles.customerMeta} numberOfLines={1}>
                Pickup · {pickupAddress}
              </Text>
              {senderPhone ? (
                <Text style={styles.customerMeta} numberOfLines={1}>{senderPhone}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => senderPhone && Linking.openURL(`tel:${senderPhone}`)}
              disabled={!senderPhone}
              style={[styles.actionBtn, !senderPhone && styles.actionBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Call">
              <MaterialIcons name="call" size={22} color={COLORS.onSurface} />
            </Pressable>
            <Pressable
              onPress={() => delivery?.id && openChat()}
              disabled={!delivery?.id}
              style={[styles.actionBtn, !delivery?.id && styles.actionBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Message">
              <MaterialIcons name="chat-bubble-outline" size={22} color={COLORS.onSurface} />
              <ChatBadge count={unread} />
            </Pressable>
          </View>
        </View>

        {pickupNotes ? (
          <View style={styles.notesCard}>
            <MaterialIcons name="sticky-note-2" size={18} color={COLORS.onSurfaceVariant} />
            <Text style={styles.notesText}>{pickupNotes}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onArrived}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Arrived at pickup</Text>
          <MaterialIcons name="arrow-forward" size={22} color="#000000" />
        </Pressable>

        {canCancel ? (
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Cancel job">
            <MaterialIcons name="close" size={18} color={COLORS.onSurface} />
            <Text style={styles.cancelText}>Cancel job ({graceRemaining}s)</Text>
          </Pressable>
        ) : acceptedAt ? (
          <Text style={styles.cancelLocked}>Cancellation window closed</Text>
        ) : null}
      </View>

      {chatOpen ? (
        <Chat deliveryId={delivery?.id ?? null} name={customerName} onBack={closeChat} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.mapBg,
    zIndex: 1700,
  },
  map: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.mapBg },
  topSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    top: '100%',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  instructionCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  instructionIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  instructionText: { flex: 1 },
  instructionTitle: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: COLORS.onSurface },
  instructionSubtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 2 },
  statusPill: {
    backgroundColor: COLORS.onSurface,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  statusText: { fontSize: 16, fontWeight: '600', color: COLORS.surface },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceLowest,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignSelf: 'center',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerText: { flex: 1 },
  customerName: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: COLORS.onSurface },
  customerMeta: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  actionBtnDisabled: { opacity: 0.4 },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  notesText: { flex: 1, fontSize: 14, color: COLORS.onSurface, lineHeight: 20 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#000000' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  cancelBtnPressed: { opacity: 0.85 },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  cancelLocked: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
});
