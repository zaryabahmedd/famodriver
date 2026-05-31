import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
  surfaceContainerHigh: '#e9e8e7',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  success: '#176d3a',
  successContainer: '#d7f5e1',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
};

type Trip = {
  id: string;
  from: string;
  to: string;
  date: string;
  status: 'Completed' | 'Cancelled';
  earning: string;
  distance: string;
  duration: string;
  recipient: string;
  cargo: string;
};

const TRIPS: Trip[] = [
  {
    id: 'FAM-29384',
    from: 'DHA Phase 5',
    to: 'Gulberg III',
    date: 'Today · 2:14 PM',
    status: 'Completed',
    earning: '566',
    distance: '4.2 km',
    duration: '24 min',
    recipient: 'Sara Ali',
    cargo: 'Standard Package',
  },
  {
    id: 'FAM-29371',
    from: 'Office',
    to: 'Lahore Cantt',
    date: 'Today · 11:40 AM',
    status: 'Completed',
    earning: '420',
    distance: '6.1 km',
    duration: '31 min',
    recipient: 'Michael Zhang',
    cargo: 'Groceries',
  },
  {
    id: 'FAM-29360',
    from: 'Bahria Town',
    to: 'Model Town',
    date: 'Yesterday · 6:05 PM',
    status: 'Cancelled',
    earning: '0',
    distance: '8.4 km',
    duration: '—',
    recipient: 'Elena Rodriguez',
    cargo: 'Documents',
  },
  {
    id: 'FAM-29355',
    from: 'Johar Town',
    to: 'Garden Town',
    date: 'Yesterday · 1:20 PM',
    status: 'Completed',
    earning: '380',
    distance: '3.7 km',
    duration: '19 min',
    recipient: 'David Smith',
    cargo: 'Food Delivery',
  },
];

type JobHistoryProps = {
  onBack?: () => void;
};

function JobDetail({ trip, onBack }: { trip: Trip; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const completed = trip.status === 'Completed';

  return (
    <View style={styles.detailRoot}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Trip details</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Earning summary */}
        <View style={styles.detailSummary}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: completed ? COLORS.successContainer : COLORS.errorContainer },
            ]}>
            <MaterialIcons
              name={completed ? 'check-circle' : 'cancel'}
              size={16}
              color={completed ? COLORS.success : COLORS.error}
            />
            <Text style={[styles.statusPillText, { color: completed ? COLORS.success : COLORS.error }]}>
              {trip.status}
            </Text>
          </View>
          <Text style={styles.detailEarning}>Rs {trip.earning}</Text>
          <Text style={styles.detailDate}>{trip.date}</Text>
        </View>

        {/* Route */}
        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routeIcons}>
              <View style={styles.dotPickup} />
              <View style={styles.routeLine} />
              <MaterialIcons name="location-on" size={18} color={COLORS.error} />
            </View>
            <View style={styles.routeText}>
              <View style={styles.routeBlock}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeValue}>{trip.from}</Text>
              </View>
              <View style={styles.routeBlock}>
                <Text style={styles.routeLabel}>Drop-off</Text>
                <Text style={styles.routeValue}>{trip.to}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bento metrics */}
        <View style={styles.metrics}>
          <View style={styles.metricCard}>
            <MaterialIcons name="straighten" size={20} color={COLORS.primary} />
            <Text style={styles.metricValue}>{trip.distance}</Text>
            <Text style={styles.metricLabel}>Distance</Text>
          </View>
          <View style={styles.metricCard}>
            <MaterialIcons name="schedule" size={20} color={COLORS.primary} />
            <Text style={styles.metricValue}>{trip.duration}</Text>
            <Text style={styles.metricLabel}>Duration</Text>
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trip ID</Text>
            <Text style={styles.infoValue}>#{trip.id}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>Recipient</Text>
            <Text style={styles.infoValue}>{trip.recipient}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>Cargo</Text>
            <Text style={styles.infoValue}>{trip.cargo}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.helpBtn, pressed && styles.helpBtnPressed]}
          accessibilityRole="button">
          <MaterialIcons name="help-outline" size={20} color={COLORS.onSurface} />
          <Text style={styles.helpText}>Get help with this trip</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export function JobHistory({ onBack }: JobHistoryProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Trip | null>(null);

  if (selected) {
    return <JobDetail trip={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Job History</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {TRIPS.map((trip) => {
          const completed = trip.status === 'Completed';
          return (
            <Pressable
              key={trip.id}
              onPress={() => setSelected(trip)}
              style={({ pressed }) => [styles.tripCard, pressed && styles.tripCardPressed]}
              accessibilityRole="button">
              <View style={styles.tripHeader}>
                <Text style={styles.tripDate}>{trip.date}</Text>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: completed ? COLORS.successContainer : COLORS.errorContainer },
                  ]}>
                  <Text style={[styles.statusPillText, { color: completed ? COLORS.success : COLORS.error }]}>
                    {trip.status}
                  </Text>
                </View>
              </View>

              <View style={styles.routeRow}>
                <View style={styles.routeIcons}>
                  <View style={styles.dotPickup} />
                  <View style={styles.routeLine} />
                  <MaterialIcons name="location-on" size={18} color={COLORS.error} />
                </View>
                <View style={styles.routeText}>
                  <Text style={styles.routeValueSm}>{trip.from}</Text>
                  <Text style={styles.routeValueSm}>{trip.to}</Text>
                </View>
              </View>

              <View style={styles.tripFooter}>
                <Text style={styles.tripEarning}>Rs {trip.earning}</Text>
                <View style={styles.tripChevron}>
                  <Text style={styles.tripDetails}>View details</Text>
                  <MaterialIcons name="chevron-right" size={20} color={COLORS.onSurfaceVariant} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.surface,
    zIndex: 1700,
  },
  detailRoot: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.surface,
    zIndex: 1750,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  appBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  tripCard: {
    padding: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    gap: 12,
  },
  tripCardPressed: { borderColor: COLORS.primary, transform: [{ scale: 0.99 }] },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripDate: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  routeRow: { flexDirection: 'row', gap: 12 },
  routeIcons: { alignItems: 'center', paddingTop: 4, width: 18 },
  dotPickup: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceLowest,
  },
  routeLine: { width: 2, flex: 1, minHeight: 18, backgroundColor: COLORS.outlineVariant, marginVertical: 2 },
  routeText: { flex: 1, gap: 16, justifyContent: 'space-between' },
  routeValueSm: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    paddingTop: 12,
  },
  tripEarning: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  tripChevron: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tripDetails: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant },
  // Detail
  detailSummary: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  detailEarning: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: COLORS.onSurface },
  detailDate: { fontSize: 14, color: COLORS.onSurfaceVariant },
  card: {
    padding: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
  },
  routeBlock: { gap: 2 },
  routeLabel: { fontSize: 12, fontWeight: '600', color: COLORS.outline, textTransform: 'uppercase' },
  routeValue: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  metrics: { flexDirection: 'row', gap: 16 },
  metricCard: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    gap: 4,
    alignItems: 'flex-start',
  },
  metricValue: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  metricLabel: { fontSize: 13, color: COLORS.onSurfaceVariant },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.outlineVariant },
  infoLabel: { fontSize: 14, color: COLORS.onSurfaceVariant },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  helpBtnPressed: { opacity: 0.85 },
  helpText: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
});
