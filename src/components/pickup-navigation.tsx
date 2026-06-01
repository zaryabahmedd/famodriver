import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RouteMap } from '@/components/route-map';
import { estimateMinutes, formatKm, haversineMeters, openTurnByTurn } from '@/hooks/maps';
import type { Delivery } from '@/hooks/rider-api';

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

const AVATAR_URI =
  'https://lh3.googleusercontent.com/aida/ADBb0uhpzp48WLEOBto34O_YvDuH_HO-sbuCTeRtDvJJASI2tAqxlhrG3BRdIUGbvPPT7goqnUf0sEmcj0uCLtu04Q4CeMFGP55uQj1NQpJ0E9jX2gakN5UbtXTO5aN9HckrZAmBcsnk0HViYDuOM-S2mR4uI2eDYyHROorcUj2vIdmC1dIIfpn-pfK3BumTGuK1LT6hQBbY-ri4p_-WUABuOJB6L1jQp4upa5Yn-e8b08MEUBYEONrHGH1RfA4';

type PickupNavigationProps = {
  onArrived: () => void;
  onBack: () => void;
  delivery?: Delivery | null;
  riderCoords?: { lat: number; lng: number } | null;
};

export function PickupNavigation({ onArrived, onBack, delivery, riderCoords }: PickupNavigationProps) {
  const insets = useSafeAreaInsets();

  const pickup = delivery ? { lat: delivery.pickup_lat, lng: delivery.pickup_lng } : null;
  const pickupAddress = delivery?.pickup_address ?? 'Pickup location';
  const customerName = delivery?.users?.full_name ?? 'Customer';
  const toPickup = pickup && riderCoords ? haversineMeters(riderCoords, pickup) : null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Live map */}
      <View style={styles.map}>
        {pickup ? (
          <RouteMap
            origin={riderCoords ?? null}
            destination={pickup}
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
            <MaterialIcons name="navigation" size={32} color={COLORS.onSurface} />
          </View>
          <View style={styles.instructionText}>
            <Text style={styles.instructionTitle}>Navigate to pickup</Text>
            <Text style={styles.instructionSubtitle} numberOfLines={1}>
              {pickupAddress}
            </Text>
          </View>
          <MaterialIcons name="open-in-new" size={20} color={COLORS.onSurfaceVariant} />
        </Pressable>

        <View style={styles.statusPill}>
          <Text style={styles.statusText}>
            {estimateMinutes(toPickup)} • {formatKm(toPickup)}
          </Text>
        </View>
      </View>

      {/* Bottom pickup sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />

        <View style={styles.customerRow}>
          <View style={styles.customerInfo}>
            <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" />
            <View style={styles.customerText}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.customerMeta} numberOfLines={1}>
                Pickup · {pickupAddress}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.actionBtn} accessibilityRole="button" accessibilityLabel="Call">
              <MaterialIcons name="call" size={22} color={COLORS.onSurface} />
            </Pressable>
            <Pressable style={styles.actionBtn} accessibilityRole="button" accessibilityLabel="Message">
              <MaterialIcons name="chat-bubble-outline" size={22} color={COLORS.onSurface} />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={onArrived}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Arrived at pickup</Text>
          <MaterialIcons name="arrow-forward" size={22} color="#000000" />
        </Pressable>
      </View>
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
});
