import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    type ListRenderItemInfo,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  image: number;
};

const SLIDES: Slide[] = [
  {
    key: 'fast-delivery',
    title: 'Fast Delivery',
    subtitle: 'Lightning-fast pickups and drop-offs, right to your doorstep.',
    image: require('@/assets/images/onboarding-1.png'),
  },
  {
    key: 'live-tracking',
    title: 'Live Tracking',
    subtitle: 'Follow your courier in real time, every step of the way.',
    image: require('@/assets/images/onboarding-2.jpeg'),
  },
  {
    key: 'secure-payments',
    title: 'Secure Payments',
    subtitle: 'Safe and transparent transactions, every single time.',
    image: require('@/assets/images/onboarding-3.jpeg'),
  },
];

const BG = '#131313';
const PRIMARY = '#fff5dc';
const ON_SURFACE = '#e5e2e1';
const ACCENT = '#ffd600';

const SCRIM_COLORS = [
  'rgba(19, 19, 19, 0)',
  'rgba(19, 19, 19, 0.55)',
  'rgba(19, 19, 19, 0.88)',
  'rgba(19, 19, 19, 0.98)',
] as const;
const SCRIM_LOCATIONS = [0.18, 0.48, 0.72, 1] as const;

const OVERLAY_COLORS = ['rgba(19, 19, 19, 0.6)', 'rgba(19, 19, 19, 0)'] as const;
const OVERLAY_LOCATIONS = [0, 0.3] as const;

type OnboardingProps = {
  onDone: () => void;
};

export function Onboarding({ onDone }: OnboardingProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const contentAnim = useSharedValue(1);

  useEffect(() => {
    contentAnim.value = 0;
    contentAnim.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [index, contentAnim]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentAnim.value,
    transform: [{ translateY: (1 - contentAnim.value) * 20 }],
  }));

  const isLast = index === SLIDES.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onDone();
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  }, [index, isLast, onDone]);

  const onScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      setIndex(next);
    },
    [width],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Slide>) => (
      <View style={[styles.slide, { width, height }]}>
        <Image source={item.image} style={styles.image} contentFit="cover" />
        <LinearGradient
          colors={OVERLAY_COLORS}
          locations={OVERLAY_LOCATIONS}
          style={styles.gradient}
        />
        <LinearGradient
          colors={SCRIM_COLORS}
          locations={SCRIM_LOCATIONS}
          style={styles.gradient}
        />
      </View>
    ),
    [width, height],
  );

  const active = SLIDES[index];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      <Pressable
        onPress={onDone}
        style={[styles.skip, { top: insets.top + 12 }]}
        hitSlop={12}
        accessibilityRole="button">
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + 160, left: 24, right: 24 },
        ]}>
        <Animated.View style={contentStyle}>
          <Text style={styles.title}>{active.title.toUpperCase()}</Text>
          <Text style={styles.subtitle}>{active.subtitle}</Text>
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.key}
              style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        <Pressable
          onPress={goNext}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get started' : 'Next'}>
          <Text style={styles.fabIcon}>{'\u2192'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: BG,
    zIndex: 2000,
  },
  slide: {
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  skip: {
    position: 'absolute',
    right: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
    zIndex: 30,
  },
  skipText: {
    color: ON_SURFACE,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    opacity: 0.85,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    zIndex: 20,
    pointerEvents: 'none',
  },
  title: {
    color: PRIMARY,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    color: ON_SURFACE,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
    maxWidth: 300,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 30,
    pointerEvents: 'box-none',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    height: 4,
    borderRadius: 999,
  },
  dotActive: {
    width: 48,
    backgroundColor: ACCENT,
  },
  dotInactive: {
    width: 24,
    backgroundColor: ON_SURFACE,
    opacity: 0.3,
  },
  fab: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  fabIcon: {
    color: BG,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '700',
  },
});
