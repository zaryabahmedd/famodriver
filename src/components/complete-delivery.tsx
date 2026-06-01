import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
    NativeSyntheticEvent,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputKeyPressEventData,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import type { Delivery } from '@/hooks/rider-api';

const COLORS = {
  background: '#fbf9f9',
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
  surfaceContainer: '#efeded',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  secondary: '#5e5e5e',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  fammoYellow: '#fbd103',
};

const OTP_LENGTH = 4;

type CompleteDeliveryProps = {
  onConfirm: () => void;
  onBack: () => void;
  delivery?: Delivery | null;
};

export function CompleteDelivery({ onConfirm, onBack }: CompleteDeliveryProps) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={22} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.title}>Complete delivery</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Recipient OTP */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.dot} />
            <Text style={styles.sectionTitle}>Recipient OTP</Text>
          </View>
          <View style={styles.otpRow}>
            {otp.map((value, index) => (
              <TextInput
                key={index}
                ref={(el) => {
                  inputs.current[index] = el;
                }}
                value={value}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                style={[styles.otpInput, value ? styles.otpInputFilled : styles.otpInputEmpty]}
              />
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Delivery Photo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.dot} />
            <Text style={styles.sectionTitle}>Delivery Photo</Text>
          </View>
          <Pressable style={styles.photoCard} accessibilityRole="button">
            <View style={styles.photoIcon}>
              <MaterialIcons name="photo-camera" size={32} color={COLORS.onPrimaryContainer} />
            </View>
            <Text style={styles.photoTitle}>Take photo</Text>
            <Text style={styles.photoHint}>Ensure the package is clearly visible</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Recipient Signature */}
        <View style={styles.section}>
          <View style={styles.signatureHeaderRow}>
            <View style={styles.sectionHeader}>
              <View style={styles.dot} />
              <Text style={styles.sectionTitle}>Recipient Signature</Text>
            </View>
            <Pressable accessibilityRole="button">
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>
          <View style={styles.signatureCard}>
            <Svg width="100%" height="100%" viewBox="0 0 400 200">
              <Path
                d="M40,120 C80,80 120,160 160,100 C200,40 240,140 280,110 C320,80 360,120 380,90"
                fill="none"
                stroke={COLORS.primary}
                strokeLinecap="round"
                strokeWidth={3}
              />
            </Svg>
            <Text style={styles.signatureHint}>Sign inside the box</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          onPress={onConfirm}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Confirm delivery</Text>
          <MaterialIcons name="arrow-forward" size={22} color="#000000" />
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
    zIndex: 1700,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: COLORS.onSurface },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 32,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  section: { gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'center',
  },
  otpInput: {
    width: 52,
    height: 56,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.onSurface,
    borderRadius: 12,
    borderWidth: 2,
  },
  otpInputFilled: {
    backgroundColor: 'rgba(251,209,3,0.1)',
    borderColor: COLORS.primaryContainer,
  },
  otpInputEmpty: {
    backgroundColor: COLORS.surfaceLowest,
    borderColor: COLORS.outlineVariant,
  },
  divider: { height: 1, backgroundColor: COLORS.surfaceContainer },
  photoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 16 / 9,
    gap: 8,
  },
  photoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  photoTitle: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  photoHint: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },
  signatureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  signatureCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
    aspectRatio: 2,
    padding: 24,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  signatureHint: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.outline,
    opacity: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
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
    width: '100%',
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.fammoYellow,
    shadowColor: COLORS.fammoYellow,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaPressed: { opacity: 0.95, transform: [{ scale: 0.97 }] },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#000000' },
});
