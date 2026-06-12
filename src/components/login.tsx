import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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

import { BACKEND_URL, callBackend } from '@/hooks/backend-client';
import { getRiderProfile } from '@/hooks/rider-account-api';
import { clearRiderSession, setRiderSession } from '@/hooks/rider-session';

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
  onPrimaryContainer: '#6d5a00',
};

const LOGO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA5P3-Ty1oktdSZt17KS9WCWsISnijjmrFzEV2vSkor-TNwXu2TkgJXRV_EarITA6nN0GYjRuNgD8ZhTdXAmXvMVeiR_ZXJ4Qodyo4Ph0qfuwSzXKnFaPBFiLYpvc7KLZAT90Fm1I3tSvmTtOuWwD-QaMtFkB0KGOZZMzQ2X1xmPCpKe5xCrhft-NJUhgCOQNuXZr5MV1ba-4UVttgd6Cd-E5Tbeu_t8fR59s_SWsZI3Xx5ktR1La9glgSeJCNnhhd_-ZcDErqRZZE';

type LoginProps = {
  note?: string | null;
  onLogin: () => void;
  onSignUp?: () => void;
  onForgotPassword?: () => void;
  onBack?: () => void;
};

export function Login({ note, onLogin, onSignUp, onForgotPassword, onBack }: LoginProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please fill in both email and password.');
      return;
    }
    setLoading(true);
    console.log('[Login] Attempting login for:', email.trim().toLowerCase());
    try {
      // Authenticate against the Node backend. Passwords are bcrypt-verified
      // server-side; on success we get an opaque session token (30-day life)
      // which is stored in the keystore and sent as a Bearer header to the
      // other rider-* endpoints.
      const urlToTest = `${BACKEND_URL}/rider-auth`;
      const { data, error } = await callBackend('rider-auth', {
        action: 'login',
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data?.ok || !data?.token) {
        const reason = (data?.error as string | undefined) ?? error?.message;
        console.error('[Login] Login failed:', { error, data, reason });
        if (reason === 'invalid_credentials' || reason === 'login_failed') {
          alert('Incorrect email or password.');
        } else if (reason === 'not_approved') {
          const status = data?.status as string | undefined;
          if (status === 'pending_approval') {
            alert('Your account is pending admin approval. You will be notified once approved.');
          } else if (status === 'rejected') {
            alert('Your account application has been rejected. Please contact support.');
          } else {
            alert('Your account is not yet approved. Please complete your profile and submit your application.');
          }
        } else if (reason === 'timeout') {
          alert(`Connection timed out when reaching backend at ${urlToTest}.\n\nPlease ensure your Node.js backend is running at that address and accessible by this device.`);
        } else {
          alert(`Could not log in.\nDetails: ${reason}\nURL: ${urlToTest}`);
        }
        setLoading(false);
        return;
      }

      console.log('[Login] Login successful. Saving session for rider:', data.rider_id);
      await setRiderSession({
        token: data.token as string,
        riderId: data.rider_id as string,
        expiresAt: data.expires_at as string,
      });

      // Block access until the admin approves the rider account.
      const profile = await getRiderProfile();
      if (!profile || profile.status !== 'approved') {
        await clearRiderSession();
        if (profile?.status === 'pending_approval' || profile?.status === 'pending_verification') {
          alert('Your account is pending admin approval. You will be notified once approved.');
        } else if (profile?.status === 'rejected') {
          alert('Your application has been rejected. Please contact support.');
        } else {
          alert('Your account has not been approved yet. Please complete your application.');
        }
        setLoading(false);
        return;
      }

      onLogin();
    } catch (err: any) {
      console.error('[Login] Unexpected error during login flow:', err);
      alert(`An unexpected error occurred during login. Please try again.\n\nError: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {onBack ? (
            <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
              <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
            </Pressable>
          ) : null}

          <View style={styles.header}>
            <Image source={{ uri: LOGO_URI }} style={styles.logo} contentFit="contain" />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Log in to continue delivering with FAMO.</Text>
          </View>

          {note ? (
            <View style={styles.noteBox}>
              <MaterialIcons name="info-outline" size={20} color="#715d00" />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
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
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="lock" size={20} color={COLORS.outline} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.outline}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.input}
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={COLORS.outline}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable onPress={onForgotPassword} style={styles.forgotBtn} accessibilityRole="button">
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed, loading && { opacity: 0.6 }]}
              accessibilityRole="button">
              <Text style={styles.primaryText}>{loading ? 'Logging in...' : 'Log in'}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Pressable onPress={onSignUp} accessibilityRole="button">
              <Text style={styles.footerLink}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 32,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  header: { alignItems: 'center', gap: 8 },
  logo: { width: 120, height: 48, marginBottom: 8 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: COLORS.onSurface },
  subtitle: { fontSize: 16, lineHeight: 24, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  form: { gap: 16 },
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
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  primaryBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  primaryText: { fontSize: 16, fontWeight: '700', color: COLORS.onPrimaryContainer },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.outlineVariant },
  dividerText: { fontSize: 14, color: COLORS.outline },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  googleBtnPressed: { opacity: 0.85 },
  googleText: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 'auto',
  },
  footerText: { fontSize: 14, color: COLORS.onSurfaceVariant },
  footerLink: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fffbe5',
    borderColor: '#715d00',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: -8,
  },
  noteText: {
    color: '#715d00',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
