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
  secondary: '#5e5e5e',
  secondaryFixedDim: '#c6c6c6',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
};

type ApplicationSubmittedProps = {
  onContinue: () => void;
  onBack: () => void;
};

export function ApplicationSubmitted({ onContinue, onBack }: ApplicationSubmittedProps) {
  const insets = useSafeAreaInsets();
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 * float.value }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn} accessibilityRole="button">
          <MaterialIcons name="chevron-left" size={22} color={COLORS.onSurface} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>SIGN UP · STEP 5/5</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Illustration */}
        <View style={styles.illustration}>
          <View style={styles.aura} />
          <Animated.View style={floatStyle}>
            <Image
              source={require('@/assets/images/Bike4.png')}
              style={styles.bike}
              contentFit="contain"
            />
          </Animated.View>
        </View>

        {/* Success message */}
        <View style={styles.message}>
          <Text style={styles.title}>Application Submitted!</Text>
          <Text style={styles.subtitle}>
            We are reviewing your profile. You&apos;ll be notified once you&apos;re ready to start
            delivering.
          </Text>
        </View>

        {/* Status chip */}
        <View style={styles.chip}>
          <MaterialIcons name="verified" size={18} color={COLORS.primary} />
          <Text style={styles.chipText}>Under Review</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#000000" />
        </Pressable>
        <Text style={styles.support}>
          Questions? Contact <Text style={styles.supportLink}>Support</Text>
        </Text>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceContainerHigh,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  headerLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: COLORS.onSurface,
  },
  progressTrack: {
    width: 96,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.primaryContainer,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 28,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  illustration: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    width: '110%',
    height: '110%',
    borderRadius: 9999,
    backgroundColor: 'rgba(251, 209, 3, 0.12)',
  },
  bike: { width: '100%', maxWidth: 320, height: 280 },
  message: { alignItems: 'center', gap: 12 },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: COLORS.onBackground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.secondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
    backgroundColor: 'rgba(251, 209, 3, 0.1)',
  },
  chipText: { fontSize: 14, fontWeight: '500', color: COLORS.onPrimaryContainer },
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
  ctaText: { fontSize: 16, fontWeight: '700', color: '#000000' },
  support: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondaryFixedDim,
  },
  supportLink: { color: COLORS.primary, textDecorationLine: 'underline' },
});
