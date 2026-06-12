import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPackageCategory, formatPackageSize, type Delivery } from '@/hooks/rider-api';
import { useUnreadDeliveryMessages } from '@/hooks/use-delivery-chat';

import { Chat } from './chat';
import { ChatBadge } from './chat-badge';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  onSurface: '#1b1c1c',
  gray900: '#111827',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray100: '#f3f4f6',
  primaryContainer: '#fbd103',
  errorContainer: '#ffdad6',
  error: '#ba1a1a',
  fammoYellow: '#fbd103',
};

type Row = {
  label: string;
  value: string;
};

type VerifyPackageProps = {
  onContinue: () => void;
  onBack: () => void;
  delivery?: Delivery | null;
};

export function VerifyPackage({ onContinue, onBack, delivery }: VerifyPackageProps) {
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const { unread, markRead } = useUnreadDeliveryMessages(delivery?.id ?? null, 'rider');
  const customerName =
    delivery?.users?.full_name ?? delivery?.recipient_name ?? delivery?.sender_name ?? 'Customer';

  const openChat = () => {
    markRead();
    setChatOpen(true);
  };
  const closeChat = () => {
    markRead();
    setChatOpen(false);
  };

  const capturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera permission needed',
        'Please allow camera access in your device settings to take the package photo.'
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

  const handleContinue = () => {
    if (!photoUri) return;
    onContinue();
  };

  const weightLabel = delivery?.weight != null ? `${delivery.weight} kg` : '—';
  const rows: Row[] = [
    { label: 'Type', value: formatPackageCategory(delivery?.package_category) ?? '—' },
    { label: 'Size', value: formatPackageSize(delivery?.package_size) ?? '—' },
    { label: 'Weight', value: weightLabel },
  ];
  const description = delivery?.package_description?.trim() || null;
  const specialInstructions = delivery?.special_instructions?.trim() || null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="chevron-left" size={26} color={COLORS.gray900} />
        </Pressable>
        <Text style={styles.title}>Verify package</Text>
        <Pressable
          onPress={() => delivery?.id && openChat()}
          disabled={!delivery?.id}
          style={[styles.backBtn, !delivery?.id && styles.chatBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Message customer">
          <MaterialIcons name="chat-bubble-outline" size={22} color={COLORS.gray900} />
          <ChatBadge count={unread} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.subtext}>Confirm the package matches the order details.</Text>

        {/* Order details */}
        <View style={styles.table}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue} numberOfLines={2}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Notes from the customer */}
        {description || specialInstructions ? (
          <View style={styles.notes}>
            {description ? (
              <View style={styles.noteBlock}>
                <Text style={styles.noteLabel}>Description</Text>
                <Text style={styles.noteText}>{description}</Text>
              </View>
            ) : null}
            {specialInstructions ? (
              <View style={styles.noteBlock}>
                <Text style={styles.noteLabel}>Handling instructions</Text>
                <Text style={styles.noteText}>{specialInstructions}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Photo confirmation */}
        <View style={styles.photoWrap}>
          <Pressable
            onPress={capturePhoto}
            style={styles.photoCard}
            accessibilityRole="button"
            accessibilityLabel={photoUri ? 'Retake package photo' : 'Take package photo'}>
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
                <View style={styles.photoCheck}>
                  <MaterialIcons name="photo-camera" size={28} color={COLORS.fammoYellow} />
                </View>
                <Text style={styles.photoTitle}>Take package photo</Text>
                <Text style={styles.photoHint}>Tap to capture</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Footer action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          onPress={handleContinue}
          disabled={!photoUri}
          style={({ pressed }) => [
            styles.cta,
            !photoUri && styles.ctaDisabled,
            pressed && photoUri && styles.ctaPressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !photoUri }}>
          <Text style={[styles.ctaText, !photoUri && styles.ctaTextDisabled]}>
            {photoUri ? 'Continue' : 'Take a photo to continue'}
          </Text>
          <MaterialIcons name="arrow-forward" size={22} color={photoUri ? '#000000' : COLORS.gray400} />
        </Pressable>
      </View>

      {chatOpen ? (
        <Chat deliveryId={delivery?.id ?? null} name={customerName} onBack={closeChat} />
      ) : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.gray900 },
  spacer: { width: 44 },
  chatBtnDisabled: { opacity: 0.4 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  subtext: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray500,
    marginBottom: 32,
  },
  table: { gap: 8, marginBottom: 24 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  colLabel: { width: '30%' },
  colHeaderText: {
    width: '35%',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray400,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowDiscrepancy: {
    backgroundColor: 'rgba(255,218,214,0.3)',
    borderColor: 'rgba(186,26,26,0.1)',
  },
  rowLabel: {
    width: '30%',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray400,
    textTransform: 'uppercase',
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  notes: { gap: 12, marginBottom: 8 },
  noteBlock: {
    gap: 4,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gray400,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  noteText: { fontSize: 14, fontWeight: '500', color: COLORS.gray900, lineHeight: 20 },
  actualCell: {
    width: '35%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rowValueError: { width: 'auto', color: COLORS.error },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(251,209,3,0.12)',
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fammoYellow,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray900,
    lineHeight: 18,
  },
  photoWrap: { marginTop: 32, marginBottom: 8 },
  photoCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(251,209,3,0.06)',
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    borderStyle: 'dashed',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  photoCheck: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  photoTitle: { fontSize: 14, fontWeight: '800', color: COLORS.gray900 },
  photoHint: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray400,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  photoPreview: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
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
    backgroundColor: COLORS.gray100,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#000000' },
  ctaTextDisabled: { color: COLORS.gray400 },
});
