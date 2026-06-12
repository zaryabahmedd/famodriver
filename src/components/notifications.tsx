import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#fbf9f9',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  primary: '#715d00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
};

type NotificationsProps = {
  onBack?: () => void;
};

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
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.emptyState}>
        <MaterialIcons name="notifications-none" size={48} color={COLORS.outline} />
        <Text style={styles.emptyTitle}>No notifications</Text>
        <Text style={styles.emptyText}>You&apos;re all caught up. Notifications will appear here.</Text>
      </View>
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  emptyText: { fontSize: 14, lineHeight: 20, color: COLORS.onSurfaceVariant, textAlign: 'center' },
});
