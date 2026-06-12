import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef } from 'react';
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
import { callBackend } from '@/hooks/backend-client';

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
  success: '#176d3a',
  successContainer: '#d7f5e1',
  error: '#ba1a1a',
};

const CODE_LENGTH = 6;

type Step = 'email' | 'code' | 'password' | 'done';

type ForgotPasswordProps = {
  onBack?: () => void;
  onDone?: () => void;
};

export function ForgotPassword({ onBack, onDone }: ForgotPasswordProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(''));
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);

  const code = digits.join('');

  // --- Step 1: send the OTP -------------------------------------------------
  const handleSendCode = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { shouldCreateUser: false },
      });
      if (otpErr) {
        // shouldCreateUser:false errors if the email has no Supabase auth row.
        // Surface a generic message so we don't leak which emails exist.
        setError('We could not send a code to that email. Check the address and try again.');
        setBusy(false);
        return;
      }
      setEmail(normalized);
      setBusy(false);
      setStep('code');
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  // --- Step 2: verify the OTP ----------------------------------------------
  const setDigit = (index: number, value: string) => {
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

  const handleVerifyCode = async () => {
    if (code.length !== CODE_LENGTH) {
      setError('Enter the 6-digit code.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });
      const token = data?.session?.access_token ?? null;
      if (verifyErr || !token) {
        setError('That code is invalid or expired. Please try again.');
        setBusy(false);
        return;
      }
      setAccessToken(token);
      setBusy(false);
      setStep('password');
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  // --- Step 3: save the new password via our backend ------------------------
  const handleSavePassword = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!accessToken) {
      setError('Your session expired. Please start over.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data, error: resetErr } = await callBackend('rider-auth', {
        action: 'reset_password',
        accessToken,
        password,
      });
      if (resetErr || !data?.ok) {
        const reason = (data?.error as string | undefined) ?? resetErr?.message;
        if (reason === 'weak_password') {
          setError('Password must be at least 8 characters.');
        } else if (reason === 'invalid_token') {
          setError('Your verification expired. Please start over.');
        } else if (reason === 'rider_not_found') {
          setError('No rider account is linked to this email.');
        } else {
          setError('Could not update your password. Please try again.');
        }
        setBusy(false);
        return;
      }
      // Done — drop the temporary Supabase session, old password is now dead.
      await supabase.auth.signOut();
      setBusy(false);
      setStep('done');
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const appBarTitle =
    step === 'code' ? 'Enter code' : step === 'password' ? 'New password' : 'Reset password';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>{appBarTitle}</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* STEP 1 — email */}
          {step === 'email' && (
            <>
              <View style={styles.header}>
                <View style={styles.lockIcon}>
                  <MaterialIcons name="lock-reset" size={36} color={COLORS.onPrimaryContainer} />
                </View>
                <Text style={styles.title}>Forgot password?</Text>
                <Text style={styles.subtitle}>
                  Enter the email linked to your account and we&apos;ll send you a 6-digit code.
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="mail" size={20} color={COLORS.outline} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="rider@example.com"
                    placeholderTextColor={COLORS.outline}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!busy}
                    style={styles.input}
                  />
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                onPress={handleSendCode}
                disabled={busy}
                style={({ pressed }) => [styles.primaryBtn, (pressed || busy) && styles.primaryBtnPressed]}
                accessibilityRole="button">
                <Text style={styles.primaryText}>{busy ? 'Sending…' : 'Send code'}</Text>
              </Pressable>
            </>
          )}

          {/* STEP 2 — code */}
          {step === 'code' && (
            <>
              <View style={styles.header}>
                <View style={styles.lockIcon}>
                  <MaterialIcons name="mark-email-unread" size={36} color={COLORS.onPrimaryContainer} />
                </View>
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.subtitle}>
                  We sent a 6-digit code to{'\n'}
                  <Text style={styles.emailStrong}>{email}</Text>.
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
                    editable={!busy}
                  />
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                onPress={handleVerifyCode}
                disabled={busy}
                style={({ pressed }) => [styles.primaryBtn, (pressed || busy) && styles.primaryBtnPressed]}
                accessibilityRole="button">
                <Text style={styles.primaryText}>{busy ? 'Verifying…' : 'Verify & continue'}</Text>
              </Pressable>

              <Pressable onPress={handleSendCode} disabled={busy} accessibilityRole="button">
                <Text style={styles.resendText}>Didn&apos;t get it? Resend code</Text>
              </Pressable>
            </>
          )}

          {/* STEP 3 — new password */}
          {step === 'password' && (
            <>
              <View style={styles.header}>
                <View style={styles.lockIcon}>
                  <MaterialIcons name="password" size={36} color={COLORS.onPrimaryContainer} />
                </View>
                <Text style={styles.title}>Set a new password</Text>
                <Text style={styles.subtitle}>
                  Choose a new password for{'\n'}
                  <Text style={styles.emailStrong}>{email}</Text>.
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="lock" size={20} color={COLORS.outline} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor={COLORS.outline}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!busy}
                    style={styles.input}
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} accessibilityRole="button">
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={COLORS.outline}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="lock" size={20} color={COLORS.outline} />
                  <TextInput
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="Re-enter your new password"
                    placeholderTextColor={COLORS.outline}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!busy}
                    style={styles.input}
                  />
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                onPress={handleSavePassword}
                disabled={busy}
                style={({ pressed }) => [styles.primaryBtn, (pressed || busy) && styles.primaryBtnPressed]}
                accessibilityRole="button">
                <Text style={styles.primaryText}>{busy ? 'Saving…' : 'Save new password'}</Text>
              </Pressable>
            </>
          )}

          {/* STEP 4 — done */}
          {step === 'done' && (
            <View style={styles.confirmation}>
              <View style={styles.successIcon}>
                <MaterialIcons name="check-circle" size={40} color={COLORS.success} />
              </View>
              <Text style={styles.title}>Password updated</Text>
              <Text style={styles.subtitle}>
                Your password has been changed. Please log in with your new password.
              </Text>
              <Pressable
                onPress={onDone}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
                accessibilityRole="button">
                <Text style={styles.primaryText}>Back to login</Text>
              </Pressable>
            </View>
          )}
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
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: COLORS.onSurface, textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
  },
  input: { flex: 1, fontSize: 16, color: COLORS.onSurface, paddingVertical: 0 },
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
  confirmation: { alignItems: 'center', gap: 16 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailStrong: { fontWeight: '700', color: COLORS.onSurface },
  resendText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, textAlign: 'center' },
});
