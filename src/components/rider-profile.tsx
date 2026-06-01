import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerHigh: '#e9e8e7',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  error: '#ba1a1a',
};

const PROFILE_URI =
  'https://lh3.googleusercontent.com/aida/ADBb0uhpzp48WLEOBto34O_YvDuH_HO-sbuCTeRtDvJJASI2tAqxlhrG3BRdIUGbvPPT7goqnUf0sEmcj0uCLtu04Q4CeMFGP55uQj1NQpJ0E9jX2gakN5UbtXTO5aN9HckrZAmBcsnk0HViYDuOM-S2mR4uI2eDYyHROorcUj2vIdmC1dIIfpn-pfK3BumTGuK1LT6hQBbY-ri4p_-WUABuOJB6L1jQp4upa5Yn-e8b08MEUBYEONrHGH1RfA4';

type MenuItem = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
};

const MENU: MenuItem[] = [
  { icon: 'local-shipping', label: 'Vehicle' },
  { icon: 'description', label: 'Documents' },
  { icon: 'account-balance', label: 'Bank account' },
  { icon: 'notifications-active', label: 'Notifications' },
  { icon: 'translate', label: 'Language' },
  { icon: 'contact-support', label: 'Help & support' },
];

type RiderProfileProps = {
  onMenu?: () => void;
  onSelect?: (label: string) => void;
  onEditProfile?: () => void;
  onNotifications?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
};

export function RiderProfile({
  onMenu,
  onSelect,
  onEditProfile,
  onNotifications,
  onLogout,
  onDeleteAccount,
}: RiderProfileProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top app bar */}
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onMenu} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Menu">
          <MaterialIcons name="menu" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.brand}>FAMMO</Text>
        <Pressable onPress={onNotifications} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Notifications">
          <MaterialIcons name="notifications" size={24} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarRing}>
            <Image source={{ uri: PROFILE_URI }} style={styles.avatar} contentFit="cover" />
          </View>
          <Text style={styles.name}>Rashid Ahmed</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="star" size={16} color={COLORS.primary} />
            <Text style={styles.metaStrong}>4.9</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.meta}>1,284 trips</Text>
          </View>
          <Pressable
            onPress={onEditProfile}
            style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
            accessibilityRole="button">
            <Text style={styles.editText}>Edit profile</Text>
          </Pressable>
        </View>

        {/* Menu list */}
        <View style={styles.menuList}>
          {MENU.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => onSelect?.(item.label)}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              accessibilityRole="button">
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <MaterialIcons name={item.icon} size={22} color={COLORS.onSurface} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={COLORS.onSurfaceVariant} />
            </Pressable>
          ))}
        </View>

        {/* Logout + version */}
        <View style={styles.footer}>
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
            accessibilityRole="button">
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
          <Pressable
            onPress={onDeleteAccount}
            style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
            accessibilityRole="button">
            <MaterialIcons name="delete-outline" size={20} color={COLORS.error} />
            <Text style={styles.deleteText}>Delete account</Text>
          </Pressable>
          <Text style={styles.version}>Version 4.12.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 32,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  profileHeader: { alignItems: 'center', gap: 16 },
  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: COLORS.primaryContainer,
    padding: 4,
    backgroundColor: COLORS.surface,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 64 },
  name: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: COLORS.onSurface },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8 },
  metaStrong: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  metaDot: { fontSize: 16, color: COLORS.outline },
  meta: { fontSize: 16, fontWeight: '600', color: COLORS.onSurfaceVariant },
  editBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(251,209,3,0.2)',
  },
  editBtnPressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
  editText: { fontSize: 16, fontWeight: '600', color: COLORS.onPrimaryContainer },
  menuList: { gap: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
  },
  menuItemPressed: { borderColor: COLORS.primary, transform: [{ scale: 0.99 }] },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  footer: { alignItems: 'center', gap: 16, marginTop: 16 },
  logoutBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  logoutBtnPressed: { borderColor: 'rgba(186,26,26,0.2)' },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.error },
  deleteBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteBtnPressed: { backgroundColor: 'rgba(186,26,26,0.06)' },
  deleteText: { fontSize: 16, fontWeight: '700', color: COLORS.error },
  version: { fontSize: 14, color: COLORS.onSurfaceVariant },
});
