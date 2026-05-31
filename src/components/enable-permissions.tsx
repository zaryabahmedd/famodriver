import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  background: '#fbf9f9',
  onSurface: '#1b1c1c',
  secondary: '#5e5e5e',
  secondaryContainer: '#e2e2e2',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryFixedVariant: '#554500',
  outlineVariant: '#d0c6ab',
  surfaceLowest: '#ffffff',
};

type EnablePermissionsProps = {
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
};

const PERMISSIONS = [
  {
    icon: 'location-on' as const,
    title: 'Location',
    description: 'Required to receive nearby delivery requests and provide navigation.',
  },
  {
    icon: 'notifications' as const,
    title: 'Notifications',
    description: 'Stay updated with real-time order alerts and earnings updates.',
  },
  {
    icon: 'photo-camera' as const,
    title: 'Camera',
    description: 'Necessary for scanning documents and taking proof-of-delivery photos.',
  },
];

export function EnablePermissions({ onContinue, onSkip, onBack }: EnablePermissionsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </Pressable>
        <Image
          source={require('@/assets/images/FAMO-logo-dark.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 180 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Illustration */}
        <View style={styles.illustrationWrap}>
          <Image
            source={require('@/assets/images/Bike4.png')}
            style={styles.illustration}
            contentFit="contain"
          />
        </View>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Enable Permissions</Text>
          <Text style={styles.subtitle}>
            To provide the best delivery experience, please enable the following permissions.
          </Text>
        </View>

        {/* Permission cards */}
        <View style={styles.list}>
          {PERMISSIONS.map((p) => (
            <View key={p.title} style={styles.card}>
              <View style={styles.cardIcon}>
                <MaterialIcons name={p.icon} size={24} color={COLORS.onPrimaryFixedVariant} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{p.title}</Text>
                <Text style={styles.cardDescription}>{p.description}</Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={COLORS.outlineVariant}
                style={styles.cardChevron}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#000000" />
        </Pressable>
        <Pressable onPress={onSkip} style={styles.skipBtn} accessibilityRole="button">
          <Text style={styles.skipText}>Not Now</Text>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.secondaryContainer,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 110, height: 32 },
  headerSpacer: { width: 40 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 28,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  illustrationWrap: { alignItems: 'center' },
  illustration: { width: 220, height: 150 },
  heading: { gap: 8 },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: COLORS.onSurface,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.secondary,
    maxWidth: '92%',
  },
  list: { gap: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  cardIcon: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  cardDescription: { fontSize: 14, lineHeight: 18, color: COLORS.secondary },
  cardChevron: { alignSelf: 'center' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.secondaryContainer,
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
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#000000' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 16, fontWeight: '600', color: COLORS.secondary },
});
