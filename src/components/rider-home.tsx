import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompleteDelivery } from '@/components/complete-delivery';
import { DeliveryCompleted } from '@/components/delivery-completed';
import { DeliveryRequest } from '@/components/delivery-request';
import { InTransit } from '@/components/in-transit';
import { Notifications } from '@/components/notifications';
import { PaymentMethod } from '@/components/payment-method';
import { PickupNavigation } from '@/components/pickup-navigation';
import { Reviews } from '@/components/reviews';
import { Sidebar } from '@/components/sidebar';
import { VehicleInfo } from '@/components/vehicle-info';
import { VerifyPackage } from '@/components/verify-package';
import { useRiderProfileData } from '@/hooks/rider-account-api';
import {
  appendCompletedDelivery,
  CompletedDelivery,
  useCompletedDeliveries,
} from '@/hooks/rider-delivery-history';
import { getStoredRiderId } from '@/hooks/rider-session';
import { deliveryNetEarning, formatKm, formatPrice, haversineMeters } from '@/hooks/maps';
import { useActiveOrders } from '@/hooks/use-active-orders';
import { useAuth } from '@/hooks/use-auth';
import { useBackHandler } from '@/hooks/use-back-handler';
import { useRiderJobs } from '@/hooks/use-rider-jobs';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useRiderLocation } from '@/hooks/use-rider-location';
import { usePushNotifications } from '@/hooks/use-push-notifications';

type JobPhase = 'pickup' | 'verify' | 'transit' | 'payment' | 'complete' | 'completed' | null;
const JOB_PHASE_KEY = 'famo.jobPhase';

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

const TIPS = [
  'Always check your battery levels before starting a shift.',
  'The fastest routes are updated every 5 minutes.',
  'Stay hydrated and take breaks during peak hours.',
  'Friendly service leads to higher ratings and better tips!',
];

type Stat = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  highlight?: boolean;
};

/** Deliveries this rider completed since local midnight. */
function deliveredToday(deliveries: CompletedDelivery[]): CompletedDelivery[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return deliveries.filter((d) => new Date(d.completed_at).getTime() >= startOfToday.getTime());
}

/** "Today's Activity" stat cards built from this rider's real completed jobs.
 *  There's no backend tracking of online/shift duration, so working time is
 *  approximated as one hour per completed delivery (per product direction). */
