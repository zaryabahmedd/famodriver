import { MaterialIcons } from '@expo/vector-icons';
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
};

type ForgotPasswordProps = {
  onBack?: () => void;
  onDone?: () => void;
};

export function ForgotPassword({ onBack, onDone }: ForgotPasswordProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Reset password</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {sent ? (
            <View style={styles.confirmation}>
              <View style={styles.successIcon}>
                <MaterialIcons name="mark-email-read" size={40} color={COLORS.success} />
              </View>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                We sent a password reset link to{'\n'}
                <Text style={styles.emailStrong}>{email || 'your email'}</Text>.
              </Text>
              <Pressable
                onPress={onDone}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
                accessibilityRole="button">
                <Text style={styles.primaryText}>Back to login</Text>
              </Pressable>
              <Pressable onPress={() => setSent(false)} accessibilityRole="button">
                <Text style={styles.resendText}>Didn&apos;t get it? Try again</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.lockIcon}>
                  <MaterialIcons name="lock-reset" size={36} color={COLORS.onPrimaryContainer} />
                </View>
                <Text style={styles.title}>Forgot password?</Text>
                <Text style={styles.subtitle}>
                  Enter the email linked to your account and we&apos;ll send you a reset link.
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
                    style={styles.input}
                  />
                </View>
              </View>

              <Pressable
                onPress={() => setSent(true)}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
                accessibilityRole="button">
                <Text style={styles.primaryText}>Send reset link</Text>
              </Pressable>
            </>
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
  resendText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
