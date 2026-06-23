import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRiderProfileData } from '@/hooks/rider-account-api';
import { useAuth } from '@/hooks/use-auth';

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
  error: '#ba1a1a',
  online: '#22c55e',
  offline: '#9ca3af',
};

type NavItem = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  active?: boolean;
};

const NAV: NavItem[] = [
  { icon: 'home', label: 'Home', active: true },
  { icon: 'history', label: 'Ride History' },
  { icon: 'moped', label: 'Bike Details' },
  { icon: 'star', label: 'Reviews' },
];

type SidebarProps = {
  onClose: () => void;
  onNavigate?: (label: string) => void;
  online?: boolean;
};

export function Sidebar({ onClose, onNavigate, online = false }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { profile, avatar } = useRiderProfileData();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-320, 0],
  });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
      </Animated.View>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }], paddingTop: insets.top + 24 }]}>
        <ScrollView
          contentContainerStyle={[styles.drawerContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}>
          {/* Profile */}
          <View style={styles.profileBlock}>
            <View style={styles.profileRow}>
              <View style={styles.avatarWrap}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <MaterialIcons name="person" size={32} color={COLORS.onSurfaceVariant} />
                  </View>
                )}
                <View style={[styles.onlineDot, !online && styles.offlineDot]} />
              </View>
              <View style={styles.profileText}>
                <Text style={styles.name}>{profile?.full_name || 'Rider'}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{online ? 'Online' : 'Offline'}</Text>
                </View>
              </View>
            </View>

          </View>

          {/* Nav links */}
          <View style={styles.nav}>
            {NAV.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  onClose();
                  onNavigate?.(item.label);
                }}
                style={({ pressed }) => [
                  styles.navItem,
                  item.active && styles.navItemActive,
                  pressed && !item.active && styles.navItemPressed,
                ]}
                accessibilityRole="button">
                <MaterialIcons
                  name={item.icon}
                  size={24}
                  color={item.active ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant}
                />
                <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}

            <View style={styles.divider} />

            <Pressable
              onPress={() => {
                onClose();
                onNavigate?.('Help & Support');
              }}
              style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
              accessibilityRole="button">
              <MaterialIcons name="help" size={24} color={COLORS.onSurfaceVariant} />
              <Text style={styles.navLabel}>Help & Support</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onClose();
                logout();
              }}
              style={({ pressed }) => [styles.navItem, pressed && styles.logoutPressed]}
              accessibilityRole="button">
              <MaterialIcons name="logout" size={24} color={COLORS.error} />
              <Text style={[styles.navLabel, styles.logoutLabel]}>Logout</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    zIndex: 2000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27,28,28,0.4)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 320,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
    elevation: 16,
  },
  drawerContent: { gap: 32 },
  profileBlock: { gap: 16, paddingHorizontal: 8 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.online,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  offlineDot: {
    backgroundColor: COLORS.offline,
  },
  profileText: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 14, color: COLORS.onSurfaceVariant },
  nav: { gap: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  navItemActive: { backgroundColor: COLORS.primaryContainer },
  navItemPressed: { backgroundColor: COLORS.surfaceContainerHigh },
  navLabel: { fontSize: 16, fontWeight: '600', color: COLORS.onSurfaceVariant },
  navLabelActive: { color: COLORS.onPrimaryContainer, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 16,
  },
  logoutPressed: { backgroundColor: 'rgba(186,26,26,0.1)' },
  logoutLabel: { color: COLORS.error },
});
