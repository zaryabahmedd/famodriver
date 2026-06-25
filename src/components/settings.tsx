import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForgotPassword } from '@/components/forgot-password';
import { PrivacyPolicy } from '@/components/privacy-policy';
import { useRiderProfileData } from '@/hooks/rider-account-api';
import { useBackHandler } from '@/hooks/use-back-handler';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
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

type SettingsProps = {
  onBack?: () => void;
  onLogout?: () => void;
};

export function Settings({ onBack, onLogout }: SettingsProps) {
  const insets = useSafeAreaInsets();
  const { profile } = useRiderProfileData();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Android back: close an open sub-view / modal first, otherwise leave Settings.
  useBackHandler(() => {
    if (showPrivacyPolicy) {
      setShowPrivacyPolicy(false);
      return true;
    }
    if (changePassword) {
      setChangePassword(false);
      return true;
    }
    if (confirmLogout) {
      setConfirmLogout(false);
      return true;
    }
    onBack?.();
    return true;
  });

  if (showPrivacyPolicy) {
    return <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />;
  }

  if (changePassword) {
    return (
      <ForgotPassword
        mode="change"
        initialEmail={profile?.email ?? ''}
        lockEmail={!!profile?.email}
        onBack={() => setChangePassword(false)}
        onDone={() => setChangePassword(false)}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Settings</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Preferences */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.linkRow}>
            <View style={styles.linkLeft}>
              <MaterialIcons name="translate" size={22} color={COLORS.onSurface} />
              <Text style={styles.rowLabel}>Language</Text>
            </View>
            <View style={styles.linkRight}>
              <Text style={styles.rowValue}>English</Text>
              <MaterialIcons name="lock" size={18} color={COLORS.onSurfaceVariant} />
            </View>
          </View>
          <View style={styles.divider} />
          <Pressable
            onPress={() => setChangePassword(true)}
            style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
            accessibilityRole="button">
            <View style={styles.linkLeft}>
              <MaterialIcons name="lock" size={22} color={COLORS.onSurface} />
              <Text style={styles.rowLabel}>Change password</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.onSurfaceVariant} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            onPress={() => setShowPrivacyPolicy(true)}
            style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
            accessibilityRole="button">
            <View style={styles.linkLeft}>
              <MaterialIcons name="privacy-tip" size={22} color={COLORS.onSurface} />
              <Text style={styles.rowLabel}>Privacy policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.onSurfaceVariant} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setConfirmLogout(true)}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
          accessibilityRole="button">
          <MaterialIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
        <Text style={styles.version}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </ScrollView>

      {confirmLogout && (
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirmLogout(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <MaterialIcons name="logout" size={28} color={COLORS.onErrorContainer} />
            </View>
            <Text style={styles.modalTitle}>Log out?</Text>
            <Text style={styles.modalBody}>You&apos;ll need to sign in again to continue delivering.</Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setConfirmLogout(false)}
                style={({ pressed }) => [styles.modalCancel, pressed && styles.modalBtnPressed]}
                accessibilityRole="button">
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setConfirmLogout(false);
                  onLogout?.();
                }}
                style={({ pressed }) => [styles.modalConfirm, pressed && styles.modalBtnPressed]}
                accessibilityRole="button">
                <Text style={styles.modalConfirmText}>Log out</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
    paddingTop: 16,
    gap: 12,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.outline,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  rowLabel: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  rowValue: { fontSize: 14, color: COLORS.onSurfaceVariant },
  divider: { height: 1, backgroundColor: COLORS.outlineVariant },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  linkRowPressed: { opacity: 0.6 },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  linkRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.errorContainer,
    backgroundColor: COLORS.surfaceLowest,
    marginTop: 16,
  },
  logoutBtnPressed: { backgroundColor: COLORS.errorContainer },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.error },
  version: { fontSize: 13, color: COLORS.onSurfaceVariant, textAlign: 'center', marginTop: 8 },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27,28,28,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.onSurface },
  modalBody: { fontSize: 14, lineHeight: 20, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  modalCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  modalConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  modalBtnPressed: { opacity: 0.85 },
});
