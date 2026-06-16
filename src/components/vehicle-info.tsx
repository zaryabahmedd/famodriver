import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
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

import { getRiderProfile, updateRiderProfile } from '@/hooks/rider-account-api';

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

type FieldKey = keyof VehicleFields;

const EMPTY_VEHICLE: VehicleFields = {
  type: '',
  brand: '',
  model: '',
  year: '',
  registration: '',
  battery: '',
};

const FIELDS: {
  key: FieldKey;
  label: string;
  keyboardType?: KeyboardTypeOptions;
  uppercase?: boolean;
}[] = [
  { key: 'type', label: 'Bike type' },
  { key: 'brand', label: 'Brand' },
  { key: 'model', label: 'Model' },
  { key: 'year', label: 'Year', keyboardType: 'number-pad' },
  { key: 'registration', label: 'Registration number', uppercase: true },
  { key: 'battery', label: 'Battery capacity' },
];

function vehicleTitle(v: VehicleFields): string {
  return [v.brand, v.model].filter(Boolean).join(' ') || v.type || 'Bike';
}

export function VehicleInfo({ onBack }: VehicleInfoProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleFields>(EMPTY_VEHICLE);
  const [values, setValues] = useState<VehicleFields>(EMPTY_VEHICLE);

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef(0);
  const inputRefs = useRef<Partial<Record<FieldKey, TextInput | null>>>({});
  const focusedField = useRef<FieldKey | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollFieldIntoView = (key: FieldKey | null) => {
    if (!key || !keyboardTop.current) return;
    const input = inputRefs.current[key];
    if (!input) return;
    // Scroll only by how much the field is hidden behind the keyboard, so it
    // rests just above the keyboard instead of jumping to the top of the screen.
    input.measureInWindow((_x, y, _w, h) => {
      const margin = 16;
      const overlap = y + h + margin - keyboardTop.current;
      if (overlap > 0) {
        scrollRef.current?.scrollTo({ y: scrollY.current + overlap, animated: true });
      }
    });
  };

  // When the keyboard appears, make sure the field the user is typing in is
  // scrolled above it (covers the case where focus happens before the keyboard
  // has finished animating in, especially on Android).
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
      keyboardTop.current = e.endCoordinates?.screenY ?? 0;
      scrollFieldIntoView(focusedField.current);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      keyboardTop.current = 0;
      focusedField.current = null;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const rider = await getRiderProfile();
      if (active && rider) {
        const loaded: VehicleFields = {
          type: rider.vehicle_type ?? '',
          brand: rider.vehicle_brand ?? '',
          model: rider.vehicle_model ?? '',
          year: rider.vehicle_year ?? '',
          registration: rider.vehicle_plate ?? '',
          battery: rider.vehicle_battery_capacity ?? '',
        };
        setVehicle(loaded);
        setValues(loaded);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const startEditing = () => {
    setValues(vehicle);
    setEditing(true);
  };

  const cancelEditing = () => {
    setValues(vehicle);
    setEditing(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await updateRiderProfile({
        vehicle_type: values.type.trim(),
        vehicle_brand: values.brand.trim(),
        vehicle_model: values.model.trim(),
        vehicle_year: values.year.trim(),
        vehicle_plate: values.registration.trim(),
        vehicle_battery_capacity: values.battery.trim(),
      });
      if (!updated) {
        Alert.alert('Could not save', 'Your changes were not saved. Please try again.');
        return;
      }
      const saved: VehicleFields = {
        type: updated.vehicle_type ?? '',
        brand: updated.vehicle_brand ?? '',
        model: updated.vehicle_model ?? '',
        year: updated.vehicle_year ?? '',
        registration: updated.vehicle_plate ?? '',
        battery: updated.vehicle_battery_capacity ?? '',
      };
      setVehicle(saved);
      setValues(saved);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const title = vehicleTitle(editing ? values : vehicle);

  const details: { key: FieldKey; label: string; value: string }[] = [
    { key: 'type', label: 'Bike type', value: vehicle.type || '—' },
    { key: 'brand', label: 'Brand', value: vehicle.brand || '—' },
    { key: 'model', label: 'Model', value: vehicle.model || '—' },
    { key: 'year', label: 'Year', value: vehicle.year || '—' },
    { key: 'registration', label: 'Registration number', value: vehicle.registration || '—' },
    { key: 'battery', label: 'Battery capacity', value: vehicle.battery || '—' },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Bike</Text>
        {editing ? (
          <Pressable onPress={cancelEditing} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Cancel editing">
            <MaterialIcons name="close" size={22} color={COLORS.onSurfaceVariant} />
          </Pressable>
        ) : (
          <Pressable onPress={startEditing} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Edit">
            <MaterialIcons name="edit" size={22} color={COLORS.primary} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom:
                  insets.bottom + 24 + (Platform.OS === 'ios' ? 0 : keyboardHeight),
              },
            ]}
            onScroll={(e) => {
              scrollY.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <MaterialIcons name="two-wheeler" size={40} color={COLORS.onPrimaryContainer} />
              </View>
              <Text style={styles.heroTitle}>{title}</Text>
            </View>

            {editing ? (
              <View style={styles.form}>
                {FIELDS.map((field) => (
                  <View key={field.key} style={styles.field}>
                    <Text style={styles.label}>{field.label}</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        ref={(node) => {
                          inputRefs.current[field.key] = node;
                        }}
                        value={values[field.key]}
                        onChangeText={(text) => setValues((prev) => ({ ...prev, [field.key]: text }))}
                        onFocus={() => {
                          focusedField.current = field.key;
                          scrollFieldIntoView(field.key);
                        }}
                        keyboardType={field.keyboardType}
                        autoCapitalize={field.uppercase ? 'characters' : 'sentences'}
                        style={[styles.input, field.uppercase && styles.inputUppercase]}
                        placeholderTextColor={COLORS.outline}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.card}>
                {details.map((item, i) => (
                  <View key={item.label} style={[styles.row, i > 0 && styles.rowBorder]}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {editing && (
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  saving && styles.saveBtnDisabled,
                  pressed && styles.saveBtnPressed,
                ]}
                accessibilityRole="button">
                {saving ? (
                  <ActivityIndicator color={COLORS.onPrimaryContainer} />
                ) : (
                  <Text style={styles.saveText}>Save changes</Text>
                )}
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
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
  form: { gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  inputWrap: {
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    justifyContent: 'center',
  },
  input: { fontSize: 16, color: COLORS.onSurface, paddingVertical: 0 },
  inputUppercase: { textTransform: 'uppercase' },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  saveBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  saveBtnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { fontSize: 16, fontWeight: '700', color: COLORS.onPrimaryContainer },
});
