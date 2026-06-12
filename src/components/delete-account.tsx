import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
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

import { clearLocalAvatar, deleteRiderAccount, verifyRiderPassword } from '@/hooks/rider-account-api';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerHigh: '#e9e8e7',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',
};

type DeleteAccountProps = {
  onBack: () => void;
  onDeleted: () => void;
};

export function DeleteAccount({ onBack, onDeleted }: DeleteAccountProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canVerify = email.trim().length > 0 && password.length > 0 && !verifying;

  const handleVerify = async () => {
    setError(null);
    setVerifying(true);
    try {
      const token = await verifyRiderPassword(email, password);
      if (!token) {
        setVerified(false);
        setVerifiedToken(null);
        setError('Email or password is incorrect. Please try again.');
        return;
      }
      setVerifiedToken(token);
      setVerified(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (!verified) return;
    setError(null);
    setDeleting(true);
    try {
      const result = await deleteRiderAccount(verifiedToken ?? undefined);
      if (!result.ok) {
        if (result.reason === 'active_delivery') {
          setError('You have an active delivery in progress. Finish or cancel it before deleting your account.');
        } else {
          setError('Could not delete account. Please try again.');
        }
        setDeleting(false);
        return;
      }
      await clearLocalAvatar();
      onDeleted();
    } catch {
      setError('Something went wrong. Please try again.');
      setDeleting(false);
    }
  };

  // Editing the credentials again invalidates a prior verification.
  const onEmailChange = (v: string) => {
    setEmail(v);
    if (verified) {
      setVerified(false);
      setVerifiedToken(null);
    }
  };
  const onPasswordChange = (v: string) => {
    setPassword(v);
    if (verified) {
      setVerified(false);
      setVerifiedToken(null);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Delete account</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.warningCard}>
            <MaterialIcons name="warning-amber" size={24} color={COLORS.error} />
            <Text style={styles.warningText}>
              Deleting your account is permanent. Your profile, documents and bike details will be removed and
              cannot be recovered. You will need to sign up again to use the app.
            </Text>
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <MaterialIcons name="mail-outline" size={20} color={COLORS.outline} />
            <TextInput
              value={email}
              onChangeText={onEmailChange}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.outline}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <MaterialIcons name="lock-outline" size={20} color={COLORS.outline} />
            <TextInput
              value={password}
              onChangeText={onPasswordChange}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.outline}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={styles.input}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} accessibilityRole="button">
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={20}
                color={COLORS.outline}
              />
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {verified ? (
            <View style={styles.verifiedBanner}>
              <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
              <Text style={styles.verifiedText}>Identity confirmed. You can now delete your account.</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleVerify}
              disabled={!canVerify}
              style={({ pressed }) => [
                styles.verifyBtn,
                pressed && styles.pressed,
                !canVerify && { opacity: 0.5 },
              ]}
              accessibilityRole="button">
              {verifying ? (
                <ActivityIndicator color={COLORS.onPrimaryContainer} />
              ) : (
                <Text style={styles.verifyText}>Verify credentials</Text>
              )}
            </Pressable>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleDelete}
            disabled={!verified || deleting}
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && styles.pressed,
              (!verified || deleting) && { opacity: 0.5 },
            ]}
            accessibilityRole="button">
            {deleting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="delete-forever" size={20} color="#ffffff" />
                <Text style={styles.deleteText}>Confirm & Delete Account</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.surface,
    zIndex: 1800,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.errorContainer,
    marginBottom: 8,
  },
  warningText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.onErrorContainer },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, marginTop: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  input: { flex: 1, fontSize: 16, color: COLORS.onSurface },
  errorText: { fontSize: 13, color: COLORS.error, marginTop: 2 },
  verifyBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  verifyText: { fontSize: 16, fontWeight: '700', color: COLORS.onPrimaryContainer },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff7d6',
    marginTop: 8,
  },
  verifiedText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  pressed: { opacity: 0.85 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  deleteText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
});
