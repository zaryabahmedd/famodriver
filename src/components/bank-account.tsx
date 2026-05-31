import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  inverseSurface: '#303031',
  success: '#176d3a',
  successContainer: '#d7f5e1',
};

const DETAILS: { label: string; value: string }[] = [
  { label: 'Account holder', value: 'Rashid Ahmed' },
  { label: 'Bank name', value: 'HBL Bank' },
  { label: 'Account number', value: '•••• •••• 4291' },
  { label: 'IBAN', value: 'PK•• HABB •••• 4291' },
  { label: 'Branch', value: 'Gulberg, Lahore' },
];

type BankAccountProps = {
  onBack?: () => void;
};

export function BankAccount({ onBack }: BankAccountProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Bank account</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Card visual */}
        <View style={styles.bankCard}>
          <View style={styles.bankCardTop}>
            <MaterialIcons name="account-balance" size={28} color="#ffffff" />
            <View style={styles.verifiedPill}>
              <MaterialIcons name="verified" size={14} color={COLORS.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.cardNumber}>•••• •••• •••• 4291</Text>
          <View style={styles.bankCardBottom}>
            <View>
              <Text style={styles.cardCaption}>Account holder</Text>
              <Text style={styles.cardName}>Rashid Ahmed</Text>
            </View>
            <Text style={styles.cardBank}>HBL</Text>
          </View>
        </View>

        <View style={styles.card}>
          {DETAILS.map((item, i) => (
            <View key={item.label} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.changeBtn, pressed && styles.changeBtnPressed]}
          accessibilityRole="button">
          <MaterialIcons name="sync-alt" size={20} color={COLORS.onSurface} />
          <Text style={styles.changeText}>Change bank account</Text>
        </Pressable>
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
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  bankCard: {
    backgroundColor: COLORS.inverseSurface,
    borderRadius: 24,
    padding: 24,
    gap: 20,
  },
  bankCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: COLORS.successContainer,
  },
  verifiedText: { fontSize: 12, fontWeight: '700', color: COLORS.success },
  cardNumber: { fontSize: 18, fontWeight: '700', letterSpacing: 2, color: '#ffffff' },
  bankCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardCaption: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  cardName: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  cardBank: { fontSize: 18, fontWeight: '800', color: COLORS.primaryContainer },
  card: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  rowBorder: { borderTopWidth: 1, borderTopColor: COLORS.outlineVariant },
  rowLabel: { fontSize: 15, color: COLORS.onSurfaceVariant },
  rowValue: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  changeBtnPressed: { opacity: 0.85 },
  changeText: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
});
