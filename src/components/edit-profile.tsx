import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

import {
    getLocalAvatar,
    getRiderProfile,
    saveLocalAvatar,
    updateRiderProfile,
} from '@/hooks/rider-account-api';

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
};

const PROFILE_URI =
  'https://lh3.googleusercontent.com/aida/ADBb0uhpzp48WLEOBto34O_YvDuH_HO-sbuCTeRtDvJJASI2tAqxlhrG3BRdIUGbvPPT7goqnUf0sEmcj0uCLtu04Q4CeMFGP55uQj1NQpJ0E9jX2gakN5UbtXTO5aN9HckrZAmBcsnk0HViYDuOM-S2mR4uI2eDYyHROorcUj2vIdmC1dIIfpn-pfK3BumTGuK1LT6hQBbY-ri4p_-WUABuOJB6L1jQp4upa5Yn-e8b08MEUBYEONrHGH1RfA4';

type FieldDef = {
  key: 'full_name' | 'email' | 'phone_number';
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  keyboardType?: KeyboardTypeOptions;
  /** Email isn't editable here (backend update accepts name/phone only). */
  readonly?: boolean;
};

const FIELDS: FieldDef[] = [
  { key: 'full_name', label: 'Full Name', icon: 'person' },
  { key: 'email', label: 'Email Address', icon: 'mail', keyboardType: 'email-address', readonly: true },
  { key: 'phone_number', label: 'Phone Number', icon: 'phone', keyboardType: 'phone-pad' },
];

type EditProfileProps = {
  onBack?: () => void;
  onSave?: () => void;
};

export function EditProfile({ onBack, onSave }: EditProfileProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({
    full_name: '',
    email: '',
    phone_number: '',
  });
  // avatar holds a base64 data URI (newly picked or previously saved) or null.
  const [avatar, setAvatar] = useState<string | null>(null);

  // Load the rider's real profile + any locally-saved photo.
  useEffect(() => {
    let active = true;
    (async () => {
      const [profile, savedAvatar] = await Promise.all([getRiderProfile(), getLocalAvatar()]);
      if (!active) return;
      if (profile) {
        setValues({
          full_name: profile.full_name ?? '',
          email: profile.email ?? '',
          phone_number: profile.phone_number ?? '',
        });
      }
      if (savedAvatar) setAvatar(savedAvatar);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo permission needed',
        'Please allow photo library access in your device settings to change your profile photo.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      setAvatar(`data:${mime};base64,${asset.base64}`);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    const fullName = values.full_name.trim();
    if (!fullName) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateRiderProfile({
        full_name: fullName,
        phone_number: values.phone_number.trim() || null,
      });
      if (!updated) {
        Alert.alert('Could not save', 'Your changes were not saved. Please try again.');
        return;
      }
      // Photo is persisted on-device (no backend avatar column yet).
      if (avatar && avatar.startsWith('data:')) {
        await saveLocalAvatar(avatar);
      }
      onSave?.();
    } finally {
      setSaving(false);
    }
  };

  const avatarSource = avatar ? { uri: avatar } : { uri: PROFILE_URI };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Edit profile</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <Image source={avatarSource} style={styles.avatar} contentFit="cover" />
              <Pressable
                onPress={pickPhoto}
                style={styles.cameraBtn}
                accessibilityRole="button"
                accessibilityLabel="Change photo">
                <MaterialIcons name="photo-camera" size={18} color={COLORS.onPrimaryContainer} />
              </Pressable>
            </View>
            <Pressable onPress={pickPhoto} accessibilityRole="button">
              <Text style={styles.changePhoto}>Change photo</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            {FIELDS.map((field) => (
              <View key={field.key} style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={[styles.inputWrap, field.readonly && styles.inputWrapDisabled]}>
                  <MaterialIcons name={field.icon} size={20} color={COLORS.outline} />
                  <TextInput
                    value={values[field.key]}
                    onChangeText={(t) => setValues((v) => ({ ...v, [field.key]: t }))}
                    keyboardType={field.keyboardType}
                    editable={!field.readonly}
                    style={[styles.input, field.readonly && styles.inputDisabled]}
                    placeholderTextColor={COLORS.outline}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        )}

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={handleSave}
            disabled={saving || loading}
            style={({ pressed }) => [
              styles.saveBtn,
              (saving || loading) && styles.saveBtnDisabled,
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
      </KeyboardAvoidingView>
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
    paddingTop: 24,
    gap: 28,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  avatarSection: { alignItems: 'center', gap: 10 },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: COLORS.primaryContainer,
    padding: 4,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 56 },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  changePhoto: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  form: { gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
  },
  input: { flex: 1, fontSize: 16, color: COLORS.onSurface, paddingVertical: 0 },
  inputWrapDisabled: { backgroundColor: COLORS.surface, opacity: 0.7 },
  inputDisabled: { color: COLORS.onSurfaceVariant },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  },
  saveBtnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { fontSize: 16, fontWeight: '700', color: COLORS.onPrimaryContainer },
});
