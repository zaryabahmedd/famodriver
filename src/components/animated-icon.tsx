import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;
const SPLASH_DURATION = 1800;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), SPLASH_DURATION);

    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  const logoSplashKeyframe = new Keyframe({
    0: {
      opacity: 0,
      transform: [{ scale: 0.95 }],
    },
    100: {
      opacity: 1,
      transform: [{ scale: 1 }],
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
  });

  return (
    <Animated.View style={styles.splashScreen}>
      <View style={styles.splashContent}>
        <Animated.View
          entering={logoSplashKeyframe.duration(1200)}
          style={styles.splashLogoContainer}
        >
          <Image
            accessibilityLabel="FAMO Logo"
            contentFit="contain"
            source={require('@/assets/images/FAMO-logo-dark.png')}
            style={styles.splashLogo}
          />
        </Animated.View>
      </View>
      <Text style={styles.splashFooter}>Rider App by FAMO</Text>
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    padding: 24,
    zIndex: 1000,
  },
  splashContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  splashLogoContainer: {
    maxWidth: 240,
    width: '100%',
  },
  splashLogo: {
    aspectRatio: 2821 / 1102,
    width: '100%',
  },
  splashFooter: {
    bottom: 48,
    color: 'rgba(90, 65, 54, 0.5)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 20,
    position: 'absolute',
    textAlign: 'center',
    textTransform: 'uppercase',
    width: '100%',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  backgroundSolidColor: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#208AEF',
    zIndex: 1000,
  },
});
