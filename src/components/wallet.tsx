import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
  surfaceContainerHigh: '#e9e8e7',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  inverseSurface: '#303031',
  success: '#176d3a',
  successContainer: '#d7f5e1',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
};

type Txn = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  date: string;
  amount: string;
  positive: boolean;
};

const TRANSACTIONS: Txn[] = [
  { icon: 'local-shipping', title: 'Delivery earnings', date: 'Today · 2:14 PM', amount: '+ Rs 466', positive: true },
  { icon: 'redeem', title: 'Tip from Sara Ali', date: 'Today · 2:15 PM', amount: '+ Rs 100', positive: true },
  { icon: 'account-balance', title: 'Cash out to bank', date: 'Yesterday', amount: '- Rs 2,000', positive: false },
  { icon: 'local-shipping', title: 'Delivery earnings', date: 'Yesterday', amount: '+ Rs 420', positive: true },
  { icon: 'card-giftcard', title: 'Weekend bonus', date: '2 days ago', amount: '+ Rs 1,000', positive: true },
];

type WalletProps = {
  onBack?: () => void;
  onCashOut?: () => void;
};

export function Wallet({ onBack, onCashOut }: WalletProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Wallet</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Balance hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Available balance</Text>
          <Text style={styles.heroBalance}>Rs 2,450</Text>
          <View style={styles.heroMetaRow}>
            <MaterialIcons name="schedule" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroMeta}>Rs 880 pending clearance</Text>
          </View>
          <Pressable
            onPress={onCashOut}
            style={({ pressed }) => [styles.cashOutBtn, pressed && styles.cashOutBtnPressed]}
            accessibilityRole="button">
            <MaterialIcons name="account-balance" size={20} color={COLORS.onPrimaryContainer} />
            <Text style={styles.cashOutText}>Cash out</Text>
          </Pressable>
        </View>

        {/* Linked account */}
        <View style={styles.bankCard}>
          <View style={styles.bankLeft}>
            <View style={styles.bankIcon}>
              <MaterialIcons name="account-balance" size={22} color={COLORS.onSurface} />
            </View>
            <View>
              <Text style={styles.bankName}>HBL Bank</Text>
              <Text style={styles.bankNumber}>•••• 4291</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button">
            <Text style={styles.bankChange}>Change</Text>
          </Pressable>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <View style={styles.txnList}>
            {TRANSACTIONS.map((txn, i) => (
              <View
                key={`${txn.title}-${i}`}
                style={[styles.txnRow, i < TRANSACTIONS.length - 1 && styles.txnRowBorder]}>
                <View
                  style={[
                    styles.txnIcon,
                    { backgroundColor: txn.positive ? COLORS.successContainer : COLORS.errorContainer },
                  ]}>
                  <MaterialIcons
                    name={txn.icon}
                    size={20}
                    color={txn.positive ? COLORS.success : COLORS.error}
                  />
                </View>
                <View style={styles.txnBody}>
                  <Text style={styles.txnTitle}>{txn.title}</Text>
                  <Text style={styles.txnDate}>{txn.date}</Text>
                </View>
                <Text style={[styles.txnAmount, { color: txn.positive ? COLORS.success : COLORS.error }]}>
                  {txn.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: COLORS.inverseSurface,
    borderRadius: 24,
    padding: 24,
    gap: 8,
  },
  heroLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  heroBalance: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: '#ffffff' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMeta: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  cashOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    marginTop: 12,
  },
  cashOutBtnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cashOutText: { fontSize: 16, fontWeight: '700', color: COLORS.onPrimaryContainer },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
  },
  bankLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankName: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  bankNumber: { fontSize: 14, color: COLORS.onSurfaceVariant },
  bankChange: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  txnList: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  txnRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  txnRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnBody: { flex: 1, gap: 2 },
  txnTitle: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  txnDate: { fontSize: 13, color: COLORS.onSurfaceVariant },
  txnAmount: { fontSize: 15, fontWeight: '700' },
});
