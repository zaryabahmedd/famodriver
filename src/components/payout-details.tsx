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

import { submitRiderApplication, updateRiderProfile } from '@/hooks/rider-account-api';


const COLORS = {
  background: '#fbf9f9',
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  secondary: '#5e5e5e',
  secondaryContainer: '#e2e2e2',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  cardBg: '#fff9db',
};

const BANKS = ['Access', 'GTBank', 'Zenith', 'UBA', 'First Bank', 'OPay'];

type PayoutDetailsProps = {
  riderId?: string;
  onContinue: () => void;
  onBack?: () => void;
};

export function PayoutDetails({ onContinue, onBack }: PayoutDetailsProps) {
  const insets = useSafeAreaInsets();
  const [bank, setBank] = useState('');
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [bvn, setBvn] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectChip = (name: string) => {
    setSelectedChip(name);
    setBank(name);
  };

  const handleContinue = async () => {
    if (!bank || !accountNumber || !bvn) {
      alert('Please fill in all layout details (Bank, Account Number, BVN/NIN).');
      return;
    }
    setLoading(true);
    try {
      const rider = await updateRiderProfile({
        payout_bank: bank,
        payout_account_number: accountNumber,
        payout_bvn: bvn,
      });
      if (!rider) {
        alert('Could not save your payout details. Please try again.');
        return;
      }
      const submitted = await submitRiderApplication();
      if (!submitted) {
        alert('Could not submit your application. Please try again.');
        return;
      }
      onContinue();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Sign up · Step 5/5</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* Heading */}
          <View style={styles.heading}>
            <Text style={styles.title}>Payout details</Text>
            <Text style={styles.subtitle}>
              Add a Nigerian bank account and verify it with BVN or NIN.
            </Text>
          </View>

          {/* Account Holder */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ACCOUNT HOLDER</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value="Rashid Ahmed"
                editable={false}
                style={[styles.input, styles.inputDisabled]}
              />
            </View>
          </View>

          {/* Bank */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>BANK</Text>
            <View style={[styles.inputWrap, focused === 'bank' && styles.inputWrapFocused]}>
              <TextInput
                value={bank}
                onChangeText={(t) => {
                  setBank(t);
                  setSelectedChip(null);
                }}
                onFocus={() => setFocused('bank')}
                onBlur={() => setFocused(null)}
                placeholder="Search all Nigerian banks"
                placeholderTextColor={COLORS.outline}
                style={styles.input}
              />
            </View>
            <View style={styles.chips}>
              {BANKS.map((name) => {
                const active = selectedChip === name;
                return (
                  <Pressable
                    key={name}
                    onPress={() => selectChip(name)}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Account Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>ACCOUNT NUMBER</Text>
            <View style={[styles.inputWrap, focused === 'acct' && styles.inputWrapFocused]}>
              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                onFocus={() => setFocused('acct')}
                onBlur={() => setFocused(null)}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>

          {/* BVN or NIN */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>BVN OR NIN</Text>
            <View style={[styles.inputWrap, focused === 'bvn' && styles.inputWrapFocused]}>
              <TextInput
                value={bvn}
                onChangeText={setBvn}
                onFocus={() => setFocused('bvn')}
                onBlur={() => setFocused(null)}
                placeholder="Enter BVN/NIN for account match"
                placeholderTextColor={COLORS.outline}
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>

          {/* Authentication status card */}
          <View style={styles.authCard}>
            <View style={styles.authIcon}>
              <MaterialIcons name="check" size={18} color={COLORS.primaryContainer} />
            </View>
            <View style={styles.authTextWrap}>
              <Text style={styles.authTitle}>Account authentication</Text>
              <Text style={styles.authBody}>
                Match bank, account number and BVN/NIN before approval.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleContinue}
          disabled={loading}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, loading && { opacity: 0.6 }]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>{loading ? 'Saving...' : 'Continue'}</Text>
          {!loading && <MaterialIcons name="arrow-forward" size={20} color="#000000" />}
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
  flex: {
    flex: 1,
  },
  header: {
    paddingBottom: 0,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.secondaryContainer,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56,
  },
  backButton: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  headerSpacer: {
    width: 32,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.secondaryContainer,
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryContainer,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  heading: {
    gap: 8,
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
    color: COLORS.secondary,
  },
  fieldGroup: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    color: COLORS.secondary,
  },
  inputWrap: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  inputWrapFocused: {
    borderColor: COLORS.onSurface,
  },
  input: {
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  inputDisabled: {
    color: COLORS.onSurfaceVariant,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  chipActive: {
    backgroundColor: COLORS.onSurface,
    borderColor: COLORS.onSurface,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  authCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
  },
  authIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: COLORS.onSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authTextWrap: {
    flex: 1,
    gap: 2,
  },
  authTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  authBody: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.secondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.secondaryContainer,
    backgroundColor: COLORS.background,
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
