import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notifications } from './notifications';
import { Sidebar } from './sidebar';
import { sidebarNavigate } from './sidebar-nav';

const COLORS = {
  background: '#fbf9f9',
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
  surfaceContainer: '#efeded',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  surfaceVariant: '#e3e2e2',
  secondary: '#5e5e5e',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  error: '#ba1a1a',
  positive: '#4CAF50',
};

const RANGES = ['Day', 'Week', 'Month'] as const;
type Range = (typeof RANGES)[number];

const BARS = [
  { day: 'M', height: 0.5, highlight: false },
  { day: 'T', height: 0.7, highlight: false },
  { day: 'W', height: 0.4, highlight: false },
  { day: 'T', height: 0.8, highlight: false },
  { day: 'F', height: 0.6, highlight: false },
  { day: 'S', height: 0.95, highlight: true },
  { day: 'S', height: 0.75, highlight: false },
];

const METRICS = [
  { label: 'Trips', value: '34' },
  { label: 'Online', value: '22h' },
  { label: 'Avg Fare', value: '₦410' },
];

export function Earnings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [range, setRange] = useState<Range>('Week');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top app bar */}
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => setMenuOpen(true)} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Menu">
          <MaterialIcons name="menu" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.brand}>FAMMO</Text>
        <Pressable onPress={() => setNotificationsOpen(true)} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Notifications">
          <MaterialIcons name="notifications" size={24} color={COLORS.onSurface} />
          <View style={styles.badge} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Earnings hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Current Earnings</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroValue}>₦2,450</Text>
            <View style={styles.trendPill}>
              <MaterialIcons name="trending-up" size={14} color={COLORS.positive} />
              <Text style={styles.trendText}>+18%</Text>
            </View>
          </View>
          <Text style={styles.heroDate}>Today, Oct 24th</Text>
        </View>

        {/* Segmented control */}
        <View style={styles.segment}>
          {RANGES.map((r) => {
            const active = r === range;
            return (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{r}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Bar chart */}
        <View style={styles.chart}>
          <View style={styles.bars}>
            {BARS.map((bar, idx) => (
              <View key={idx} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    { height: `${bar.height * 100}%` },
                    bar.highlight && styles.barHighlight,
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.barLabels}>
            {BARS.map((bar, idx) => (
              <Text
                key={idx}
                style={[styles.barLabel, bar.highlight && styles.barLabelActive]}>
                {bar.day}
              </Text>
            ))}
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          {METRICS.map((m) => (
            <View key={m.label} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
            </View>
          ))}
        </View>

        {/* Cash out */}
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Cash Out</Text>
          <MaterialIcons name="arrow-forward" size={22} color="#000000" />
        </Pressable>
      </ScrollView>

      {menuOpen ? (
        <Sidebar
          onClose={() => setMenuOpen(false)}
          onNavigate={(label) => sidebarNavigate(router, label)}
        />
      ) : null}
      {notificationsOpen ? <Notifications onBack={() => setNotificationsOpen(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 18, fontWeight: '800', letterSpacing: 1, color: COLORS.onSurface },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: COLORS.onSurface,
    borderRadius: 16,
    padding: 28,
    gap: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.surfaceVariant,
    opacity: 0.7,
  },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heroValue: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.primaryContainer,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  trendText: { fontSize: 12, fontWeight: '600', color: COLORS.positive },
  heroDate: { marginTop: 12, fontSize: 13, fontWeight: '500', color: COLORS.surfaceVariant, opacity: 0.6 },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 8,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primaryContainer,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  segmentText: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant },
  segmentTextActive: { color: '#000000', fontWeight: '700' },
  chart: { paddingVertical: 8 },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 128,
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: {
    width: 6,
    borderRadius: 9999,
    backgroundColor: COLORS.primaryContainer,
  },
  barHighlight: { backgroundColor: COLORS.onSurface },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  barLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.outline,
  },
  barLabelActive: { color: COLORS.onSurface, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', gap: 16, marginTop: 16, marginBottom: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.outline,
  },
  metricValue: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ctaPressed: { opacity: 0.95, transform: [{ scale: 0.98 }] },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#000000' },
});
