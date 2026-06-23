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
    getRiderProfileChangeStatus,
    requestRiderProfileChange,
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

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

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
  // The originally-loaded values, so we only submit fields that actually changed.
  const [original, setOriginal] = useState<{ full_name: string; phone_number: string }>({
    full_name: '',
    phone_number: '',
  });
  // Approval/lock state. `pending` means a request is already awaiting review;
  // `lockedUntil` (if in the future) means a recent change was approved and the
  // rider must wait out the 30-day window.
  const [hasPending, setHasPending] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

  // Load the rider's real profile plus any pending request / lock state.
  useEffect(() => {
    let active = true;
    (async () => {
      const [profile, status] = await Promise.all([
        getRiderProfile(),
        getRiderProfileChangeStatus(),
      ]);
      if (!active) return;

      const baseName = profile?.full_name ?? '';
      const basePhone = profile?.phone_number ?? '';
      setOriginal({ full_name: baseName, phone_number: basePhone });

      // While a request is pending, show the submitted values so the rider sees
      // what they asked for (falling back to their live profile for unchanged fields).
      const pending = status.pending;
      setValues({
        full_name: pending?.full_name ?? baseName,
        email: profile?.email ?? '',
        phone_number: pending?.phone_number ?? basePhone,
      });
      setAvatar(pending?.avatar_url ?? profile?.avatar_url ?? null);

      setHasPending(Boolean(pending));
      const lock = status.lockedUntil ? new Date(status.lockedUntil) : null;
      setLockedUntil(lock && lock.getTime() > Date.now() ? lock : null);

      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Editing is disabled while a request is pending, or during the 30-day lock.
  const locked = hasPending || lockedUntil !== null;

  const pickPhoto = async () => {
    if (locked) return;
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
    if (saving || locked) return;
    const fullName = values.full_name.trim();
    if (!fullName) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    const phone = values.phone_number.trim();

    // Only submit the fields that actually changed, so an unchanged "save" never
    // burns the 30-day lock.
    const changes: { full_name?: string; phone_number?: string | null; avatar_url?: string } = {};
    if (fullName !== original.full_name.trim()) changes.full_name = fullName;
    if (phone !== original.phone_number.trim()) changes.phone_number = phone || null;

    if (!pickedPhoto && Object.keys(changes).length === 0) {
      Alert.alert('No changes', 'You haven’t changed anything yet.');
      return;
    }

    setSaving(true);
    try {
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
        changes.avatar_url = result.url;
      }

      const result = await requestRiderProfileChange(changes);
      if (!result.ok) {
        if (result.error === 'profile_change_pending') {
          Alert.alert(
            'Change already pending',
            'You already have a profile change awaiting admin approval.',
          );
        } else if (result.error === 'profile_edit_locked') {
          const until = result.lockedUntil ? formatDate(new Date(result.lockedUntil)) : null;
          Alert.alert(
            'Too soon to change',
            until
              ? `Your profile can only be changed once every 30 days. You can edit again on ${until}.`
              : 'Your profile can only be changed once every 30 days.',
          );
        } else {
          Alert.alert('Could not submit', 'Your changes were not submitted. Please try again.');
        }
        return;
      }

      setPickedPhoto(null);
      Alert.alert(
        'Submitted for approval',
        'Your changes were sent to the admin for approval and will take effect once approved.',
      );
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
          {hasPending ? (
            <View style={styles.banner}>
              <MaterialIcons name="hourglass-top" size={20} color={COLORS.onPrimaryContainer} />
              <Text style={styles.bannerText}>
                Your changes are awaiting admin approval. They’ll take effect once approved.
              </Text>
            </View>
          ) : lockedUntil ? (
            <View style={styles.banner}>
              <MaterialIcons name="lock-clock" size={20} color={COLORS.onPrimaryContainer} />
              <Text style={styles.bannerText}>
                Profile can be changed once every 30 days. You can edit again on{' '}
                {formatDate(lockedUntil)}.
              </Text>
            </View>
          ) : null}

          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <MaterialIcons name="person" size={52} color={COLORS.outline} />
                </View>
              )}
              {!locked && (
                <Pressable
                  onPress={pickPhoto}
                  style={styles.cameraBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Change photo">
                  <MaterialIcons name="photo-camera" size={18} color={COLORS.onPrimaryContainer} />
                </Pressable>
              )}
            </View>
            {!locked && (
              <Pressable onPress={pickPhoto} accessibilityRole="button">
                <Text style={styles.changePhoto}>
                  {pickedPhoto ? 'Photo selected · tap to change' : 'Change photo'}
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.form}>
            {FIELDS.map((field) => {
              const disabled = field.readonly || locked;
              return (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <View style={[styles.inputWrap, disabled && styles.inputWrapDisabled]}>
                    <MaterialIcons name={field.icon} size={20} color={COLORS.outline} />
                    <TextInput
                      value={values[field.key]}
                      onChangeText={(t) => setValues((v) => ({ ...v, [field.key]: t }))}
                      keyboardType={field.keyboardType}
                      editable={!disabled}
                      style={[styles.input, disabled && styles.inputDisabled]}
                      placeholderTextColor={COLORS.outline}
                    />
                  </View>
                </View>
              );
            })}
            <Text style={styles.helperText}>
              Name, phone and photo changes require admin approval and can only be changed once
              every 30 days. Email can’t be changed here.
            </Text>
          </View>
        </ScrollView>
        )}

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={handleSave}
            disabled={saving || loading || locked}
            style={({ pressed }) => [
              styles.saveBtn,
              (saving || loading || locked) && styles.saveBtnDisabled,
              pressed && styles.saveBtnPressed,
            ]}
            accessibilityRole="button">
            {saving ? (
              <ActivityIndicator color={COLORS.onPrimaryContainer} />
            ) : (
              <Text style={styles.saveText}>
                {locked ? 'Changes locked' : 'Submit for approval'}
              </Text>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
  },
  bannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.onPrimaryContainer },
  helperText: { fontSize: 12, color: COLORS.onSurfaceVariant, lineHeight: 17 },
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
