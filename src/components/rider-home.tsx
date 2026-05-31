import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompleteDelivery } from '@/components/complete-delivery';
import { DeliveryCompleted } from '@/components/delivery-completed';
import { DeliveryRequest } from '@/components/delivery-request';
import { InTransit } from '@/components/in-transit';
import { JobHistory } from '@/components/job-history';
import { Notifications } from '@/components/notifications';
import { PickupNavigation } from '@/components/pickup-navigation';
import { Reviews } from '@/components/reviews';
import { Sidebar } from '@/components/sidebar';
import { VerifyPackage } from '@/components/verify-package';
import { Wallet } from '@/components/wallet';

const COLORS = {
  background: '#f8f8f6',
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
  surfaceContainerHigh: '#e9e8e7',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  onPrimaryFixedVariant: '#554500',
  outlineVariant: '#d0c6ab',
};

const PROFILE_URI =
  'https://lh3.googleusercontent.com/aida/ADBb0uhpzp48WLEOBto34O_YvDuH_HO-sbuCTeRtDvJJASI2tAqxlhrG3BRdIUGbvPPT7goqnUf0sEmcj0uCLtu04Q4CeMFGP55uQj1NQpJ0E9jX2gakN5UbtXTO5aN9HckrZAmBcsnk0HViYDuOM-S2mR4uI2eDYyHROorcUj2vIdmC1dIIfpn-pfK3BumTGuK1LT6hQBbY-ri4p_-WUABuOJB6L1jQp4upa5Yn-e8b08MEUBYEONrHGH1RfA4';

const TIPS = [
  'Always check your battery levels before starting a shift.',
  'The fastest routes are updated every 5 minutes.',
  'Stay hydrated and take breaks during peak hours.',
  'Friendly service leads to higher ratings and better tips!',
];

const STATS = [
  { icon: 'schedule' as const, label: 'Working Time', value: '4h 20m' },
  { icon: 'straighten' as const, label: 'Distance', value: '42.5 km' },
  { icon: 'task-alt' as const, label: 'Orders', value: '12' },
  { icon: 'payments' as const, label: 'Earnings', value: 'Rs 3,450', highlight: true },
];

function useTypewriter(tips: string[]) {
  const [text, setText] = useState('');
  const state = useRef({ tip: 0, char: 0, deleting: false });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const s = state.current;
      const current = tips[s.tip];

      if (s.deleting) {
        s.char -= 1;
      } else {
        s.char += 1;
      }
      setText(current.substring(0, s.char));

      let speed = 50;
      if (s.deleting) speed /= 2;

      if (!s.deleting && s.char === current.length) {
        speed = 2000;
        s.deleting = true;
      } else if (s.deleting && s.char === 0) {
        s.deleting = false;
        s.tip = (s.tip + 1) % tips.length;
        speed = 500;
      }

      timeout = setTimeout(tick, speed);
    };

    timeout = setTimeout(tick, 400);
    return () => clearTimeout(timeout);
  }, [tips]);

  return text;
}

