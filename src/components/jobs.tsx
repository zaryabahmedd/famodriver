import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatKm, formatPrice, haversineMeters } from '@/hooks/maps';
import {
  Delivery,
  fetchActiveDelivery,
  formatPackageCategory,
} from '@/hooks/rider-api';
import { CompletedDelivery, useCompletedDeliveries } from '@/hooks/rider-delivery-history';
import { getStoredRiderId } from '@/hooks/rider-session';
import { useRiderProfileData } from '@/hooks/rider-account-api';
import { useBackHandler } from '@/hooks/use-back-handler';
import { Sidebar } from './sidebar';
import { sidebarNavigate } from './sidebar-nav';

const COLORS = {
  background: '#fbf9f9',
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  secondary: '#5e5e5e',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  tertiaryContainer: '#2fe9ff',
  onTertiaryContainer: '#006570',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  success: '#176d3a',
  successContainer: '#d7f5e1',
};

const TABS = ['Active', 'Scheduled', 'Completed'] as const;
type Tab = (typeof TABS)[number];

/** "Today · 11:00 AM" / "Yesterday · 2:30 PM" / "May 16 · 9:00 AM". */
function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const startOfDay = (date: Date) => {
    const c = new Date(date);
    c.setHours(0, 0, 0, 0);
    return c.getTime();
  };
  const dayDiff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (dayDiff === 0) return `Today · ${time}`;
  if (dayDiff === 1) return `Yesterday · ${time}`;
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${date} · ${time}`;
}

function cargoIconFor(category: string | null): keyof typeof MaterialIcons.glyphMap {
  switch (category) {
    case 'documents':
      return 'description';
    case 'electronics':
      return 'devices-other';
    case 'fragile':
      return 'inventory-2';
    case 'food':
      return 'shopping-bag';
    default:
      return 'local-shipping';
  }
}

function cargoLabel(delivery: Delivery): string {
  return (
    formatPackageCategory(delivery.package_category) ??
    delivery.package_description ??
    'Package'
  );
}

function tripDistanceMeters(delivery: Delivery): number {
  return haversineMeters(
    { lat: delivery.pickup_lat, lng: delivery.pickup_lng },
    { lat: delivery.dropoff_lat, lng: delivery.dropoff_lng },
  );
}

/** Full-screen detail view for a single job, opened from any tab's list. */
function JobDetail({
  delivery,
  completedAt,
  onBack,
}: {
  delivery: Delivery;
  /** Set only for entries from the Completed tab (device-local history). */
  completedAt?: string | null;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isDelivered = delivery.status === 'delivered';
  const isCancelled = delivery.status === 'cancelled';
  const statusLabel = isDelivered ? 'Completed' : isCancelled ? 'Cancelled' : 'Active';
  const statusColor = isCancelled ? COLORS.onTertiaryContainer : COLORS.success;
  const statusBg = isCancelled ? COLORS.tertiaryContainer : COLORS.successContainer;
  const whenIso = completedAt ?? delivery.accepted_at ?? delivery.created_at;

  return (
    <View style={styles.detailRoot}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Order details</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.detailSummary}>
          <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
            <MaterialIcons
              name={isCancelled ? 'cancel' : isDelivered ? 'check-circle' : 'moped'}
              size={16}
              color={statusColor}
            />
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Text style={styles.detailEarning}>{formatPrice(delivery.price)}</Text>
          <Text style={styles.detailDate}>{formatWhen(whenIso)}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routeIcons}>
              <View style={styles.dotPickup} />
              <View style={styles.routeLine} />
              <MaterialIcons name="location-on" size={18} color={COLORS.outline} />
            </View>
            <View style={styles.routeText}>
              <View style={styles.routeBlock}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeValue}>{delivery.pickup_address ?? '—'}</Text>
              </View>
              <View style={styles.routeBlock}>
                <Text style={styles.routeLabel}>Drop-off</Text>
                <Text style={styles.routeValue}>{delivery.dropoff_address ?? '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metricCard}>
            <MaterialIcons name="straighten" size={20} color={COLORS.onPrimaryContainer} />
            <Text style={styles.metricValue}>{formatKm(tripDistanceMeters(delivery))}</Text>
            <Text style={styles.metricLabel}>Distance</Text>
          </View>
          <View style={styles.metricCard}>
            <MaterialIcons name={cargoIconFor(delivery.package_category)} size={20} color={COLORS.onPrimaryContainer} />
            <Text style={styles.metricValue}>{cargoLabel(delivery)}</Text>
            <Text style={styles.metricLabel}>Cargo</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValue}>#{delivery.id.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>Recipient</Text>
            <Text style={styles.infoValue}>{delivery.recipient_name ?? '—'}</Text>
          </View>
          {delivery.recipient_phone ? (
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{delivery.recipient_phone}</Text>
            </View>
          ) : null}
          {delivery.pickup_notes ? (
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>Pickup notes</Text>
              <Text style={styles.infoValue}>{delivery.pickup_notes}</Text>
            </View>
          ) : null}
          {delivery.dropoff_notes ? (
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>Drop-off notes</Text>
              <Text style={styles.infoValue}>{delivery.dropoff_notes}</Text>
            </View>
          ) : null}
          {delivery.special_instructions ? (
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>Instructions</Text>
              <Text style={styles.infoValue}>{delivery.special_instructions}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

type JobCardData = {
  id: string;
  delivery: Delivery;
  completedAt?: string;
  badge: string;
  badgeStyle: 'active' | 'scheduled';
};

function JobCard({ job, onPress }: { job: JobCardData; onPress: () => void }) {
  const whenIso = job.completedAt ?? job.delivery.accepted_at ?? job.delivery.created_at;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button">
      <View style={styles.cardTop}>
        <View style={styles.routeBlock}>
          <View style={styles.routeRowInline}>
            <Text style={styles.routeText} numberOfLines={1}>{job.delivery.pickup_address ?? '—'}</Text>
            <MaterialIcons name="arrow-forward" size={16} color={COLORS.outline} />
            <Text style={styles.routeText} numberOfLines={1}>{job.delivery.dropoff_address ?? '—'}</Text>
          </View>
          <Text style={styles.whenText}>{formatWhen(whenIso)}</Text>
        </View>
        <View
          style={[
            styles.badge,
            job.badgeStyle === 'active' ? styles.badgeUpcoming : styles.badgeScheduled,
          ]}>
          <Text
            style={[
              styles.badgeText,
              job.badgeStyle === 'active' ? styles.badgeTextUpcoming : styles.badgeTextScheduled,
            ]}>
            {job.badge}
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.cargoRow}>
          <MaterialIcons name={cargoIconFor(job.delivery.package_category)} size={16} color={COLORS.onSurfaceVariant} />
          <Text style={styles.cargoText}>{cargoLabel(job.delivery)}</Text>
        </View>
        <View style={styles.earningBlock}>
          <Text style={styles.earningLabel}>Earning</Text>
          <Text style={styles.earningValue}>{formatPrice(job.delivery.price)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function Jobs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { avatar } = useRiderProfileData();
  const [activeTab, setActiveTab] = useState<Tab>('Active');
  const [menuOpen, setMenuOpen] = useState(false);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const [selected, setSelected] = useState<{ delivery: Delivery; completedAt?: string } | null>(null);

  const completed = useCompletedDeliveries(riderId);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const id = await getStoredRiderId();
        if (!cancelled) setRiderId(id);
      })();
      setLoadingActive(true);
      void (async () => {
        const delivery = await fetchActiveDelivery();
        if (!cancelled) {
          setActiveDelivery(delivery);
          setLoadingActive(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  // Android back: close the order detail, then the menu, then fall back to Home.
  useBackHandler(() => {
    if (selected) {
      setSelected(null);
      return true;
    }
    if (menuOpen) {
      setMenuOpen(false);
      return true;
    }
    router.navigate('/');
    return true;
  });

  if (selected) {
    return (
      <JobDetail
        delivery={selected.delivery}
        completedAt={selected.completedAt}
        onBack={() => setSelected(null)}
      />
    );
  }

  let content: ReactNode;

  if (activeTab === 'Active') {
    if (loadingActive) {
      content = null;
    } else if (activeDelivery) {
      content = (
        <>
          <Text style={styles.heading}>Current order</Text>
          <JobCard
            job={{
              id: activeDelivery.id,
              delivery: activeDelivery,
              badge: activeDelivery.status === 'picked_up' ? 'In transit' : 'Heading to pickup',
              badgeStyle: 'active',
            }}
            onPress={() => setSelected({ delivery: activeDelivery })}
          />
        </>
      );
    } else {
      content = (
        <EmptyState
          icon="moped"
          title="No active order"
          text="When you accept a delivery request, it will show up here while it's in progress."
        />
      );
    }
  } else if (activeTab === 'Scheduled') {
    content = (
      <EmptyState
        icon="event-available"
        title="Nothing scheduled"
        text="Scheduled deliveries aren't available yet — they'll appear here once that's ready."
      />
    );
  } else {
    if (completed.length === 0) {
      content = (
        <EmptyState
          icon="inbox"
          title="No completed orders yet"
          text="Orders you finish will be listed here so you can review the details anytime."
        />
      );
    } else {
      content = (
        <>
          <Text style={styles.heading}>Completed orders</Text>
          {completed.map((entry: CompletedDelivery) => (
            <JobCard
              key={entry.id}
              job={{
                id: entry.id,
                delivery: entry,
                completedAt: entry.completed_at,
                badge: 'Completed',
                badgeStyle: 'scheduled',
              }}
              onPress={() => setSelected({ delivery: entry, completedAt: entry.completed_at })}
            />
          ))}
        </>
      );
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => setMenuOpen(true)} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Menu">
          <MaterialIcons name="menu" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.brand}>FAMO</Text>
        <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="Profile">
          {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" /> : <View style={styles.avatar} />}
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              {active && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {content}
      </ScrollView>

      {menuOpen ? (
        <Sidebar
          onClose={() => setMenuOpen(false)}
          onNavigate={(label) => sidebarNavigate(router, label)}
        />
      ) : null}
    </View>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name={icon} size={48} color={COLORS.onTertiaryContainer} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  detailRoot: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.surface,
    zIndex: 1700,
  },
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
  appBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.onSurface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 32,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  tab: { paddingVertical: 16, position: 'relative' },
  tabText: { fontSize: 16, fontWeight: '600', color: COLORS.onSurfaceVariant },
  tabTextActive: { color: COLORS.onSurface, fontWeight: '700' },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 99,
    backgroundColor: COLORS.primaryContainer,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 60 },
  emptyIcon: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tertiaryContainer,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface, marginTop: 8 },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 300,
  },
  heading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  card: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardPressed: { transform: [{ scale: 0.98 }] },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeBlock: { gap: 4, flex: 1 },
  routeRowInline: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  routeText: { fontSize: 16, fontWeight: '600', letterSpacing: -0.3, color: COLORS.onSurface, flexShrink: 1 },
  whenText: { fontSize: 13, color: COLORS.onSurfaceVariant },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeUpcoming: { backgroundColor: COLORS.primaryContainer },
  badgeScheduled: { backgroundColor: COLORS.tertiaryContainer },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badgeTextUpcoming: { color: COLORS.onPrimaryContainer },
  badgeTextScheduled: { color: COLORS.onTertiaryContainer },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    paddingTop: 12,
  },
  cargoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cargoText: { fontSize: 13, color: COLORS.onSurfaceVariant },
  earningBlock: { alignItems: 'flex-end' },
  earningLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  earningValue: { fontSize: 18, fontWeight: '600', color: COLORS.onSurface },
  // Detail
  detailSummary: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  detailEarning: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: COLORS.onSurface },
  detailDate: { fontSize: 14, color: COLORS.onSurfaceVariant },
  routeRow: { flexDirection: 'row', gap: 12 },
  routeIcons: { alignItems: 'center', paddingTop: 4, width: 18 },
  dotPickup: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: COLORS.outline,
    backgroundColor: COLORS.surfaceLowest,
  },
  routeLine: { width: 2, flex: 1, minHeight: 18, backgroundColor: COLORS.outlineVariant, marginVertical: 2 },
  routeLabel: { fontSize: 12, color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  routeValue: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  metrics: { flexDirection: 'row', gap: 12 },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    paddingVertical: 16,
  },
  metricValue: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface, textAlign: 'center' },
  metricLabel: { fontSize: 12, color: COLORS.onSurfaceVariant },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.outlineVariant },
  infoLabel: { fontSize: 14, color: COLORS.onSurfaceVariant },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, maxWidth: '65%', textAlign: 'right' },
});
