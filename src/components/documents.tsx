import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDocumentUrl, getRiderProfile, type DocType } from '@/hooks/rider-account-api';

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
  success: '#176d3a',
  successContainer: '#d7f5e1',
  warning: '#8a5a00',
  warningContainer: '#ffe0b2',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
};

type DocStatus = 'Verified' | 'Pending' | 'Expired';

type Doc = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  column: 'license_front_path' | 'license_back_path' | 'selfie_path' | 'selfie_with_license_path';
  docType: DocType;
};

const DOCS: Doc[] = [
  { icon: 'badge', title: "Driver's License (Front)", column: 'license_front_path', docType: 'license_front' },
  { icon: 'badge', title: "Driver's License (Back)", column: 'license_back_path', docType: 'license_back' },
  { icon: 'person', title: 'Selfie', column: 'selfie_path', docType: 'selfie' },
  { icon: 'how-to-reg', title: 'Selfie with License', column: 'selfie_with_license_path', docType: 'selfie_with_license' },
];

const STATUS_STYLE: Record<DocStatus, { bg: string; fg: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  Verified: { bg: COLORS.successContainer, fg: COLORS.success, icon: 'check-circle' },
  Pending: { bg: COLORS.warningContainer, fg: COLORS.warning, icon: 'hourglass-top' },
  Expired: { bg: COLORS.errorContainer, fg: COLORS.error, icon: 'error' },
};

type DocumentsProps = {
  onBack?: () => void;
};

export function Documents({ onBack }: DocumentsProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState<Record<Doc['column'], string | null>>({
    license_front_path: null,
    license_back_path: null,
    selfie_path: null,
    selfie_with_license_path: null,
  });
  // Short-lived signed URLs used only to render the thumbnails.
  const [urls, setUrls] = useState<Record<Doc['column'], string | null>>({
    license_front_path: null,
    license_back_path: null,
    selfie_path: null,
    selfie_with_license_path: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const rider = await getRiderProfile();
      if (!active) {
        return;
      }
      if (!rider) {
        setLoading(false);
        return;
      }
      const nextPaths: Record<Doc['column'], string | null> = {
        license_front_path: rider.license_front_path ?? null,
        license_back_path: rider.license_back_path ?? null,
        selfie_path: rider.selfie_path ?? null,
        selfie_with_license_path: rider.selfie_with_license_path ?? null,
      };
      setPaths(nextPaths);
      setLoading(false);

      // Resolve a signed view URL for each uploaded document.
      await Promise.all(
        DOCS.map(async (doc) => {
          const path = nextPaths[doc.column];
          if (!path) {
            return;
          }
          const ext = path.split('.').pop() || 'jpg';
          const signed = await getDocumentUrl(doc.docType, ext);
          if (active && signed) {
            setUrls((prev) => ({ ...prev, [doc.column]: signed }));
          }
        }),
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Documents</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}>
          {DOCS.map((doc) => {
            const uploaded = !!paths[doc.column];
            const uri = urls[doc.column];
            const status: DocStatus = uploaded ? 'Verified' : 'Pending';
            const s = STATUS_STYLE[status];
            return (
              <Pressable
                key={doc.column}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                accessibilityRole="button">
                <View style={styles.docIcon}>
                  {uri ? (
                    <Image source={{ uri }} style={styles.docThumb} contentFit="cover" />
                  ) : (
                    <MaterialIcons name={doc.icon} size={24} color={COLORS.onSurface} />
                  )}
                </View>
                <View style={styles.docBody}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docSubtitle}>{uploaded ? 'Uploaded' : 'Not uploaded'}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                  <MaterialIcons name={s.icon} size={14} color={s.fg} />
                  <Text style={[styles.statusText, { color: s.fg }]}>{uploaded ? 'Uploaded' : 'Missing'}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
  },
  cardPressed: { borderColor: COLORS.primary, transform: [{ scale: 0.99 }] },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  docThumb: { width: '100%', height: '100%' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  docBody: { flex: 1, gap: 2 },
  docTitle: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  docSubtitle: { fontSize: 13, color: COLORS.onSurfaceVariant },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  statusText: { fontSize: 12, fontWeight: '700' },
});
