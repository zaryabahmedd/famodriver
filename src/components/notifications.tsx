import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
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
  tertiaryContainer: '#2fe9ff',
  onTertiaryContainer: '#006570',
  success: '#176d3a',
  successContainer: '#d7f5e1',
};

type Notification = {
  icon: keyof typeof MaterialIcons.glyphMap;
  tint: string;
  bg: string;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
};

const TODAY: Notification[] = [
  {
    icon: 'local-shipping',
    tint: COLORS.onPrimaryContainer,
    bg: 'rgba(251,209,3,0.25)',
    title: 'New delivery request',
    message: 'A pickup is available 1.2 km away in Gulberg. Tap to view details.',
    time: '5 min ago',
    unread: true,
  },
  {
    icon: 'payments',
    tint: COLORS.success,
    bg: COLORS.successContainer,
    title: 'Payout received',
    message: '₦2,450 has been transferred to your bank account.',
    time: '1 hr ago',
    unread: true,
  },
  {
    icon: 'star',
    tint: COLORS.onTertiaryContainer,
    bg: 'rgba(47,233,255,0.25)',
    title: 'New 5-star rating',
    message: 'Sara Ali rated your delivery 5 stars. Great job!',
    time: '3 hr ago',
  },
];

const EARLIER: Notification[] = [
  {
    icon: 'verified',
    tint: COLORS.onPrimaryContainer,
    bg: 'rgba(251,209,3,0.25)',
    title: 'Documents approved',
    message: 'Your vehicle registration has been verified successfully.',
    time: 'Yesterday',
  },
  {
    icon: 'campaign',
    tint: COLORS.onSurfaceVariant,
    bg: COLORS.surfaceContainerHigh,
    title: 'Weekend bonus active',
    message: 'Complete 20 trips this weekend to earn an extra ₦1,000.',
    time: '2 days ago',
  },
];

type NotificationsProps = {
  onBack?: () => void;
};

function NotificationCard({ item }: { item: Notification }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        item.unread && styles.cardUnread,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button">
      <View style={[styles.cardIcon, { backgroundColor: item.bg }]}>
        <MaterialIcons name={item.icon} size={22} color={item.tint} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.unread ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.cardMessage}>{item.message}</Text>
        <Text style={styles.cardTime}>{item.time}</Text>
      </View>
    </Pressable>
  );
}

export function Notifications({ onBack }: NotificationsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.appBarTitle}>Notifications</Text>
        <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Mark all read">
          <MaterialIcons name="done-all" size={24} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Today</Text>
        <View style={styles.group}>
          {TODAY.map((item) => (
            <NotificationCard key={item.title} item={item} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Earlier</Text>
        <View style={styles.group}>
          {EARLIER.map((item) => (
            <NotificationCard key={item.title} item={item} />
          ))}
        </View>
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
    paddingTop: 20,
    gap: 12,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.outline,
    marginTop: 8,
  },
  group: { gap: 12 },
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  cardUnread: { backgroundColor: COLORS.surfaceContainerLow, borderColor: COLORS.primaryContainer },
  cardPressed: { transform: [{ scale: 0.99 }], borderColor: COLORS.primary },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  cardMessage: { fontSize: 14, lineHeight: 20, color: COLORS.onSurfaceVariant },
  cardTime: { fontSize: 12, color: COLORS.outline, marginTop: 2 },
});
