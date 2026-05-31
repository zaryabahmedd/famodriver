import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
};

const PROFILE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDnP4b7NOWIctfZ2gDsS9IqfVYY7TDhjabA2xIk6KOaWYdDvJFd5nH43nm6wiGu3s60Z78Y8GMo6XHd4GB_mLr-wFbN9L-MYGm8GRQ5i-kiF8sSx1IQhwG2sWr9uzJ6mNKknhr2cm2QyB4QtJgO1QFS1D_jiZ_qgk1jVleYxXJaAKSvTA762vEKaQuuUpGl4uV2MqbUY9hErXPgaoNZA8RTvsc6eWo3loV8yFLKxMnseiz0RUr-HzA3xoqKPTji5e1MmMMEIWcJLp4';

const TABS = ['Active', 'Scheduled', 'History'] as const;
type Tab = (typeof TABS)[number];

type Job = {
  from: string;
  to: string;
  when: string;
  status: 'Upcoming' | 'Scheduled';
  cargoIcon: keyof typeof MaterialIcons.glyphMap;
  cargo: string;
  earning: string;
};

const JOBS: Job[] = [
  {
    from: 'DHA Phase 5',
    to: 'Gulberg III',
    when: 'Today · 11:00 AM',
    status: 'Upcoming',
    cargoIcon: 'inventory-2',
    cargo: 'Standard Package',
    earning: '466',
  },
  {
    from: 'Office',
    to: 'Lahore Cantt',
    when: 'Today · 02:30 PM',
    status: 'Upcoming',
    cargoIcon: 'shopping-bag',
    cargo: 'Groceries',
    earning: '420',
  },
  {
    from: 'Bahria',
    to: 'DHA',
    when: 'Tomorrow · 9:00 AM',
    status: 'Scheduled',
    cargoIcon: 'medication',
    cargo: 'Pharma',
    earning: '380',
  },
  {
    from: 'Warehouse',
    to: 'Shop',
    when: 'May 16 · 11:30',
    status: 'Scheduled',
    cargoIcon: 'local-shipping',
    cargo: 'Bulk Load',
    earning: '1,240',
  },
];

function jobsForTab(tab: Tab): Job[] {
  if (tab === 'Active') return [];
  if (tab === 'Scheduled') return JOBS;
  return [];
}

export function Jobs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Scheduled');
  const [online, setOnline] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleJobs = jobsForTab(activeTab);
  const isEmpty = visibleJobs.length === 0;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top app bar */}
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => setMenuOpen(true)} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Menu">
          <MaterialIcons name="menu" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.brand}>FAMMO</Text>
        <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="Profile">
          <Image source={{ uri: PROFILE_URI }} style={styles.avatar} contentFit="cover" />
        </Pressable>
      </View>

      {/* Tabs */}
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
        contentContainerStyle={[
          styles.scrollContent,
          isEmpty && styles.scrollContentEmpty,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}>
        {isEmpty ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, online ? styles.emptyIconOnline : styles.emptyIconOffline]}>
              <MaterialIcons
                name={online ? 'inbox' : 'wifi-off'}
                size={48}
                color={online ? COLORS.onPrimaryContainer : COLORS.onTertiaryContainer}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {online ? 'No jobs available' : "You're offline"}
            </Text>
            <Text style={styles.emptyText}>
              {online
                ? "New delivery requests will appear here as soon as they're matched to you."
                : 'Go online to start receiving delivery requests near you.'}
            </Text>
            <Pressable
              onPress={() => setOnline((v) => !v)}
              style={({ pressed }) => [styles.emptyBtn, pressed && styles.emptyBtnPressed]}
              accessibilityRole="button">
              <MaterialIcons
                name={online ? 'refresh' : 'bolt'}
                size={20}
                color={COLORS.onPrimaryContainer}
              />
              <Text style={styles.emptyBtnText}>{online ? 'Refresh' : 'Go online'}</Text>
            </Pressable>
            {online ? (
              <Pressable onPress={() => setOnline(false)} accessibilityRole="button">
                <Text style={styles.emptyLink}>Go offline</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            <Text style={styles.heading}>Upcoming Deliveries</Text>

            {visibleJobs.map((job, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                accessibilityRole="button">
            <View style={styles.cardTop}>
              <View style={styles.routeBlock}>
                <View style={styles.routeRow}>
                  <Text style={styles.routeText}>{job.from}</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={COLORS.outline} />
                  <Text style={styles.routeText}>{job.to}</Text>
                </View>
                <Text style={styles.whenText}>{job.when}</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  job.status === 'Upcoming' ? styles.badgeUpcoming : styles.badgeScheduled,
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    job.status === 'Upcoming'
                      ? styles.badgeTextUpcoming
                      : styles.badgeTextScheduled,
                  ]}>
                  {job.status}
                </Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <View style={styles.cargoRow}>
                <MaterialIcons name={job.cargoIcon} size={16} color={COLORS.onSurfaceVariant} />
                <Text style={styles.cargoText}>{job.cargo}</Text>
              </View>
              <View style={styles.earningBlock}>
                <Text style={styles.earningLabel}>Earning</Text>
                <Text style={styles.earningValue}>
                  <Text style={styles.earningCurrency}>Rs </Text>
                  {job.earning}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
          </>
        )}
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
  },
  scrollContentEmpty: { flexGrow: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 40 },
  emptyIcon: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconOnline: { backgroundColor: COLORS.primaryContainer },
  emptyIconOffline: { backgroundColor: COLORS.tertiaryContainer },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface, marginTop: 8 },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 300,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    marginTop: 12,
  },
  emptyBtnPressed: { opacity: 0.85 },
  emptyBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.onPrimaryContainer },
  emptyLink: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant, marginTop: 4 },
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
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeText: { fontSize: 18, fontWeight: '600', letterSpacing: -0.3, color: COLORS.onSurface },
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
  earningCurrency: { fontSize: 14, fontWeight: '500' },
});