export function RiderHome() {
  const insets = useSafeAreaInsets();
  const [online, setOnline] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [transitOpen, setTransitOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const tipText = useTypewriter(TIPS);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Decorative grid background */}
      <View style={styles.mapBackground} pointerEvents="none">
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => setMenuOpen(true)} accessibilityRole="button" accessibilityLabel="Open menu">
          <Image source={{ uri: PROFILE_URI }} style={styles.avatar} contentFit="cover" />
        </Pressable>

        <View style={styles.toggle}>
          <Pressable
            onPress={() => setOnline(false)}
            style={[styles.toggleBtn, !online && styles.toggleBtnActive]}>
            <Text style={[styles.toggleText, !online && styles.toggleTextActive]}>Offline</Text>
          </Pressable>
          <Pressable
            onPress={() => setOnline(true)}
            style={[styles.toggleBtn, online && styles.toggleBtnActive]}>
            <Text style={[styles.toggleText, online && styles.toggleTextActive]}>Online</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setNotificationsOpen(true)}
          style={styles.bellBtn}
          accessibilityRole="button">
          <MaterialIcons name="notifications" size={24} color={COLORS.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Today&apos;s Activity</Text>
          <Text style={styles.heroSubtitle}>
            {online
              ? 'You are currently online and ready for new jobs.'
              : 'You are offline. Go online to receive new jobs.'}
          </Text>
        </View>

        {/* Pro tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <MaterialIcons name="lightbulb" size={20} color={COLORS.primary} />
            <Text style={styles.tipsTitle}>PRO TIPS</Text>
          </View>
          <View style={styles.tipsBody}>
            <Text style={styles.tipsText}>{tipText}</Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.grid}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={styles.statHeader}>
                <MaterialIcons name={s.icon} size={20} color={COLORS.primary} />
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {s.highlight ? (
                <View style={styles.statHighlight}>
                  <Text style={styles.statHighlightValue}>{s.value}</Text>
                </View>
              ) : (
                <Text style={styles.statValue}>{s.value}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {online && (
        <Pressable
          onPress={() => setRequestOpen(true)}
          style={[styles.requestFab, { bottom: insets.bottom + 24 }]}
          accessibilityRole="button">
          <MaterialIcons name="local-shipping" size={22} color={COLORS.onPrimaryContainer} />
          <Text style={styles.requestFabText}>New request</Text>
        </Pressable>
      )}

      {requestOpen && (
        <DeliveryRequest
          onAccept={() => {
            setRequestOpen(false);
            setPickupOpen(true);
          }}
          onDecline={() => setRequestOpen(false)}
        />
      )}

      {pickupOpen && (
        <PickupNavigation
          onArrived={() => {
            setPickupOpen(false);
            setVerifyOpen(true);
          }}
          onBack={() => setPickupOpen(false)}
        />
      )}

      {verifyOpen && (
        <VerifyPackage
          onContinue={() => {
            setVerifyOpen(false);
            setTransitOpen(true);
          }}
          onBack={() => setVerifyOpen(false)}
        />
      )}

      {transitOpen && (
        <InTransit
          onArrived={() => {
            setTransitOpen(false);
            setCompleteOpen(true);
          }}
          onBack={() => setTransitOpen(false)}
        />
      )}

      {completeOpen && (
        <CompleteDelivery
          onConfirm={() => {
            setCompleteOpen(false);
            setCompletedOpen(true);
          }}
          onBack={() => setCompleteOpen(false)}
        />
      )}

      {completedOpen && (
        <DeliveryCompleted
          onHome={() => setCompletedOpen(false)}
          onBack={() => setCompletedOpen(false)}
        />
      )}

      {notificationsOpen && <Notifications onBack={() => setNotificationsOpen(false)} />}

      {reviewsOpen && <Reviews onBack={() => setReviewsOpen(false)} />}

      {walletOpen && <Wallet onBack={() => setWalletOpen(false)} />}

      {historyOpen && <JobHistory onBack={() => setHistoryOpen(false)} />}

      {menuOpen && (
        <Sidebar
          onClose={() => setMenuOpen(false)}
          onNavigate={(label) => {
            if (label === 'Reviews') setReviewsOpen(true);
            else if (label === 'Wallet') setWalletOpen(true);
            else if (label === 'Job History') setHistoryOpen(true);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  mapBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.background },
  glow: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    opacity: 0.5,
  },
  glowTop: { top: '-10%', left: '-10%', width: '60%', height: '40%' },
  glowBottom: { bottom: '10%', right: '-10%', width: '50%', height: '40%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.onSurface,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 9999,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  toggleBtnActive: { backgroundColor: COLORS.primaryContainer },
  toggleText: { fontSize: 13, fontWeight: '700', color: COLORS.onSurfaceVariant },
  toggleTextActive: { color: COLORS.onPrimaryContainer },
  bellBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 28,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: 8 },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  tipsCard: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.onSurface,
  },
  tipsBody: { minHeight: 60, justifyContent: 'center' },
  tipsText: { fontSize: 16, lineHeight: 24, color: COLORS.onSurfaceVariant },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  statHighlight: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(251,209,3,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251,209,3,0.4)',
  },
  statHighlightValue: { fontSize: 20, fontWeight: '800', color: COLORS.onPrimaryFixedVariant },
  requestFab: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: COLORS.primaryContainer,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  requestFabText: { fontSize: 16, fontWeight: '700', color: COLORS.onPrimaryContainer },
});
