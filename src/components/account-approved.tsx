import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  background: '#fbf9f9',
  onBackground: '#1b1c1c',
  onSurface: '#1b1c1c',
  surfaceContainerHigh: '#e9e8e7',
  surfaceContainerLow: '#f5f3f3',
  secondary: '#5e5e5e',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outlineVariant: '#d0c6ab',
  surfaceLowest: '#ffffff',
};

type AccountApprovedProps = {
  onStart: () => void;
  onClose: () => void;
};

const FEATURES = [
  { icon: 'speed' as const, label: 'Ready', value: 'Instantly' },
  { icon: 'payments' as const, label: 'Earning', value: 'Active' },
];

export function AccountApproved({ onStart, onClose }: AccountApprovedProps) {
  const insets = useSafeAreaInsets();
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -15 * float.value }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn} accessibilityRole="button">
          <MaterialIcons name="close" size={24} color={COLORS.primary} />
        </Pressable>
        <Image
          source={require('@/assets/images/FAMO-logo-dark.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Illustration */}
        <Animated.View style={[styles.illustrationWrap, floatStyle]}>
          <Image
            source={require('@/assets/images/Bike4.png')}
            style={styles.illustration}
            contentFit="contain"
          />
        </Animated.View>

        {/* Message */}
        <View style={styles.message}>
          <Text style={styles.title}>Congrats! You are approved Now</Text>
          <Text style={styles.subtitle}>
            Your profile has been verified. You can now start accepting delivery requests and
            earning.
          </Text>
        </View>

        {/* Feature grid */}
        <View style={styles.grid}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialIcons name={f.icon} size={22} color={COLORS.onPrimaryContainer} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureValue}>{f.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={onStart}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Start Delivering</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#000000" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.background,
    zIndex: 1500,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 110, height: 32 },
  headerSpacer: { width: 40 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  illustrationWrap: {
    width: 260,
    height: 220,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 209, 3, 0.12)',
    borderRadius: 9999,
    overflow: 'hidden',
    padding: 10,
  },
  illustration: { width: '100%', height: '100%' },
  message: { alignItems: 'center', gap: 12, maxWidth: 360 },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.secondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 420,
  },
  featureCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  featureText: { flex: 1 },
  featureLabel: { fontSize: 14, fontWeight: '500', color: COLORS.secondary },
  featureValue: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#000000' },
});
