import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPrice, riderEarning } from '@/hooks/maps';
import { CompletedDelivery, useCompletedDeliveries } from '@/hooks/rider-delivery-history';
import { getStoredRiderId } from '@/hooks/rider-session';

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

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Inclusive start / exclusive end of the Nth period of `range` relative to now (offset 0 = current). */
function periodBounds(range: Range, offset: number): { start: Date; end: Date } {
  const now = new Date();
  if (range === 'Day') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + offset);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
  if (range === 'Week') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay() + offset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { start, end };
}

function deliveriesInWindow(deliveries: CompletedDelivery[], start: Date, end: Date): CompletedDelivery[] {
  return deliveries.filter((d) => {
    const t = new Date(d.completed_at).getTime();
    return t >= start.getTime() && t < end.getTime();
  });
}

function totalRiderEarnings(deliveries: CompletedDelivery[]): number {
  return deliveries.reduce((sum, d) => sum + riderEarning(d.price), 0);
}

function rangeDateLabel(range: Range): string {
  const now = new Date();
  if (range === 'Day') {
    const day = now.getDate();
    const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
    return `Today, ${MONTH_NAMES[now.getMonth()]} ${day}${suffix}`;
  }
  if (range === 'Week') return 'This week';
  return MONTH_NAMES[now.getMonth()];
}

type Bar = { day: string; height: number; highlight: boolean };

/** Last 7 days of rider earnings (today included), used to draw the bar chart regardless of selected range. */
function lastSevenDaysBars(deliveries: CompletedDelivery[]): Bar[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { date: Date; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push({ date, total: 0 });
  }
  for (const delivery of deliveries) {
    const completed = new Date(delivery.completed_at);
    completed.setHours(0, 0, 0, 0);
    const bucket = days.find((d) => d.date.getTime() === completed.getTime());
    if (bucket) bucket.total += riderEarning(delivery.price);
  }
  const max = Math.max(1, ...days.map((d) => d.total));
  return days.map((d) => ({
    day: DAY_LABELS[d.date.getDay()],
    height: d.total > 0 ? Math.max(0.12, d.total / max) : 0.04,
    highlight: d.date.getTime() === today.getTime(),
  }));
}

type Metric = { label: string; value: string };

function buildMetrics(deliveries: CompletedDelivery[]): Metric[] {
  const trips = deliveries.length;
  const earnings = totalRiderEarnings(deliveries);
  const avgFare = trips > 0 ? Math.round(earnings / trips) : 0;
  return [
    { label: 'Trips', value: String(trips) },
    { label: 'Online', value: `${trips}h` },
    { label: 'Avg Fare', value: formatPrice(avgFare) },
  ];
}

export function Earnings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [range, setRange] = useState<Range>('Week');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [riderId, setRiderId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const id = await getStoredRiderId();
        if (!cancelled) setRiderId(id);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const completed = useCompletedDeliveries(riderId);

  const { heroValue, afterCommissionValue, trendPct, bars, metrics, dateLabel } = useMemo(() => {
    const current = periodBounds(range, 0);
    const previous = periodBounds(range, -1);
    const currentDeliveries = deliveriesInWindow(completed, current.start, current.end);
    const previousDeliveries = deliveriesInWindow(completed, previous.start, previous.end);
    const currentGross = currentDeliveries.reduce((sum, d) => sum + (d.price ?? 0), 0);
    const previousGross = previousDeliveries.reduce((sum, d) => sum + (d.price ?? 0), 0);
    return {
      heroValue: formatPrice(currentGross),
      afterCommissionValue: formatPrice(totalRiderEarnings(currentDeliveries)),
      trendPct: previousGross > 0 ? Math.round(((currentGross - previousGross) / previousGross) * 100) : null,
      bars: lastSevenDaysBars(completed),
      metrics: buildMetrics(currentDeliveries),
      dateLabel: rangeDateLabel(range),
    };
  }, [completed, range]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top app bar */}
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => setMenuOpen(true)} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Menu">
          <MaterialIcons name="menu" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.brand}>FAMO</Text>
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
            <Text style={styles.heroValue}>{heroValue}</Text>
            {trendPct !== null ? (
              <View style={styles.trendPill}>
                <MaterialIcons
                  name={trendPct >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={trendPct >= 0 ? COLORS.positive : COLORS.error}
                />
                <Text style={[styles.trendText, trendPct < 0 && { color: COLORS.error }]}>
                  {trendPct >= 0 ? '+' : ''}{trendPct}%
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.heroAfterCommission}>Earning after app's 10%: {afterCommissionValue}</Text>
          <Text style={styles.heroDate}>{dateLabel}</Text>
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

        {/* Bar chart — last 7 days */}
        <View style={styles.chart}>
          <View style={styles.bars}>
            {bars.map((bar, idx) => (
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
            {bars.map((bar, idx) => (
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
          {metrics.map((m) => (
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
  heroAfterCommission: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryContainer,
    opacity: 0.85,
  },
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
