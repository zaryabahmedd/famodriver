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
    type KeyboardTypeOptions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoogleIcon } from '@/components/google-icon';

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
};

type Field = {
  key: 'name' | 'email' | 'phone' | 'password';
  label: string;
  placeholder: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words';
};

const FIELDS: Field[] = [
  {
    key: 'name',
    label: 'Full Name',
    placeholder: 'Enter your full name',
    icon: 'person',
    autoCapitalize: 'words',
  },
  {
    key: 'email',
    label: 'Email Address',
    placeholder: 'rider@example.com',
    icon: 'mail',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
  },
  {
    key: 'phone',
    label: 'Phone Number',
    placeholder: '+1 (555) 000-0000',
    icon: 'phone',
    keyboardType: 'phone-pad',
  },
  {
    key: 'password',
    label: 'Password',
    placeholder: 'Choose a secure password',
    icon: 'lock',
    autoCapitalize: 'none',
  },
];

type SignUpProps = {
  onContinue: (values: { name: string; email: string; phone: string; password: string }) => void;
  onBack?: () => void;
  onLogIn?: () => void;
};

export function SignUp({ onContinue, onBack, onLogIn }: SignUpProps) {
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState({ name: '', email: '', phone: '', password: '' });
  const [agreed, setAgreed] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleContinue = () => {
    if (!values.name || !values.email || !values.phone || !values.password) {
      alert('Please fill in all fields.');
      return;
    }
    if (!agreed) {
      alert('Please agree to the Terms of Service and/or Privacy Policy.');
      return;
    }
    onContinue(values);
  };

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
          <Text style={styles.stepText}>SIGN UP · STEP 1/4</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* Brand */}
          <View style={styles.brand}>
            <Image
              source={require('@/assets/images/FAMO-logo-dark.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          {/* Heading */}
          <View style={styles.heading}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the FAMO team and start earning.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {FIELDS.map((field) => (
              <View key={field.key} style={styles.fieldGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View
                  style={[
                    styles.inputWrap,
                    focused === field.key && styles.inputWrapFocused,
                  ]}>
                  <MaterialIcons
                    name={field.icon}
                    size={20}
                    color={focused === field.key ? COLORS.onSurface : COLORS.onSurfaceVariant}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={values[field.key]}
                    onChangeText={(text) =>
                      setValues((prev) => ({ ...prev, [field.key]: text }))
                    }
                    onFocus={() => setFocused(field.key)}
                    onBlur={() => setFocused(null)}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.outline}
                    keyboardType={field.keyboardType}
                    autoCapitalize={field.autoCapitalize}
                    secureTextEntry={field.key === 'password'}
                    style={styles.input}
                  />
                </View>
              </View>
            ))}

            {/* Terms */}
            <Pressable
              style={styles.terms}
              onPress={() => setAgreed((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <MaterialIcons name="check" size={14} color="#000000" />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.link}>Terms of Service</Text> and{' '}
                <Text style={styles.link}>Privacy Policy</Text>.
              </Text>
            </Pressable>

            {/* Primary CTA */}
            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              accessibilityRole="button">
              <Text style={styles.ctaText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#000000" />
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.google, pressed && styles.googlePressed]}
              accessibilityRole="button">
              <GoogleIcon size={20} />
              <Text style={styles.googleText}>Continue with Google</Text>
            </Pressable>

            <Text style={styles.loginRow}>
              Already have an account?{' '}
              <Text style={styles.loginLink} onPress={onLogIn}>
                Log In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
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
    width: '25%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 150,
    height: 56,
  },
  heading: {
    gap: 4,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.onSurface,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
  },
  form: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputWrapFocused: {
    borderColor: COLORS.onSurface,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primaryContainer,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.onSurfaceVariant,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 6,
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  footer: {
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(208, 198, 171, 0.5)',
  },
  dividerText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  google: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLowest,
  },
  googlePressed: {
    backgroundColor: '#efeded',
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  loginRow: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
