import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getRiderProfile } from '@/hooks/rider-account-api';

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

type VehicleInfoProps = {
  onBack?: () => void;
};

type VehicleFields = {
  type: string;
  brand: string;
  model: string;
  year: string;
  registration: string;
  battery: string;
};

const EMPTY_VEHICLE: VehicleFields = {
  type: '',
  brand: '',
  model: '',
  year: '',
  registration: '',
  battery: '',
};

function vehicleTitle(v: VehicleFields): string {
  return [v.brand, v.model].filter(Boolean).join(' ') || v.type || 'Bike';
}

export function VehicleInfo({ onBack }: VehicleInfoProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleFields>(EMPTY_VEHICLE);

  useEffect(() => {
    let active = true;
    (async () => {
      const rider = await getRiderProfile();
      if (active && rider) {
        setVehicle({
          type: rider.vehicle_type ?? '',
          brand: rider.vehicle_brand ?? '',
          model: rider.vehicle_model ?? '',
          year: rider.vehicle_year ?? '',
          registration: rider.vehicle_plate ?? '',
          battery: rider.vehicle_battery_capacity ?? '',
        });
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const title = vehicleTitle(vehicle);

  const details: { label: string; value: string }[] = [
    { label: 'Bike type', value: vehicle.type || '—' },
    { label: 'Brand', value: vehicle.brand || '—' },
    { label: 'Model', value: vehicle.model || '—' },
    { label: 'Year', value: vehicle.year || '—' },
    { label: 'Registration number', value: vehicle.registration || '—' },
    { label: 'Battery capacity', value: vehicle.battery || '—' },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Bike</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="two-wheeler" size={40} color={COLORS.onPrimaryContainer} />
            </View>
            <Text style={styles.heroTitle}>{title}</Text>
          </View>

          <View style={styles.card}>
            {details.map((item, i) => (
              <View key={item.label} style={[styles.row, i > 0 && styles.rowBorder]}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
