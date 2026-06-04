import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Delivery } from '@/hooks/rider-api';

const COLORS = {
  background: '#fbf9f9',
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
  surfaceContainer: '#efeded',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  secondary: '#5e5e5e',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  fammoYellow: '#fbd103',
};

type CompleteDeliveryProps = {
  onConfirm: () => void;
  onBack: () => void;
  delivery?: Delivery | null;
};

export function CompleteDelivery({ onConfirm, onBack }: CompleteDeliveryProps) {
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const capturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera permission needed',
        'Please allow camera access in your device settings to take the delivery photo.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      cameraType: ImagePicker.CameraType.back,
    });

    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleConfirm = () => {
    if (!photoUri) return;
    onConfirm();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={22} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.title}>Complete delivery</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Delivery Photo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.dot} />
            <Text style={styles.sectionTitle}>Delivery Photo</Text>
          </View>
          <Pressable
            onPress={capturePhoto}
            style={styles.photoCard}
            accessibilityRole="button"
            accessibilityLabel={photoUri ? 'Retake delivery photo' : 'Take delivery photo'}>
            {photoUri ? (
              <>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
                <View style={styles.photoRetake}>
                  <MaterialIcons name="photo-camera" size={16} color="#000000" />
                  <Text style={styles.photoRetakeText}>Tap to retake</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.photoIcon}>
                  <MaterialIcons name="photo-camera" size={32} color={COLORS.onPrimaryContainer} />
                </View>
                <Text style={styles.photoTitle}>Take photo</Text>
                <Text style={styles.photoHint}>Ensure the package is clearly visible</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          onPress={handleConfirm}
          disabled={!photoUri}
          style={({ pressed }) => [
            styles.cta,
            !photoUri && styles.ctaDisabled,
            pressed && photoUri && styles.ctaPressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !photoUri }}>
          <Text style={[styles.ctaText, !photoUri && styles.ctaTextDisabled]}>
            {photoUri ? 'Confirm delivery' : 'Take a photo to confirm'}
          </Text>
          <MaterialIcons name="arrow-forward" size={22} color={photoUri ? '#000000' : COLORS.outline} />
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
    zIndex: 1700,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: COLORS.onSurface },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 32,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  section: { gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  photoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 16 / 9,
    gap: 8,
    overflow: 'hidden',
  },
  photoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  photoTitle: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  photoHint: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },
  photoPreview: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  photoRetake: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.fammoYellow,
  },
  photoRetakeText: { fontSize: 12, fontWeight: '800', color: '#000000' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 8,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.fammoYellow,
    shadowColor: COLORS.fammoYellow,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaPressed: { opacity: 0.95, transform: [{ scale: 0.97 }] },
  ctaDisabled: {
    backgroundColor: COLORS.surfaceContainer,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#000000' },
  ctaTextDisabled: { color: COLORS.outline },
});
