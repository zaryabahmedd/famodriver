import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  onSurface: '#1b1c1c',
  gray900: '#111827',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray100: '#f3f4f6',
  primaryContainer: '#fbd103',
  errorContainer: '#ffdad6',
  error: '#ba1a1a',
  fammoYellow: '#fbd103',
};

type Row = {
  label: string;
  expected: string;
  actual: string;
  discrepancy?: boolean;
};

const ROWS: Row[] = [
  { label: 'Type', expected: 'Electronics', actual: 'Electronics' },
  { label: 'Size', expected: 'Medium', actual: 'Medium' },
  { label: 'Weight', expected: '5.5 kg', actual: '6.2 kg', discrepancy: true },
];

type VerifyPackageProps = {
  onContinue: () => void;
  onBack: () => void;
};

export function VerifyPackage({ onContinue, onBack }: VerifyPackageProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="chevron-left" size={26} color={COLORS.gray900} />
        </Pressable>
        <Text style={styles.title}>Verify package</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.subtext}>Confirm the package matches the order details.</Text>

        {/* Comparison table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colLabel} />
            <Text style={styles.colHeaderText}>Expected</Text>
            <Text style={styles.colHeaderText}>Actual</Text>
          </View>

          {ROWS.map((row) => (
            <View
              key={row.label}
              style={[styles.row, row.discrepancy && styles.rowDiscrepancy]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.expected}</Text>
              <View style={styles.actualCell}>
                <Text style={[styles.rowValue, row.discrepancy && styles.rowValueError]}>
                  {row.actual}
                </Text>
                {row.discrepancy && (
                  <MaterialIcons name="info" size={14} color={COLORS.error} />
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Warning alert */}
        <View style={styles.alert}>
          <View style={styles.alertIcon}>
            <MaterialIcons name="warning" size={18} color="#000000" />
          </View>
          <Text style={styles.alertText}>
            Weight differs slightly. Continue or request fare update from the customer.
          </Text>
        </View>

        {/* Photo confirmation */}
        <View style={styles.photoWrap}>
          <View style={styles.photoCard}>
            <View style={styles.photoCheck}>
              <MaterialIcons name="check" size={28} color={COLORS.fammoYellow} />
            </View>
            <Text style={styles.photoTitle}>Package photo taken</Text>
            <Text style={styles.photoHint}>Tap to retake</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={22} color="#000000" />
        </Pressable>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.gray900 },
  spacer: { width: 44 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  subtext: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray500,
    marginBottom: 32,
  },
  table: { gap: 8, marginBottom: 24 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  colLabel: { width: '30%' },
  colHeaderText: {
    width: '35%',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray400,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowDiscrepancy: {
    backgroundColor: 'rgba(255,218,214,0.3)',
    borderColor: 'rgba(186,26,26,0.1)',
  },
  rowLabel: {
    width: '30%',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray400,
    textTransform: 'uppercase',
  },
  rowValue: {
    width: '35%',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  actualCell: {
    width: '35%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rowValueError: { width: 'auto', color: COLORS.error },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(251,209,3,0.12)',
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fammoYellow,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray900,
    lineHeight: 18,
  },
  photoWrap: { marginTop: 32, marginBottom: 8 },
  photoCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(251,209,3,0.06)',
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    borderStyle: 'dashed',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  photoCheck: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  photoTitle: { fontSize: 14, fontWeight: '800', color: COLORS.gray900 },
  photoHint: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray400,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.fammoYellow,
    shadowColor: COLORS.fammoYellow,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaPressed: { opacity: 0.95, transform: [{ scale: 0.97 }] },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#000000' },
});
