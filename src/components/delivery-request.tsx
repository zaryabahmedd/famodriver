import { estimateMinutes, formatKm, formatPrice, haversineMeters, type LatLng } from '@/hooks/maps';
import { formatPackageCategory, type Delivery, type DeliveryOffer } from '@/hooks/rider-api';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { DeclineJob } from './decline-job';
import { RouteMap } from './route-map';

const COLORS = {
  surface: '#fbf9f9',
  surfaceContainerLow: '#f5f3f3',
  surfaceContainerHighest: '#e3e2e2',
  surfaceDim: '#dbdad9',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  onBackground: '#1b1c1c',
  secondary: '#5e5e5e',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  track: '#efeded',
  mapBg: '#f3f4f6',
};

const TOTAL_SECONDS = 35;

type DeliveryRequestProps = {
  onAccept: () => void;
  onDecline: () => void;
  offer?: DeliveryOffer | null;
  delivery?: Delivery | null;
};

export function DeliveryRequest({ onAccept, onDecline, offer, delivery }: DeliveryRequestProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Responsive scaling so the sheet fits small and large phones alike.
  const compact = height < 720 || width < 360;
  const ringSize = Math.round(Math.min(168, Math.max(120, width * 0.42)));
  const ringStroke = compact ? 7 : 8;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const deadline = useMemo(
    () => (offer ? new Date(offer.expires_at).getTime() : Date.now() + TOTAL_SECONDS * 1000),
    [offer],
  );
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.min(TOTAL_SECONDS, Math.round((deadline - Date.now()) / 1000))),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const pickup = delivery?.pickup_address ?? 'Pickup point';
  const dropoff = delivery?.dropoff_address ?? 'Drop-off point';
  const pickupCoord: LatLng | null =
    delivery != null && Number.isFinite(delivery.pickup_lat) && Number.isFinite(delivery.pickup_lng)
      ? { lat: delivery.pickup_lat, lng: delivery.pickup_lng }
      : null;
  const dropoffCoord: LatLng | null =
    delivery != null && Number.isFinite(delivery.dropoff_lat) && Number.isFinite(delivery.dropoff_lng)
      ? { lat: delivery.dropoff_lat, lng: delivery.dropoff_lng }
      : null;
  const dropMeters =
    delivery != null
      ? haversineMeters(
          { lat: delivery.pickup_lat, lng: delivery.pickup_lng },
          { lat: delivery.dropoff_lat, lng: delivery.dropoff_lng },
        )
      : null;
  const awayMeters = offer?.distance_meters ?? null;
  const earnings = formatPrice(delivery?.price);
  const categoryLabel = formatPackageCategory(delivery?.package_category);
  const parcelLabel =
    categoryLabel ?? (delivery?.weight != null ? `${delivery.weight} kg` : 'Parcel');
  const chips: { icon?: 'inventory-2' | 'straighten' | 'scale'; label: string }[] = [
    { icon: 'inventory-2', label: parcelLabel },
    ...(categoryLabel && delivery?.weight != null
      ? [{ icon: 'scale' as const, label: `${delivery.weight} kg` }]
      : []),
    { label: formatKm(dropMeters) },
    { label: estimateMinutes(dropMeters) },
  ];

  const SHEET_DRAG = 300;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => {
        let next = lastOffset.current + g.dy;
        if (next < 0) next = 0;
        if (next > SHEET_DRAG) next = SHEET_DRAG;
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const next = lastOffset.current + g.dy;
        const target = next > SHEET_DRAG / 2 ? SHEET_DRAG : 0;
        lastOffset.current = target;
        Animated.spring(translateY, {
          toValue: target,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (confirmOpen) return;
    if (seconds <= 0) {
      onDecline();
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, onDecline, confirmOpen]);

  const dashOffset =
    ringCircumference - (Math.min(seconds, TOTAL_SECONDS) / TOTAL_SECONDS) * ringCircumference;

  return (
    <View style={styles.root}>
      {/* Live Google Maps preview: pickup -> drop-off with driving polyline. */}
      <View style={styles.map}>
        {pickupCoord && dropoffCoord ? (
          <RouteMap
            origin={null}
            via={pickupCoord}
            destination={dropoffCoord}
            originLabel="Pickup"
            destinationLabel="Drop-off"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.mapFallback}>
            <MaterialIcons name="map" size={40} color={COLORS.outline} />
            <Text style={styles.mapFallbackText}>Loading route…</Text>
          </View>
        )}
        {pickupCoord && dropoffCoord ? (
          <View style={[styles.mapLegend, { top: insets.top + 12 }]} pointerEvents="none">
            <View style={styles.mapLegendRow}>
              <View style={[styles.mapLegendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.mapLegendText} numberOfLines={1}>{pickup}</Text>
            </View>
            <View style={styles.mapLegendRow}>
              <View style={[styles.mapLegendDot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.mapLegendText} numberOfLines={1}>{dropoff}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Bottom sheet */}
      <Animated.View
        style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY }] }]}>
        <View style={styles.handleZone} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.sheetContent, compact && styles.sheetContentCompact]}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <MaterialIcons name="electric-bike" size={32} color={COLORS.onPrimaryContainer} />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>New delivery request</Text>
              <Text style={styles.bannerSubtitle} numberOfLines={1}>
                {pickup} → {dropoff}
              </Text>
            </View>
          </View>

          {/* Timer ring + earnings */}
          <View style={[styles.ringWrap, { width: ringSize, height: ringSize }]}>
            <Svg width={ringSize} height={ringSize} style={styles.ringSvg}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                stroke={COLORS.track}
                strokeWidth={ringStroke}
                fill="none"
              />
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                stroke={COLORS.primary}
                strokeWidth={ringStroke}
                fill="none"
                strokeDasharray={ringCircumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[styles.earnings, compact && styles.earningsCompact]} numberOfLines={1}>
                {earnings}
              </Text>
              <Text style={styles.timerText}>{seconds}s</Text>
            </View>
          </View>

          {/* Route */}
          <View style={styles.route}>
            <View style={styles.routeRight}>
              <Text style={styles.routePlace} numberOfLines={1}>
                {pickup}
              </Text>
              <Text style={styles.routeMeta}>{formatKm(awayMeters)} away</Text>
            </View>
            <View style={styles.routeLine}>
              <View style={styles.routeDotStart} />
              <View style={styles.routeDash} />
              <View style={styles.routeDotEnd} />
            </View>
            <View style={styles.routeRight}>
              <Text style={styles.routePlace} numberOfLines={1}>
                {dropoff}
              </Text>
              <Text style={styles.routeMeta}>{formatKm(dropMeters)} drop</Text>
            </View>
          </View>

          {/* Chips */}
          <View style={styles.chips}>
            {chips.map((c) => (
              <View key={c.label} style={styles.chip}>
                {c.icon ? (
                  <MaterialIcons name={c.icon} size={18} color={COLORS.onSurface} />
                ) : null}
                <Text style={styles.chipText}>{c.label}</Text>
              </View>
            ))}
          </View>

          {/* Instructions from the customer */}
          {delivery?.special_instructions ? (
            <View style={styles.instructionsCard}>
              <MaterialIcons name="sticky-note-2" size={16} color={COLORS.onSurfaceVariant} />
              <Text style={styles.instructionsText}>{delivery.special_instructions}</Text>
            </View>
          ) : null}

          {/* CTAs */}
          <View style={styles.ctaRow}>
            <Pressable
              onPress={() => setConfirmOpen(true)}
              style={({ pressed }) => [styles.declineBtn, pressed && styles.pressed]}
              accessibilityRole="button">
              <Text style={[styles.declineText, compact && styles.ctaTextCompact]} numberOfLines={1}>
                Decline
              </Text>
            </Pressable>
            <Pressable
              onPress={onAccept}
              style={({ pressed }) => [styles.acceptBtn, pressed && styles.pressed]}
              accessibilityRole="button">
              <Text style={[styles.acceptText, compact && styles.ctaTextCompact]} numberOfLines={1}>
                Accept
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>

      {confirmOpen ? (
        <DeclineJob onConfirm={onDecline} onCancel={() => setConfirmOpen(false)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.onBackground,
    zIndex: 1600,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: COLORS.mapBg,
  },
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.mapBg,
  },
  mapFallbackText: { fontSize: 13, fontWeight: '600', color: COLORS.outline },
  mapLegend: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  mapLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapLegendDot: { width: 10, height: 10, borderRadius: 5 },
  mapLegendText: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.onSurface },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '72%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
    paddingTop: 12,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  handleZone: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 16,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  sheetContent: { paddingHorizontal: 24, paddingBottom: 8, gap: 24, width: '100%' },
  sheetContentCompact: { gap: 16, paddingHorizontal: 16 },
  scroll: { alignSelf: 'stretch', width: '100%' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  bannerIcon: {
    width: 64,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: COLORS.onSurface },
  bannerSubtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 2 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  ringSvg: {},
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  earnings: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: COLORS.onBackground,
  },
  earningsCompact: { fontSize: 22, lineHeight: 26 },
  timerText: { fontSize: 16, fontWeight: '600', color: COLORS.secondary },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  routeRight: { alignItems: 'flex-end', flexShrink: 1, maxWidth: '40%' },
  routePlace: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  routeMeta: { fontSize: 14, color: COLORS.onSurfaceVariant },
  routeLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    opacity: 0.4,
  },
  routeDotStart: { width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: COLORS.primary },
  routeDash: { flex: 1, height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: COLORS.outline },
  routeDotEnd: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.onBackground },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  chipText: { fontSize: 14, fontWeight: '500', color: COLORS.onSurface },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  instructionsText: { flex: 1, fontSize: 14, color: COLORS.onSurface, lineHeight: 20 },
  ctaRow: { flexDirection: 'row', gap: 12 },
  declineBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
  },
  declineText: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  acceptBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
  },
  acceptText: { fontSize: 18, fontWeight: '700', color: COLORS.onPrimaryContainer },
  ctaTextCompact: { fontSize: 16 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
