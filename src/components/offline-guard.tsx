import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOnlineStatus } from '@/hooks/use-online-status';

const COLORS = {
  background: '#fbf9f9',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  surfaceContainerLow: '#f5f3f3',
  outlineVariant: '#d0c6ab',
  primaryContainer: '#fbd103',
};

type Props = {
  children: React.ReactNode;
};

export function OfflineGuard({ children }: Props) {
  const { online, starting, goOnline } = useOnlineStatus();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (online) return <>{children}</>;

  const handleGoOnline = async () => {
    if (goOnline) {
      await goOnline();
    }
    router.replace('/');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="wifi-off" size={56} color={COLORS.outlineVariant} />
        </View>
        <Text style={styles.title}>You&apos;re Offline</Text>
        <Text style={styles.subtitle}>
          This feature is only available when you&apos;re online. Go online from the dashboard to access all app features.
        </Text>
        <Pressable
          onPress={handleGoOnline}
          disabled={starting}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
          <MaterialIcons name="power-settings-new" size={20} color="#000000" />
          <Text style={styles.btnText}>
            {starting ? 'Going Online…' : 'Go Online'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 300,
  },
  btn: {
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
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
