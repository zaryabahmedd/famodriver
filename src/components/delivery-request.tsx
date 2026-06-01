import { estimateMinutes, formatKm, formatPrice, haversineMeters } from '@/hooks/maps';
import type { Delivery, DeliveryOffer } from '@/hooks/rider-api';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { DeclineJob } from './decline-job';

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

const PARCEL_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAzZG2Adh5_IBWt-HEP9k1oPXDRBhTl5LMN-uG9pvH94JlVIMib8F9B-P_6aTfc5qQzkUBtVt2hboCcZ2S-I01SYapOu_oAP9vIhCfeJDpnYldQdR5pgLbbxyrZd-vqPHD-WCzz1QPCPJl-E513g5-uS22SAocud2B4LlrsFgzRcPmyK_RY75AqrH7ORvIZO7B_INbBKE5VPQJoA3Jzl0227Q2ZvqJYbY0pA6Vrdg84SY7OMWZMReAaK4H2DfATGLS8QnIBNuZMOTA';

const RING_RADIUS = 70;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const TOTAL_SECONDS = 35;

type DeliveryRequestProps = {
  onAccept: () => void;
  onDecline: () => void;
  offer?: DeliveryOffer | null;
  delivery?: Delivery | null;
};

export function DeliveryRequest({ onAccept, onDecline, offer, delivery }: DeliveryRequestProps) {
  const insets = useSafeAreaInsets();
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
  const dropMeters =
    delivery != null
      ? haversineMeters(
          { lat: delivery.pickup_lat, lng: delivery.pickup_lng },
          { lat: delivery.dropoff_lat, lng: delivery.dropoff_lng },
        )
      : null;
  const awayMeters = offer?.distance_meters ?? null;
  const earnings = formatPrice(delivery?.price);
  const chips = [
    { icon: 'inventory-2' as const, label: delivery?.weight != null ? `${delivery.weight} kg` : 'Parcel' },
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
    RING_CIRCUMFERENCE - (Math.min(seconds, TOTAL_SECONDS) / TOTAL_SECONDS) * RING_CIRCUMFERENCE;

  return (
    <View style={styles.root}>
      {/* Map */}
      <View style={[styles.map, { paddingTop: insets.top }]}>
        <Svg width="100%" height="100%" viewBox="0 0 400 400">
          <Path
            d="M60 320C120 280 180 340 240 280C280 240 320 220 340 160"
            stroke={COLORS.primaryContainer}
            strokeWidth={6}
            strokeDasharray="8,8"
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={60} cy={320} r={12} fill="white" stroke="#000" strokeWidth={2} />
          <Circle cx={60} cy={320} r={5} fill={COLORS.primaryContainer} />
          <Circle cx={340} cy={160} r={12} fill="white" stroke="#000" strokeWidth={2} />
          <Circle cx={340} cy={160} r={5} fill="#000" />
        </Svg>
        <View style={[styles.mapLabel, { top: insets.top + 120 }]}>
          <View style={styles.mapLabelDot} />
          <Text style={styles.mapLabelText}>DHA PHASE 5</Text>
        </View>
      </View>

      {/* Bottom sheet */}
      <Animated.View
        style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY }] }]}>
        <View style={styles.handleZone} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>

        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* Banner */}
          <View style={styles.banner}>
            <Image source={{ uri: PARCEL_URI }} style={styles.bannerImg} contentFit="cover" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>New delivery request</Text>
              <Text style={styles.bannerSubtitle} numberOfLines={1}>
                {pickup} → {dropoff}
              </Text>
            </View>
          </View>

          {/* Timer ring + earnings */}
          <View style={styles.ringWrap}>
            <Svg width={160} height={160} style={styles.ringSvg}>
              <Circle
                cx={80}
                cy={80}
                r={RING_RADIUS}
                stroke={COLORS.track}
                strokeWidth={8}
                fill="none"
              />
              <Circle
                cx={80}
                cy={80}
                r={RING_RADIUS}
                stroke={COLORS.primary}
                strokeWidth={8}
                fill="none"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={styles.earnings}>{earnings}</Text>
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

          {/* CTAs */}
          <View style={styles.ctaRow}>
            <Pressable
              onPress={() => setConfirmOpen(true)}
              style={({ pressed }) => [styles.declineBtn, pressed && styles.pressed]}
              accessibilityRole="button">
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
            <Pressable
              onPress={onAccept}
              style={({ pressed }) => [styles.acceptBtn, pressed && styles.pressed]}
              accessibilityRole="button">
              <Text style={styles.acceptText}>Accept</Text>
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
  mapLabel: {
    position: 'absolute',
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  mapLabelDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primaryContainer },
  mapLabelText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: COLORS.onSurface },
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
  bannerImg: { width: 64, height: 48, borderRadius: 8, backgroundColor: COLORS.surfaceDim },
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
  timerText: { fontSize: 16, fontWeight: '600', color: COLORS.secondary },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  routeRight: { alignItems: 'flex-end' },
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
  ctaRow: { flexDirection: 'row', gap: 16 },
  declineBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
  },
  declineText: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  acceptBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
  },
  acceptText: { fontSize: 20, fontWeight: '700', color: COLORS.onPrimaryContainer },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
