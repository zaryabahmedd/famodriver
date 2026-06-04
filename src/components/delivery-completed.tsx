import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { calculateFare, estimateMinutes, formatKm, formatPrice, haversineMeters } from '@/hooks/maps';
import type { Delivery } from '@/hooks/rider-api';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
  surfaceContainer: '#efeded',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  outlineVariant: '#d0c6ab',
};

type DeliveryCompletedProps = {
  onHome: () => void;
  onBack: () => void;
  delivery?: Delivery | null;
};

export function DeliveryCompleted({ onHome, onBack, delivery }: DeliveryCompletedProps) {
  const insets = useSafeAreaInsets();
  const distanceMeters =
    delivery != null
      ? haversineMeters(
          { lat: delivery.pickup_lat, lng: delivery.pickup_lng },
          { lat: delivery.dropoff_lat, lng: delivery.dropoff_lng },
        )
      : null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={22} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.brand}>FAMMO</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Success icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconGlow} />
          <View style={styles.iconCircle}>
            <MaterialIcons name="check" size={64} color={COLORS.onSurface} />
          </View>
        </View>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Delivery completed!</Text>
          <Text style={styles.subtitle}>Great job! You&apos;ve finished this trip.</Text>
        </View>

        {/* Earnings card */}
        <View style={styles.earningsCard}>
          <View style={styles.accent} />
          <Text style={styles.earnedLabel}>You earned</Text>
          <Text style={styles.earnedValue}>{formatPrice(calculateFare(distanceMeters) ?? delivery?.price)}</Text>
        </View>

        {/* Summary bento */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>{formatKm(distanceMeters)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>{estimateMinutes(distanceMeters)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          onPress={onHome}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Back to home</Text>
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
    backgroundColor: COLORS.surface,
    zIndex: 1800,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  brand: { fontSize: 18, fontWeight: '800', letterSpacing: 1, color: COLORS.onSurface },
  spacer: { width: 40 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 32,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  iconGlow: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(251,209,3,0.18)',
  },
  iconCircle: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(27,28,28,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heading: { alignItems: 'center', gap: 8 },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  subtitle: { fontSize: 16, lineHeight: 24, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  earningsCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 48,
    height: 48,
    backgroundColor: 'rgba(251,209,3,0.3)',
    transform: [{ rotate: '45deg' }],
  },
  earnedLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  earnedValue: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: COLORS.onSurface },
  tipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: COLORS.surfaceContainer,
  },
  tipText: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  summaryRow: { flexDirection: 'row', gap: 16, width: '100%' },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  summaryLabel: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant },
  summaryValue: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: COLORS.onSurface },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
    shadowColor: COLORS.primaryContainer,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaPressed: { opacity: 0.95, transform: [{ scale: 0.97 }] },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#000000' },
});