function buildTodayStats(deliveries: CompletedDelivery[]): Stat[] {
  const todays = deliveredToday(deliveries);
  const orders = todays.length;
  const earnings = todays.reduce((sum, d) => sum + deliveryNetEarning(d), 0);
  const distanceMeters = todays.reduce(
    (sum, d) =>
      sum + haversineMeters({ lat: d.pickup_lat, lng: d.pickup_lng }, { lat: d.dropoff_lat, lng: d.dropoff_lng }),
    0,
  );

  return [
    { icon: 'schedule', label: 'Working Time', value: `${orders}h 0m` },
    { icon: 'straighten', label: 'Distance', value: formatKm(distanceMeters) },
    { icon: 'task-alt', label: 'Orders', value: String(orders) },
    { icon: 'payments', label: 'Earnings', value: formatPrice(earnings), highlight: true },
  ];
}

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
  const router = useRouter();
  const navigation = useNavigation();
  const { logout } = useAuth();
  const { avatar } = useRiderProfileData();
  const [riderId, setRiderId] = useState<string | null>(null);
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);
  const [jobPhase, setJobPhase] = useState<JobPhase>(null);
  const [phaseRestored, setPhaseRestored] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const tipText = useTypewriter(TIPS);
  const completedDeliveries = useCompletedDeliveries(riderId);
  const todayStats = useMemo(() => buildTodayStats(completedDeliveries), [completedDeliveries]);

  const location = useRiderLocation({ riderId, activeDeliveryId });
  const online = location.online;
  const onlineStatus = useOnlineStatus();

  useEffect(() => {
    onlineStatus.setOnline(location.online);
  }, [location.online]);

  useEffect(() => {
    onlineStatus.setStarting(location.starting);
  }, [location.starting]);

  useEffect(() => {
    onlineStatus.setGoOnline(location.goOnline);
  }, [location.goOnline]);

  const jobs = useRiderJobs({ riderId, online });
  const { count: activeOrdersCount, refresh: refreshActiveOrders } = useActiveOrders(riderId);
  usePushNotifications(riderId);

  // Refresh the assigned-orders count promptly when this rider's active job
  // changes (accept adds one, complete/cancel removes one); the interval poll
  // in useActiveOrders catches assignments that happen server-side.
  useEffect(() => {
    refreshActiveOrders();
  }, [jobs.activeDelivery?.id, refreshActiveOrders]);

  // Android hardware back. Close the topmost overlay first; while a job or an
  // incoming offer covers the screen, consume the press so the rider can't
  // accidentally back out mid-delivery (those screens have their own
  // on-screen controls). At the home root, confirm before exiting the app.
  useBackHandler(() => {
    if (menuOpen) {
      setMenuOpen(false);
      return true;
    }
    if (notificationsOpen) {
      setNotificationsOpen(false);
      return true;
    }
    if (reviewsOpen) {
      setReviewsOpen(false);
      return true;
    }
    if (vehicleOpen) {
      setVehicleOpen(false);
      return true;
    }
    if (jobPhase || jobs.pendingOffer) {
      return true;
    }
    Alert.alert('Exit app', 'Are you sure you want to exit the application?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => BackHandler.exitApp() },
    ]);
    return true;
  });

  // Tapping the Home tab (even while it's already the active tab) should bring
  // the rider back to the home screen by dismissing any full-screen overlay
  // opened from here (Reviews, Notifications, Ride History, Bike Details, menu).
  // expo-router/ui emits 'tabPress' on the focused tab too, so we can catch it.
  useEffect(() => {
    const unsub = navigation.addListener('tabPress' as never, () => {
      setMenuOpen(false);
      setNotificationsOpen(false);
      setReviewsOpen(false);
      setVehicleOpen(false);
    });
    return unsub;
  }, [navigation]);

  // Resolve the rider session id (custom auth -> stored id from login).
  useEffect(() => {
    let active = true;
    void (async () => {
      const id = await getStoredRiderId();
      if (active) {
        if (!id) {
          // If no stored rider ID is present, we are bypass-logged in on an unauthenticated
          // or corrupted session state. Automatically trigger logout to clear the view.
          logout();
          return;
        }
        setRiderId(id);
      }
    })();
    return () => {
      active = false;
    };
  }, [logout]);

  // Keep the location hook in sync with the active job (drives is_available + broadcast).
  useEffect(() => {
    setActiveDeliveryId(jobs.activeDelivery?.id ?? null);
  }, [jobs.activeDelivery?.id]);

  // Restore the last job phase from AsyncStorage on launch (runs once per riderId).
  // This ensures verify/payment/complete screens survive a background/close + reopen.
  // The auto-restore below is gated on phaseRestored so it never races with this.
  useEffect(() => {
    if (!riderId) return;
    void (async () => {
      const saved = (await AsyncStorage.getItem(JOB_PHASE_KEY)) as JobPhase | null;
      if (saved) setJobPhase(saved);
      setPhaseRestored(true);
    })();
  }, [riderId]);

  // Persist jobPhase changes so they survive app restarts.
  useEffect(() => {
    if (jobPhase === null) {
      void AsyncStorage.removeItem(JOB_PHASE_KEY);
    } else {
      void AsyncStorage.setItem(JOB_PHASE_KEY, jobPhase);
    }
  }, [jobPhase]);

  // Enter / resume the job UI when an active delivery exists.
  // Only runs after the AsyncStorage restore has completed so we never
  // overwrite a restored phase (e.g. 'verify') with the status-derived fallback.
  useEffect(() => {
    if (!phaseRestored) return;
    if (jobs.activeDelivery && jobPhase === null) {
      setJobPhase(jobs.activeDelivery.status === 'picked_up' ? 'transit' : 'pickup');
    }
  }, [jobs.activeDelivery, jobPhase, phaseRestored]);

  // Phase 4: the customer cancelled after we accepted. Kill the job UI and
  // return to the Home (idle) screen, then inform the rider.
  useEffect(() => {
    if (jobs.externalCancelTick === 0) return;
    setJobPhase(null);
    Alert.alert(
      'Delivery cancelled',
      'This delivery was cancelled by the customer. You have been returned to Home.',
    );
  }, [jobs.externalCancelTick]);

  const toggleOnline = useCallback(
    async (next: boolean) => {
      if (next) {
        const ok = await location.goOnline();
        if (!ok && location.error) {
          Alert.alert('Status Error', location.error);
        }
      } else {
        await location.goOffline();
      }
    },
    [location],
  );

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
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialIcons name="person" size={26} color={COLORS.onSurfaceVariant} />
            </View>
          )}
        </Pressable>

        <View style={styles.toggle}>
          <Pressable
            onPress={() => toggleOnline(false)}
            disabled={location.starting}
            style={[styles.toggleBtn, !online && styles.toggleBtnActive]}>
            <Text style={[styles.toggleText, !online && styles.toggleTextActive]}>Offline</Text>
          </Pressable>
          <Pressable
            onPress={() => toggleOnline(true)}
            disabled={location.starting}
            style={[styles.toggleBtn, online && styles.toggleBtnActive]}>
            <Text style={[styles.toggleText, online && styles.toggleTextActive]}>
              {location.starting ? 'Starting…' : 'Online'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setNotificationsOpen(true)}
          style={styles.bellBtn}
          accessibilityRole="button">
          <MaterialIcons name="notifications" size={24} color={COLORS.onSurface} />
        </Pressable>
      </View>

      {online ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Today&apos;s Activity</Text>
            <Text style={styles.heroSubtitle}>
              You are currently online and ready for new jobs.
            </Text>
          </View>

          {/* Live count of orders currently assigned to this rider */}
          <View style={styles.activeCard}>
            <View style={styles.activeIcon}>
              <MaterialIcons name="moped" size={24} color={COLORS.onPrimaryContainer} />
            </View>
            <View style={styles.activeTextWrap}>
              <Text style={styles.activeLabel}>Active Orders</Text>
              <Text style={styles.activeSub}>
                {activeOrdersCount > 0
                  ? `${activeOrdersCount} ${activeOrdersCount === 1 ? 'order' : 'orders'} assigned to you right now`
                  : 'No active orders right now'}
              </Text>
            </View>
            <Text style={styles.activeCount}>{activeOrdersCount}</Text>
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
            {todayStats.map((s) => (
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
      ) : (
        <View style={styles.offlineContainer}>
          <View style={styles.offlineIconWrap}>
            <MaterialIcons name="wifi-off" size={56} color={COLORS.outlineVariant} />
          </View>
          <Text style={styles.offlineTitle}>You&apos;re Offline</Text>
          <Text style={styles.offlineSubtitle}>
            Go online to start receiving delivery requests and access all app features.
          </Text>
          <Pressable
            onPress={() => toggleOnline(true)}
            disabled={location.starting}
            style={({ pressed }) => [styles.goOnlineBtn, pressed && styles.goOnlineBtnPressed]}>
            <MaterialIcons name="power-settings-new" size={20} color="#000000" />
            <Text style={styles.goOnlineBtnText}>
              {location.starting ? 'Going Online…' : 'Go Online'}
            </Text>
          </Pressable>
        </View>
      )}

      {jobs.pendingOffer && !jobs.activeDelivery && (
        <DeliveryRequest
          offer={jobs.pendingOffer}
          delivery={jobs.offerDelivery}
          onAccept={async () => {
            const ok = await jobs.acceptOffer();
            if (ok) setJobPhase('pickup');
          }}
          onDecline={() => {
            void jobs.declineOffer();
          }}
        />
      )}

      {jobPhase === 'pickup' && jobs.activeDelivery && (
        <PickupNavigation
          delivery={jobs.activeDelivery}
          riderCoords={location.coords}
          onArrived={() => setJobPhase('verify')}
          onBack={() => setJobPhase('pickup')}
          onCancel={async () => {
            const ok = await jobs.cancelActiveDelivery();
            if (ok) {
              setJobPhase(null);
            } else {
              Alert.alert('Cannot cancel', 'The 1-minute cancellation window has closed.');
            }
          }}
        />
      )}

      {jobPhase === 'verify' && jobs.activeDelivery && (
        <VerifyPackage
          delivery={jobs.activeDelivery}
          onContinue={async () => {
            const ok = await jobs.markPickedUp();
            if (ok) setJobPhase('transit');
          }}
          onBack={() => setJobPhase('pickup')}
        />
      )}

      {jobPhase === 'transit' && jobs.activeDelivery && (
        <InTransit
          delivery={jobs.activeDelivery}
          riderCoords={location.coords}
          onArrived={() => setJobPhase('payment')}
          onBack={() => setJobPhase('transit')}
        />
      )}

      {jobPhase === 'payment' && jobs.activeDelivery && (
        <PaymentMethod
          delivery={jobs.activeDelivery}
          onContinue={() => setJobPhase('complete')}
          onBack={() => setJobPhase('transit')}
        />
      )}

      {jobPhase === 'complete' && jobs.activeDelivery && (
        <CompleteDelivery
          delivery={jobs.activeDelivery}
          onConfirm={async () => {
            const delivery = jobs.activeDelivery;
            const ok = await jobs.markDelivered();
            if (ok) {
              if (riderId && delivery) void appendCompletedDelivery(riderId, delivery);
              setJobPhase('completed');
            }
          }}
          onBack={() => setJobPhase('transit')}
        />
      )}

      {jobPhase === 'completed' && (
        <DeliveryCompleted
          delivery={jobs.activeDelivery}
          onHome={() => {
            setJobPhase(null);
            jobs.finishJob();
          }}
          onBack={() => {
            setJobPhase(null);
            jobs.finishJob();
          }}
        />
      )}

      {notificationsOpen && <Notifications onBack={() => setNotificationsOpen(false)} />}

      {reviewsOpen && <Reviews onBack={() => setReviewsOpen(false)} />}


      {vehicleOpen && <VehicleInfo onBack={() => setVehicleOpen(false)} />}

      {menuOpen && (
        <Sidebar
          online={online}
          onClose={() => setMenuOpen(false)}
          onNavigate={(label) => {
            if (label === 'Reviews') setReviewsOpen(true);
            else if (label === 'Ride History') router.push('/explore');
            else if (label === 'Bike Details') setVehicleOpen(true);
            else if (label === 'Help & Support') router.push('/help');
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
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
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
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  activeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  activeTextWrap: { flex: 1, gap: 2 },
  activeLabel: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  activeSub: { fontSize: 13, lineHeight: 18, color: COLORS.onSurfaceVariant },
  activeCount: { fontSize: 32, fontWeight: '800', color: COLORS.onSurface },
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

  // Offline dashboard
  offlineContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  offlineIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  offlineSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 300,
  },
  goOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryContainer,
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  goOnlineBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  goOnlineBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
