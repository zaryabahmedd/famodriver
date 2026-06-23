import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
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
  error: '#ba1a1a',
};

const NIGERIAN_BANKS = [
  'Access Bank Plc',
  'Accion Microfinance Bank',
  'ALAT',
  'Carbon Microfinance Bank',
  'Citibank Nigeria Limited',
  'Ecobank Nigeria Limited',
  'Eyowo',
  'FairMoney Microfinance Bank',
  'Fidelity Bank Plc',
  'First Bank of Nigeria Limited',
  'First City Monument Bank (FCMB)',
  'Globus Bank Limited',
  'Guaranty Trust Bank (GTBank)',
  'Jaiz Bank Plc',
  'Keystone Bank Limited',
  'Kuda Bank',
  'LAPO Microfinance Bank',
  'Lotus Bank Limited',
  'Mintyn',
  'Moniepoint',
  'Nova Merchant Bank',
  'OPay',
  'Optimus Bank Limited',
  'PalmPay',
  'Parallex Bank Limited',
  'Polaris Bank Limited',
  'PremiumTrust Bank Limited',
  'Providus Bank Limited',
  'Rubies Bank',
  'Signature Bank Limited',
  'Sparkle',
  'Stanbic IBTC Bank Plc',
  'Standard Chartered Bank Nigeria Limited',
  'Sterling Bank Limited',
  'SunTrust Bank Nigeria Limited',
  'TAJBank Limited',
  'Titan Trust Bank Limited',
  'Union Bank of Nigeria Plc',
  'United Bank for Africa (UBA)',
  'Unity Bank Plc',
  'VBank',
  'VFD Microfinance Bank',
  'Wema Bank Plc',
  'Zenith Bank Plc',
];

type PayoutDetailsProps = {
  riderId?: string;
  onContinue: () => void;
  onBack?: () => void;
};

export function PayoutDetails({ onContinue, onBack }: PayoutDetailsProps) {
  const insets = useSafeAreaInsets();
  const [accountHolder, setAccountHolder] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bvn, setBvn] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return NIGERIAN_BANKS;
    const q = bankSearch.toLowerCase();
    return NIGERIAN_BANKS.filter((b) => b.toLowerCase().includes(q));
  }, [bankSearch]);

  const selectBank = useCallback((name: string) => {
    setBank(name);
    setBankSearch('');
    setShowBankPicker(false);
  }, []);

  const handleContinue = async () => {
    if (!accountHolder.trim()) {
      alert('Please enter the account holder name.');
      return;
    }
    if (!bank) {
      alert('Please select a bank.');
      return;
    }
    if (!accountNumber.trim()) {
      alert('Please enter your account number.');
      return;
    }
    if (!bvn.trim()) {
      alert('Please enter your BVN or NIN.');
      return;
    }
    setLoading(true);
    try {
      const rider = await updateRiderProfile({
        payout_account_holder: accountHolder.trim(),
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
            <Text style={styles.label}>
              ACCOUNT HOLDER <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputWrap, focused === 'holder' && styles.inputWrapFocused]}>
              <TextInput
                value={accountHolder}
                onChangeText={setAccountHolder}
                onFocus={() => setFocused('holder')}
                onBlur={() => setFocused(null)}
                placeholder="Enter account holder name"
                placeholderTextColor={COLORS.outline}
                autoCapitalize="words"
                style={styles.input}
              />
            </View>
          </View>

          {/* Bank */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              BANK <Text style={styles.required}>*</Text>
            </Text>
            <Pressable
              onPress={() => setShowBankPicker(true)}
              style={[styles.inputWrap, styles.dropdownWrap]}>
              <Text style={bank ? styles.dropdownText : styles.dropdownPlaceholder}>
                {bank || 'Select your bank'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.secondary} />
            </Pressable>
          </View>

          {/* Account Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              ACCOUNT NUMBER <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputWrap, focused === 'acct' && styles.inputWrapFocused]}>
              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                onFocus={() => setFocused('acct')}
                onBlur={() => setFocused(null)}
                placeholder="Enter your account number"
                placeholderTextColor={COLORS.outline}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>

          {/* BVN or NIN */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              BVN OR NIN <Text style={styles.required}>*</Text>
            </Text>
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

      {/* Bank Picker Modal */}
      <Modal
        visible={showBankPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBankPicker(false)}>
        <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Bank</Text>
            <Pressable
              onPress={() => {
                setBankSearch('');
                setShowBankPicker(false);
              }}
              hitSlop={10}>
              <MaterialIcons name="close" size={24} color={COLORS.onSurface} />
            </Pressable>
          </View>

          <View style={styles.modalSearchWrap}>
            <MaterialIcons name="search" size={20} color={COLORS.outline} style={styles.searchIcon} />
            <TextInput
              value={bankSearch}
              onChangeText={setBankSearch}
              placeholder="Search banks..."
              placeholderTextColor={COLORS.outline}
              autoFocus
              style={styles.modalSearchInput}
            />
            {bankSearch.length > 0 && (
              <Pressable onPress={() => setBankSearch('')} hitSlop={8}>
                <MaterialIcons name="cancel" size={18} color={COLORS.outline} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredBanks}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No banks found</Text>
            }
            renderItem={({ item }) => {
              const selected = item === bank;
              return (
                <Pressable
                  onPress={() => selectBank(item)}
                  style={[styles.bankRow, selected && styles.bankRowSelected]}>
                  <Text style={[styles.bankRowText, selected && styles.bankRowTextSelected]}>
                    {item}
                  </Text>
                  {selected && (
                    <MaterialIcons name="check" size={20} color={COLORS.primary} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
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
  required: {
    color: COLORS.error,
    fontSize: 12,
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
  dropdownWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.onSurface,
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: COLORS.outline,
    flex: 1,
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

  // Modal styles
  modalRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.secondaryContainer,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  modalList: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  bankRowSelected: {
    backgroundColor: COLORS.cardBg,
  },
  bankRowText: {
    fontSize: 16,
    color: COLORS.onSurface,
    flex: 1,
  },
  bankRowTextSelected: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 15,
    color: COLORS.secondary,
  },
});
