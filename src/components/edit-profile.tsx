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
    getRiderProfile,
    updateRiderProfile,
    uploadRiderAvatar,
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
  // The rider's currently-saved avatar URL (from their profile), or null.
  const [avatar, setAvatar] = useState<string | null>(null);
  // A newly picked photo, staged locally until "Save changes" is tapped.
  const [pickedPhoto, setPickedPhoto] = useState<{
    uri: string;
    base64: string;
    mimeType: string;
  } | null>(null);

  // Load the rider's real profile.
  useEffect(() => {
    let active = true;
    (async () => {
      const profile = await getRiderProfile();
      if (!active) return;
      if (profile) {
        setValues({
          full_name: profile.full_name ?? '',
          email: profile.email ?? '',
          phone_number: profile.phone_number ?? '',
        });
        setAvatar(profile.avatar_url ?? null);
      }
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
    const asset = !result.canceled ? result.assets?.[0] : undefined;
    if (asset?.base64) {
      setPickedPhoto({
        uri: asset.uri,
        base64: asset.base64,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
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
      let avatarUrl: string | undefined;
      if (pickedPhoto) {
        const result = await uploadRiderAvatar(
          pickedPhoto.uri,
          pickedPhoto.mimeType,
          pickedPhoto.base64,
        );
        if (!result.ok || !result.url) {
          console.warn('[edit-profile] avatar upload failed', result.error);
          Alert.alert(
            'Could not upload photo',
            result.error ? `Please try again.\n\n(${result.error})` : 'Please try again.',
          );
          return;
        }
        avatarUrl = result.url;
      }
      const updated = await updateRiderProfile({
        full_name: fullName,
        phone_number: values.phone_number.trim() || null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });
      if (!updated) {
        Alert.alert('Could not save', 'Your changes were not saved. Please try again.');
        return;
      }
      setAvatar(updated.avatar_url ?? null);
      setPickedPhoto(null);
      onSave?.();
    } finally {
      setSaving(false);
    }
  };

  const photoUri = pickedPhoto ? pickedPhoto.uri : avatar;

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
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <MaterialIcons name="person" size={52} color={COLORS.outline} />
                </View>
              )}
              <Pressable
                onPress={pickPhoto}
                style={styles.cameraBtn}
                accessibilityRole="button"
                accessibilityLabel="Change photo">
                <MaterialIcons name="photo-camera" size={18} color={COLORS.onPrimaryContainer} />
              </Pressable>
            </View>
            <Pressable onPress={pickPhoto} accessibilityRole="button">
              <Text style={styles.changePhoto}>
                {pickedPhoto ? 'Photo selected · tap to change' : 'Change photo'}
              </Text>
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
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
