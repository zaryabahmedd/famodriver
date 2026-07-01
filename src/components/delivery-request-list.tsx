import { estimateMinutes, formatKm, formatPrice, haversineMeters } from '@/hooks/maps';
import { formatPackageCategory, type Delivery, type DeliveryOffer } from '@/hooks/rider-api';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  secondary: '#5e5e5e',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  danger: '#ba1a1a',
  scrim: 'rgba(20,20,20,0.55)',
};

export type DeliveryRequestListItem = {
  offer: DeliveryOffer;
  delivery: Delivery | null;
};

type Props = {
  offers: DeliveryRequestListItem[];
  onAccept: (offerId: string) => void;
  onDecline: (offerId: string) => void;
  busy?: boolean;
};

/** Live seconds remaining until an offer expires, ticking once per second. */
function useCountdown(expiresAt: string): number {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return seconds;
}

function RequestCard({
  item,
  compact,
  busy,
  onAccept,
  onDecline,
}: {
  item: DeliveryRequestListItem;
  compact: boolean;
  busy: boolean;
  onAccept: (offerId: string) => void;
  onDecline: (offerId: string) => void;
}) {
  const { offer, delivery } = item;
  const seconds = useCountdown(offer.expires_at);
  const expired = seconds <= 0;

  // Auto-dismiss once the offer's window closes.
  useEffect(() => {
    if (expired) onDecline(offer.id);
  }, [expired, offer.id, onDecline]);

  const pickup = delivery?.pickup_address ?? 'Pickup point';
  const dropoff = delivery?.dropoff_address ?? 'Drop-off point';
  const dropMeters =
    delivery != null &&
    Number.isFinite(delivery.pickup_lat) &&
    Number.isFinite(delivery.dropoff_lat)
      ? haversineMeters(
          { lat: delivery.pickup_lat, lng: delivery.pickup_lng },
          { lat: delivery.dropoff_lat, lng: delivery.dropoff_lng },
        )
      : null;
  const awayMeters = offer.distance_meters ?? null;
  const categoryLabel = formatPackageCategory(delivery?.package_category);
  const parcelLabel =
    categoryLabel ?? (delivery?.weight != null ? `${delivery.weight} kg` : 'Parcel');

  const urgent = seconds <= 10;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {/* Price + countdown */}
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.priceLabel}>You earn</Text>
          <Text style={[styles.price, compact && styles.priceCompact]} numberOfLines={1}>
            {formatPrice(delivery?.price)}
          </Text>
        </View>
        <View style={[styles.timerPill, urgent && styles.timerPillUrgent]}>
          <MaterialIcons name="schedule" size={14} color={urgent ? '#ffffff' : COLORS.onPrimaryContainer} />
          <Text style={[styles.timerText, urgent && styles.timerTextUrgent]}>{seconds}s</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.route}>
        <View style={styles.routeRow}>
          <View style={styles.dotStart} />
          <Text style={styles.routePlace} numberOfLines={1}>{pickup}</Text>
        </View>
        <View style={styles.routeConnector} />
        <View style={styles.routeRow}>
          <View style={styles.dotEnd} />
          <Text style={styles.routePlace} numberOfLines={1}>{dropoff}</Text>
        </View>
      </View>

      {/* Meta chips */}
      <View style={styles.chips}>
        <View style={styles.chip}>
          <MaterialIcons name="inventory-2" size={14} color={COLORS.onSurface} />
          <Text style={styles.chipText}>{parcelLabel}</Text>
        </View>
        <View style={styles.chip}>
          <MaterialIcons name="straighten" size={14} color={COLORS.onSurface} />
          <Text style={styles.chipText}>{formatKm(dropMeters)} drop</Text>
        </View>
        <View style={styles.chip}>
          <MaterialIcons name="schedule" size={14} color={COLORS.onSurface} />
          <Text style={styles.chipText}>{estimateMinutes(dropMeters)}</Text>
        </View>
        {awayMeters != null ? (
          <View style={styles.chip}>
            <MaterialIcons name="near-me" size={14} color={COLORS.onSurface} />
            <Text style={styles.chipText}>{formatKm(awayMeters)} away</Text>
          </View>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => onDecline(offer.id)}
          disabled={busy}
          style={({ pressed }) => [styles.declineBtn, pressed && styles.pressed, busy && styles.disabled]}
          accessibilityRole="button">
          <Text style={styles.declineText}>Decline</Text>
        </Pressable>
        <Pressable
          onPress={() => onAccept(offer.id)}
          disabled={busy || expired}
          style={({ pressed }) => [
            styles.acceptBtn,
            pressed && styles.pressed,
            (busy || expired) && styles.disabled,
          ]}
          accessibilityRole="button">
          <Text style={styles.acceptText}>{expired ? 'Expired' : 'Accept'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Full-screen overlay shown when a rider has 2+ live offers at once. Lists every
 * incoming request as a compact, responsive card so the rider can pick any one.
 */
export function DeliveryRequestList({ offers, onAccept, onDecline, busy = false }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = height < 720 || width < 360;

  return (
    <View style={styles.root}>
      <View style={[styles.sheet, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <MaterialIcons name="bolt" size={18} color={COLORS.onPrimaryContainer} />
            <Text style={styles.headerBadgeText}>{offers.length}</Text>
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>New delivery requests</Text>
            <Text style={styles.headerSubtitle}>Pick the one you want — the rest stay available to others.</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {offers.map((item) => (
            <RequestCard
              key={item.offer.id}
              item={item}
              compact={compact}
              busy={busy}
              onAccept={onAccept}
              onDecline={onDecline}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.scrim,
    zIndex: 1600,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer,
  },
  headerBadgeText: { fontSize: 18, fontWeight: '800', color: COLORS.onPrimaryContainer },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  headerSubtitle: { fontSize: 13, color: COLORS.onSurfaceVariant, marginTop: 2 },
  scroll: { alignSelf: 'stretch' },
  scrollContent: { gap: 14, paddingBottom: 8 },
  card: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardCompact: { padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
  },
  price: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, color: COLORS.onSurface },
  priceCompact: { fontSize: 24 },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: 'rgba(251,209,3,0.22)',
  },
  timerPillUrgent: { backgroundColor: COLORS.danger },
  timerText: { fontSize: 14, fontWeight: '800', color: COLORS.onPrimaryContainer },
  timerTextUrgent: { color: '#ffffff' },
  route: { gap: 6 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dotStart: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: COLORS.primary },
  dotEnd: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.onSurface },
  routeConnector: {
    width: 2,
    height: 14,
    marginLeft: 4,
    backgroundColor: COLORS.outlineVariant,
  },
  routePlace: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.onSurface },
  actions: { flexDirection: 'row', gap: 12, marginTop: 2 },
  declineBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
  },
  declineText: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  acceptBtn: {
    flex: 1.4,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
  },
  acceptText: { fontSize: 16, fontWeight: '700', color: COLORS.onPrimaryContainer },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
