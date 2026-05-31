import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { CallScreen } from './call-screen';
import { Chat } from './chat';

const COLORS = {
  mapBg: '#fbf9f9',
  road: '#f0eeee',
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
  surfaceContainerHighest: '#e3e2e2',
  surfaceVariant: '#e3e2e2',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  secondary: '#5e5e5e',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outlineVariant: '#d0c6ab',
};

const AVATAR_URI =
  'https://lh3.googleusercontent.com/aida/ADBb0ujS-tqqpzwjlG_xyAfylS0Yyk_zz0sK0kL6VegDbOI3XKFds6mk57O17CBaGpgTrzNt5CMxP_qATmN2xUx31G2o6qrSrP3Joomsf15Zbvth4XYeHv-MUIvtOUtyNIQZmAxF4GXURmiZLfcfWCtG4XvMb9BIFZ7zlfDtqtEM-LJheTp0_C6K_zZb8B5fmdPgDpJHoQ8jXwObzByov9C4C96cy90E8nXrvgJ-TMYIESe6sjC_1DIkkxWmOZo';

type InTransitProps = {
  onArrived: () => void;
  onBack: () => void;
};

export function InTransit({ onArrived, onBack }: InTransitProps) {
  const insets = useSafeAreaInsets();
  const [chatOpen, setChatOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Map background */}
      <View style={styles.map} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
          <Path d="M-50 150 Q200 120 450 150" stroke={COLORS.road} strokeWidth={40} fill="none" />
          <Path d="M100 -50 L120 850" stroke={COLORS.road} strokeWidth={35} fill="none" />
          <Path d="M280 -50 L260 850" stroke={COLORS.road} strokeWidth={35} fill="none" />
          <Path
            d="M50 450 Q150 400 200 420 T350 250"
            stroke={COLORS.primaryContainer}
            strokeWidth={5}
            strokeDasharray="8,12"
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={50} cy={450} r={6} fill={COLORS.onSurface} />
          <Circle cx={50} cy={450} r={3} fill={COLORS.primaryContainer} />
          <Circle cx={350} cy={250} r={6} fill={COLORS.onSurface} />
          <Circle cx={350} cy={250} r={3} fill={COLORS.primaryContainer} />
        </Svg>
      </View>

      {/* Top navigation instruction card */}
      <View style={[styles.topSection, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={22} color={COLORS.onSurface} />
        </Pressable>

        <View style={styles.instructionCard}>
          <View style={styles.instructionIcon}>
            <MaterialIcons name="north" size={28} color={COLORS.onPrimaryContainer} />
          </View>
          <View style={styles.instructionText}>
            <Text style={styles.instructionTitle}>Continue 1.2 km</Text>
            <Text style={styles.instructionSubtitle}>Main Boulevard, Gulberg</Text>
          </View>
        </View>

        {/* Status chips */}
        <View style={styles.chips}>
          <View style={styles.etaPill}>
            <Text style={styles.etaText}>14 min</Text>
            <View style={styles.dot} />
            <Text style={styles.etaText}>10 km</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>In transit</Text>
          </View>
        </View>
      </View>

      {/* Bottom recipient sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />

        <View style={styles.customerRow}>
          <View style={styles.customerInfo}>
            <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" />
            <View style={styles.customerText}>
              <Text style={styles.customerName}>Sara Ali</Text>
              <Text style={styles.customerMeta}>Drop · MM Alam Road, Block C</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={() => setCallOpen(true)} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel="Call">
              <MaterialIcons name="call" size={22} color={COLORS.onSurface} />
            </Pressable>
            <Pressable onPress={() => setChatOpen(true)} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel="Message">
              <MaterialIcons name="chat-bubble-outline" size={22} color={COLORS.onSurface} />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={onArrived}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Arrived at drop-off</Text>
          <MaterialIcons name="arrow-forward" size={22} color="#000000" />
        </Pressable>
      </View>

      {chatOpen ? (
        <Chat
          onBack={() => setChatOpen(false)}
          onCall={() => {
            setChatOpen(false);
            setCallOpen(true);
          }}
        />
      ) : null}
      {callOpen ? <CallScreen onEnd={() => setCallOpen(false)} /> : null}
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
    gap: 12,
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
    gap: 20,
    padding: 20,
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
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  instructionText: { flex: 1 },
  instructionTitle: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: COLORS.onSurface },
  instructionSubtitle: { fontSize: 14, color: COLORS.secondary, marginTop: 2 },
  chips: { alignItems: 'center', gap: 12 },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.onSurface,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
  },
  etaText: { fontSize: 16, fontWeight: '700', color: COLORS.surfaceLowest },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryContainer,
  },
  statusBadge: {
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.onPrimaryContainer,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceLowest,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceVariant,
    alignSelf: 'center',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  customerText: { flex: 1 },
  customerName: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: COLORS.onSurface },
  customerMeta: { fontSize: 14, color: COLORS.secondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLowest,
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
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.95 }] },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#000000' },
});
