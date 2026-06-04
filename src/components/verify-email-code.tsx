import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/hooks/supabase-client';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  error: '#ba1a1a',
};

const CODE_LENGTH = 6;

type VerifyEmailCodeProps = {
  email: string;
  onVerified: () => void;
  onBack?: () => void;
};

/**
 * Email verification step: the rider enters the 6-digit code Supabase Auth
 * emailed to them (sent via signInWithOtp in the sign-up flow). Verifying
 * confirms ownership of the address before they can continue to documents.
 */
export function VerifyEmailCode({ email, onVerified, onBack }: VerifyEmailCodeProps) {
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);

  const code = digits.join('');

  const setDigit = (index: number, value: string) => {
    // Allow pasting the whole code into one box.
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const next = Array(CODE_LENGTH).fill('');
      cleaned
        .slice(0, CODE_LENGTH)
        .split('')
        .forEach((c, i) => (next[i] = c));
      setDigits(next);
      const last = Math.min(cleaned.length, CODE_LENGTH) - 1;
      inputs.current[last]?.focus();
      return;
    }
    setError(null);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    if (cleaned && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) {
      setError('Enter the 6-digit code.');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });
      if (verifyErr) {
        setError('That code is invalid or expired. Please try again.');
        setVerifying(false);
        return;
      }
      // Email confirmed. We don't need the Supabase Auth session for the custom
      // rider auth, so clear it and move on.
      await supabase.auth.signOut();
      setVerifying(false);
      onVerified();
    } catch {
      setError('Something went wrong. Please try again.');
      setVerifying(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Verify email</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.mailIcon}>
              <MaterialIcons name="mark-email-unread" size={36} color={COLORS.onPrimaryContainer} />
            </View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.emailStrong}>{email || 'your email'}</Text>.
            </Text>
          </View>

          <View style={styles.codeRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={digit}
                onChangeText={(v) => setDigit(i, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                style={[styles.codeBox, !!error && styles.codeBoxError]}
                autoFocus={i === 0}
                textContentType="oneTimeCode"
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            onPress={handleVerify}
            disabled={verifying}
            style={({ pressed }) => [
              styles.primaryBtn,
              (pressed || verifying) && styles.primaryBtnPressed,
            ]}
            accessibilityRole="button">
            <Text style={styles.primaryText}>{verifying ? 'Verifying…' : 'Verify & continue'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.surface,
    zIndex: 1700,
  },
  flex: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 28,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: { alignItems: 'center', gap: 12 },
  mailIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: COLORS.onSurface, textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  emailStrong: { fontWeight: '700', color: COLORS.onSurface },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  codeBox: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  codeBoxError: { borderColor: COLORS.error },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center', marginTop: -16 },
  primaryBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  primaryText: { fontSize: 16, fontWeight: '700', color: COLORS.onPrimaryContainer },
});
