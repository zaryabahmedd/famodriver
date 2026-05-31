import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  background: '#fbf9f9',
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#231b00',
  completedBg: '#fffceb',
};

type DocKey = 'licenseFront' | 'licenseBack' | 'selfie' | 'selfieWithCard';

type DocCard = {
  key: DocKey;
  label: string;
};

const DOCS: DocCard[] = [
  { key: 'licenseFront', label: "Driver's License Front" },
  { key: 'licenseBack', label: "Driver's License Back" },
  { key: 'selfie', label: 'Selfie' },
  { key: 'selfieWithCard', label: 'Selfie with Driver License' },
];

type UploadDocumentsProps = {
  onContinue: () => void;
  onBack?: () => void;
};

export function UploadDocuments({ onContinue, onBack }: UploadDocumentsProps) {
  const insets = useSafeAreaInsets();
  const [uploaded, setUploaded] = useState<Record<DocKey, boolean>>({
    licenseFront: true,
    licenseBack: true,
    selfie: false,
    selfieWithCard: false,
  });

  const toggle = (key: DocKey) =>
    setUploaded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="chevron-left" size={26} color={COLORS.onSurface} />
        </Pressable>
        <View style={styles.stepWrap}>
          <Text style={styles.stepText}>SIGN UP · STEP 2/4</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Upload documents</Text>
          <Text style={styles.subtitle}>Clear photos help us verify you faster.</Text>
        </View>

        {/* Upload grid */}
        <View style={styles.grid}>
          {DOCS.map((doc) => {
            const done = uploaded[doc.key];
            return (
              <Pressable
                key={doc.key}
                onPress={() => toggle(doc.key)}
                style={({ pressed }) => [
                  styles.card,
                  done ? styles.cardDone : styles.cardPending,
                  pressed && styles.cardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={doc.label}>
                <View style={[styles.iconCircle, done ? styles.iconCircleDone : styles.iconCirclePending]}>
                  <MaterialIcons
                    name={done ? 'check-circle' : 'add'}
                    size={done ? 28 : 30}
                    color={done ? COLORS.primaryContainer : COLORS.onPrimaryContainer}
                  />
                </View>
                <Text style={[styles.cardLabel, !done && styles.cardLabelPending]}>
                  {doc.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Continue</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(208, 198, 171, 0.4)',
    backgroundColor: COLORS.surface,
  },
  backButton: {
    position: 'absolute',
    left: 14,
    bottom: 8,
    padding: 6,
    borderRadius: 999,
    zIndex: 2,
  },
  stepWrap: {
    alignItems: 'center',
    gap: 6,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
    letterSpacing: 2,
  },
  progressTrack: {
    width: 128,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(208, 198, 171, 0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  heading: {
    gap: 6,
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.onSurfaceVariant,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  card: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  cardDone: {
    backgroundColor: COLORS.completedBg,
    borderWidth: 1,
    borderColor: 'rgba(251, 209, 3, 0.4)',
  },
  cardPending: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(208, 198, 171, 0.6)',
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDone: {
    backgroundColor: COLORS.onSurface,
  },
  iconCirclePending: {
    backgroundColor: COLORS.primaryContainer,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
    color: COLORS.onSurface,
  },
  cardLabelPending: {
    color: COLORS.onSurfaceVariant,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(208, 198, 171, 0.3)',
    backgroundColor: COLORS.surface,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryContainer,
    height: 56,
    borderRadius: 12,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
