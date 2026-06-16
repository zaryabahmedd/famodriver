import { MaterialIcons } from '@expo/vector-icons';
import {
    TabList,
    TabListProps,
    Tabs,
    TabSlot,
    TabTrigger,
    TabTriggerSlotProps,
} from 'expo-router/ui';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#ffffff',
  onSurface: '#1b1c1c',
  secondary: '#5e5e5e',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outlineVariant: '#d0c6ab',
};

const FOOTER_HEIGHT = 76;

type TabName = 'home' | 'explore' | 'earnings' | 'help' | 'profile';

const ICONS: Record<TabName, keyof typeof MaterialIcons.glyphMap> = {
  home: 'home',
  explore: 'moped',
  earnings: 'account-balance-wallet',
  help: 'help-outline',
  profile: 'person',
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon="home">Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon="explore">Jobs</TabButton>
          </TabTrigger>
          <TabTrigger name="earnings" href="/earnings" asChild>
            <TabButton icon="earnings">Earnings</TabButton>
          </TabTrigger>
          <TabTrigger name="help" href="/help" asChild>
            <TabButton icon="help">Help</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="profile">Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: TabName };

export function TabButton({ children, isFocused, icon, ...props }: TabButtonProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}>
      <View style={[styles.iconPill, isFocused && styles.iconPillActive]}>
        <MaterialIcons
          name={ICONS[icon]}
          size={24}
          color={isFocused ? COLORS.onPrimaryContainer : COLORS.secondary}
        />
      </View>
      <Text style={[styles.label, isFocused ? styles.labelActive : styles.labelInactive]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();
  return (
    <View {...props} style={[styles.tabListContainer, { paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { height: '100%', paddingBottom: FOOTER_HEIGHT },
  tabListContainer: {
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : { position: 'absolute' }),
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 600,
    height: FOOTER_HEIGHT,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconPill: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: { backgroundColor: COLORS.primaryContainer },
  label: { fontSize: 12, fontWeight: '600' },
  labelActive: { color: COLORS.onSurface },
  labelInactive: { color: COLORS.secondary },
  pressed: { opacity: 0.6 },
});
