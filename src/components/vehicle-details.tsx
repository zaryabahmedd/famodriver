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
    type KeyboardTypeOptions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { updateRiderProfile } from '@/hooks/rider-account-api';

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
  onPrimaryContainer: '#231b00',
  surfaceDim: '#dbdad9',
};

type Vehicle = {
  key: string;
  label: string;
  tag: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const VEHICLES: Vehicle[] = [
  { key: 'ebike', label: 'Electric Bike', tag: 'ELECTRIC', icon: 'moped' },
];

type FieldKey = 'brand' | 'model' | 'year' | 'registration' | 'battery';

type Field = {
  key: FieldKey;
  label: string;
  placeholder: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  keyboardType?: KeyboardTypeOptions;
  uppercase?: boolean;
};

const FIELDS: Field[] = [
  { key: 'brand', label: 'BRAND', placeholder: 'Oraimo / Spiro', icon: 'factory' },
  { key: 'model', label: 'MODEL', placeholder: 'Electric Bike', icon: 'settings' },
  { key: 'year', label: 'YEAR', placeholder: '2022', icon: 'calendar-today', keyboardType: 'number-pad' },
  { key: 'registration', label: 'REGISTRATION NUMBER', placeholder: 'ABC 1234', icon: 'badge', uppercase: true },
  { key: 'battery', label: 'BATTERY CAPACITY', placeholder: '60V 20Ah', icon: 'battery-charging-full' },
];

type VehicleDetailsProps = {
  riderId?: string;
  onContinue: () => void;
  onBack?: () => void;
};

export function VehicleDetails({ onContinue, onBack }: VehicleDetailsProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState('ebike');
  const [values, setValues] = useState<Record<FieldKey, string>>({
    brand: '',
    model: '',
    year: '',
    registration: '',
    battery: '',
  });
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!values.brand || !values.model || !values.year || !values.registration || !values.battery) {
      alert('Please fill in all vehicle fields.');
      return;
    }
    setLoading(true);
    try {
      const vehicleType = VEHICLES.find((v) => v.key === selected)?.label ?? 'Electric Bike';
      const rider = await updateRiderProfile({
        vehicle_type: vehicleType,
        vehicle_brand: values.brand,
        vehicle_model: values.model,
        vehicle_year: values.year,
        vehicle_plate: values.registration,
        vehicle_battery_capacity: values.battery,
      });
      if (!rider) {
        alert('Could not save your vehicle details. Please try again.');
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
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="chevron-left" size={26} color={COLORS.onSurface} />
        </Pressable>
        <View style={styles.stepWrap}>
          <Text style={styles.stepText}>SIGN UP · STEP 4/5</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '80%' }]} />
          </View>
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
            <Text style={styles.title}>Bike details</Text>
            <Text style={styles.subtitle}>
              Select your bike type and enter its details.
            </Text>
          </View>

          {/* Vehicle selection */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vehicleRow}
            style={styles.vehicleScroll}>
            {VEHICLES.map((v) => {
              const isSelected = selected === v.key;
              return (
                <Pressable
                  key={v.key}
                  onPress={() => setSelected(v.key)}
                  style={[
                    styles.vehicleCard,
                    isSelected ? styles.vehicleCardActive : styles.vehicleCardDisabled,
                  ]}>
                  <View style={[styles.vehicleIconWrap, isSelected && styles.vehicleIconWrapActive]}>
                    <MaterialIcons
                      name={v.icon}
                      size={30}
                      color={isSelected ? COLORS.onSurface : COLORS.onSurfaceVariant}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.vehicleLabel,
                        isSelected ? styles.vehicleLabelActive : styles.vehicleLabelDisabled,
                      ]}>
                      {v.label}
                    </Text>
                    <Text style={[styles.vehicleTag, isSelected && styles.vehicleTagActive]}>
                      {v.tag}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

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
                  <TextInput
                    value={values[field.key]}
                    onChangeText={(text) =>
                      setValues((prev) => ({ ...prev, [field.key]: text }))
                    }
                    onFocus={() => setFocused(field.key)}
                    onBlur={() => setFocused(null)}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.surfaceDim}
                    keyboardType={field.keyboardType}
                    autoCapitalize={field.uppercase ? 'characters' : 'sentences'}
                    style={[styles.input, field.uppercase && styles.inputUppercase]}
                  />
                  <MaterialIcons
                    name={field.icon}
                    size={20}
                    color={COLORS.outlineVariant}
                  />
                </View>
              </View>
            ))}
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
    width: '75%',
    height: '100%',
    borderRadius: 999,
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
    color: COLORS.onSurfaceVariant,
    maxWidth: 360,
  },
  vehicleScroll: {
    marginHorizontal: -20,
    marginBottom: 32,
  },
  vehicleRow: {
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  vehicleCard: {
    width: 140,
    aspectRatio: 4 / 5,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  vehicleCardActive: {
    backgroundColor: COLORS.primaryContainer,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  vehicleCardDisabled: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant,
    opacity: 0.5,
  },
  vehicleIconWrap: {
    padding: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  vehicleIconWrapActive: {
    backgroundColor: 'rgba(35, 27, 0, 0.1)',
  },
  vehicleLabel: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  vehicleLabelActive: {
    color: COLORS.onSurface,
  },
  vehicleLabelDisabled: {
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  vehicleTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
    color: COLORS.onSurfaceVariant,
  },
  vehicleTagActive: {
    color: 'rgba(27, 28, 28, 0.6)',
  },
  form: {
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: COLORS.onSurfaceVariant,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputWrapFocused: {
    borderColor: COLORS.onSurface,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  inputUppercase: {
    textTransform: 'uppercase',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(208, 198, 171, 0.3)',
    backgroundColor: COLORS.surface,
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
