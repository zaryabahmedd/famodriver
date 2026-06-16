import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  onSurface: '#1b1c1c',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  error: '#ba1a1a',
  scrim: '#1b1c1c',
};

type CallScreenProps = {
  name?: string;
  onEnd: () => void;
};

function formatDuration(total: number) {
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function CallScreen({ name = 'Customer', onEnd }: CallScreenProps) {
  const insets = useSafeAreaInsets();
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setConnected(true), 2000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [connected]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 }]}>
      <StatusBar style="light" />

      <View style={styles.info}>
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <MaterialIcons name="person" size={56} color={COLORS.onPrimaryContainer} />
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.status}>{connected ? formatDuration(seconds) : 'Calling…'}</Text>
        <Text style={styles.label}>Recipient</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.secondaryRow}>
          <Pressable
            onPress={() => setMuted((v) => !v)}
            style={[styles.smallBtn, muted && styles.smallBtnActive]}
            accessibilityRole="button">
            <MaterialIcons name={muted ? 'mic-off' : 'mic'} size={24} color={muted ? COLORS.onSurface : '#fff'} />
            <Text style={[styles.smallLabel, muted && styles.smallLabelActive]}>Mute</Text>
          </Pressable>
          <Pressable
            onPress={() => setSpeaker((v) => !v)}
            style={[styles.smallBtn, speaker && styles.smallBtnActive]}
            accessibilityRole="button">
            <MaterialIcons name="volume-up" size={24} color={speaker ? COLORS.onSurface : '#fff'} />
            <Text style={[styles.smallLabel, speaker && styles.smallLabelActive]}>Speaker</Text>
          </Pressable>
        </View>

        <Pressable onPress={onEnd} style={styles.endBtn} accessibilityRole="button" accessibilityLabel="End call">
          <MaterialIcons name="call-end" size={32} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.scrim,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2000,
  },
  info: { alignItems: 'center', gap: 10, marginTop: 40 },
  avatar: { width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: COLORS.primaryContainer },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 12 },
  status: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  controls: { alignItems: 'center', gap: 32, width: '100%' },
  secondaryRow: { flexDirection: 'row', gap: 40 },
  smallBtn: {
    alignItems: 'center',
    gap: 6,
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  smallBtnActive: { backgroundColor: COLORS.primaryContainer },
  smallLabel: { fontSize: 12, color: '#fff' },
  smallLabelActive: { color: COLORS.onSurface },
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
