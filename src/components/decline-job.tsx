import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
};

const REASONS = [
  'Too far away',
  'Earning too low',
  'Vehicle issue',
  'Taking a break',
  'Cargo not suitable',
  'Other',
];

type DeclineJobProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeclineJob({ onConfirm, onCancel }: DeclineJobProps) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<string | null>(null);

  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Dismiss" />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="cancel" size={28} color={COLORS.onErrorContainer} />
          </View>
          <Text style={styles.title}>Decline this job?</Text>
          <Text style={styles.subtitle}>
            Let us know why so we can send you better-matched jobs.
          </Text>
        </View>

        <View style={styles.reasonList}>
          {REASONS.map((item) => {
            const selected = item === reason;
            return (
              <Pressable
                key={item}
                onPress={() => setReason(item)}
                style={[styles.reasonChip, selected && styles.reasonChipSelected]}
                accessibilityRole="button">
                <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>{item}</Text>
                {selected ? (
                  <MaterialIcons name="check-circle" size={18} color={COLORS.onPrimaryContainer} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
            accessibilityRole="button">
            <Text style={styles.cancelText}>Keep job</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            disabled={!reason}
            style={({ pressed }) => [
              styles.confirmBtn,
              !reason && styles.confirmBtnDisabled,
              pressed && styles.btnPressed,
            ]}
            accessibilityRole="button">
            <Text style={styles.confirmText}>Decline</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: 'rgba(27,28,28,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1900,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.outlineVariant,
    alignSelf: 'center',
  },
  header: { alignItems: 'center', gap: 8 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  subtitle: { fontSize: 14, lineHeight: 20, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  reasonList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  reasonChipSelected: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primaryContainer },
  reasonText: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant },
  reasonTextSelected: { color: COLORS.onPrimaryContainer, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  confirmBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  btnPressed: { opacity: 0.85 },
});
