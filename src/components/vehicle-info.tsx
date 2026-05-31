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
  success: '#176d3a',
  successContainer: '#d7f5e1',
};

const DETAILS: { label: string; value: string }[] = [
  { label: 'Vehicle type', value: 'Motorcycle' },
  { label: 'Make & model', value: 'Honda CG 125' },
  { label: 'Year', value: '2022' },
  { label: 'Color', value: 'Red' },
  { label: 'Plate number', value: 'LEB-2384' },
  { label: 'Registration', value: 'Lahore, Punjab' },
];

type VehicleInfoProps = {
  onBack?: () => void;
  onEdit?: () => void;
};

export function VehicleInfo({ onBack, onEdit }: VehicleInfoProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Vehicle</Text>
        <Pressable onPress={onEdit} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Edit">
          <MaterialIcons name="edit" size={22} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="two-wheeler" size={40} color={COLORS.onPrimaryContainer} />
          </View>
          <Text style={styles.heroTitle}>Honda CG 125</Text>
          <View style={styles.verifiedPill}>
            <MaterialIcons name="verified" size={16} color={COLORS.success} />
            <Text style={styles.verifiedText}>Verified</Text>
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
    paddingTop: 24,
    gap: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: COLORS.onSurface },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: COLORS.successContainer,
  },
  verifiedText: { fontSize: 13, fontWeight: '700', color: COLORS.success },
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
});
