import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { uploadRiderDocument, type DocType } from '@/hooks/rider-account-api';


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
  completedBg: '#fffceb',
};

type DocKey = 'licenseFront' | 'licenseBack' | 'selfie' | 'selfieWithCard';

type DocCard = {
  key: DocKey;
  label: string;
  docType: DocType;
};

const DOCS: DocCard[] = [
  { key: 'licenseFront', label: "Driver's License Front", docType: 'license_front' },
  { key: 'licenseBack', label: "Driver's License Back", docType: 'license_back' },
  { key: 'selfie', label: 'Selfie', docType: 'selfie' },
  { key: 'selfieWithCard', label: 'Selfie with Driver License', docType: 'selfie_with_license' },
];

type UploadDocumentsProps = {
  riderId?: string;
  onContinue: () => void;
  onBack?: () => void;
};

export function UploadDocuments({ onContinue, onBack }: UploadDocumentsProps) {
  const insets = useSafeAreaInsets();
  // Local preview URIs for each document
  const [images, setImages] = useState<Record<DocKey, string | null>>({
    licenseFront: null,
    licenseBack: null,
    selfie: null,
    selfieWithCard: null,
  });
  // Which document is currently uploading
  const [uploadingKey, setUploadingKey] = useState<DocKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allUploaded = DOCS.every((doc) => images[doc.key]);

  const uploadToSupabase = async (doc: DocCard, asset: ImagePicker.ImagePickerAsset) => {
    setUploadingKey(doc.key);
    try {
      const result = await uploadRiderDocument(doc.docType, asset.uri, asset.mimeType ?? undefined);
      if (!result.ok) {
        Alert.alert('Upload failed', result.error ?? 'Could not upload the image. Please try again.');
        return;
      }
      setImages((prev) => ({ ...prev, [doc.key]: asset.uri }));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not upload the image. Please try again.');
    } finally {
      setUploadingKey(null);
    }
  };

  const capturePhoto = async (doc: DocCard) => {
    // Selfies use the front-facing camera
    const isSelfie = doc.key === 'selfie' || doc.key === 'selfieWithCard';

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera permission needed',
        'Please allow camera access in your device settings to take document photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // enables crop + rotate UI
      aspect: isSelfie ? [3, 4] : [4, 3],
      quality: 0.7,
      cameraType: isSelfie ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
    });

    if (!result.canceled && result.assets?.[0]) {
      await uploadToSupabase(doc, result.assets[0]);
    }
  };

  const handleContinue = async () => {
    if (!allUploaded) {
      Alert.alert('Incomplete', 'Please capture all four required documents before continuing.');
      return;
    }
    setSubmitting(true);
    try {
      // Each document's path was recorded server-side during sign_upload.
      onContinue();
    } finally {
      setSubmitting(false);
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
          <Text style={styles.stepText}>SIGN UP · STEP 3/5</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>Upload documents</Text>
          <Text style={styles.subtitle}>Tap a card to open the camera. You can crop and rotate before saving.</Text>
        </View>

        {/* Upload grid */}
        <View style={styles.grid}>
          {DOCS.map((doc) => {
            const uri = images[doc.key];
            const done = !!uri;
            const isUploading = uploadingKey === doc.key;
            return (
              <Pressable
                key={doc.key}
                onPress={() => !isUploading && capturePhoto(doc)}
                disabled={isUploading}
                style={({ pressed }) => [
                  styles.card,
                  done ? styles.cardDone : styles.cardPending,
                  pressed && styles.cardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={doc.label}>
                {uri ? (
                  <Image source={{ uri }} style={styles.preview} contentFit="cover" />
                ) : null}

                {isUploading ? (
                  <View style={styles.overlay}>
                    <ActivityIndicator color={COLORS.primaryContainer} />
                    <Text style={styles.overlayText}>Uploading...</Text>
                  </View>
                ) : done ? (
                  <View style={styles.doneBadge}>
                    <MaterialIcons name="check-circle" size={22} color={COLORS.primaryContainer} />
                    <Text style={styles.retakeText}>Tap to retake</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.iconCircle}>
                      <MaterialIcons name="photo-camera" size={28} color={COLORS.onPrimaryContainer} />
                    </View>
                    <Text style={styles.cardLabel}>{doc.label}</Text>
                  </>
                )}

                {done && !isUploading ? (
                  <View style={styles.labelChip}>
                    <Text style={styles.labelChipText} numberOfLines={1}>{doc.label}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleContinue}
          disabled={submitting || !allUploaded}
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
            (submitting || !allUploaded) && { opacity: 0.5 },
          ]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>{submitting ? 'Saving...' : 'Continue'}</Text>
          {!submitting && <MaterialIcons name="arrow-forward" size={20} color="#000000" />}
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
    width: '50%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  heading: {
    gap: 6,
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  card: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  cardDone: {
    backgroundColor: COLORS.completedBg,
    borderWidth: 1,
    borderColor: 'rgba(251, 209, 3, 0.4)',
  },
  cardPending: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(208, 198, 171, 0.6)',
  },
  cardPressed: {
    transform: [{ scale: 0.96 }],
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 28, 28, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  doneBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 28, 28, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retakeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
    color: COLORS.onSurfaceVariant,
  },
  labelChip: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(27, 28, 28, 0.75)',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  labelChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
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
