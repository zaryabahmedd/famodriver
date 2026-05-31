import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  subtitle: string;
  status: DocStatus;
};

const DOCS: Doc[] = [
  { icon: 'badge', title: 'National ID Card', subtitle: 'Uploaded · 12 Jan 2025', status: 'Verified' },
  { icon: 'directions-car', title: "Driver's License", subtitle: 'Expires · 04 Aug 2027', status: 'Verified' },
  { icon: 'article', title: 'Vehicle Registration', subtitle: 'Uploaded · 12 Jan 2025', status: 'Verified' },
  { icon: 'health-and-safety', title: 'Insurance Certificate', subtitle: 'Under review', status: 'Pending' },
  { icon: 'verified-user', title: 'Police Clearance', subtitle: 'Expired · 01 Mar 2026', status: 'Expired' },
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

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {DOCS.map((doc) => {
          const s = STATUS_STYLE[doc.status];
          return (
            <Pressable
              key={doc.title}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              accessibilityRole="button">
              <View style={styles.docIcon}>
                <MaterialIcons name={doc.icon} size={24} color={COLORS.onSurface} />
              </View>
              <View style={styles.docBody}>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.docSubtitle}>{doc.subtitle}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                <MaterialIcons name={s.icon} size={14} color={s.fg} />
                <Text style={[styles.statusText, { color: s.fg }]}>{doc.status}</Text>
              </View>
            </Pressable>
          );
        })}

        <Pressable
          style={({ pressed }) => [styles.uploadBtn, pressed && styles.uploadBtnPressed]}
          accessibilityRole="button">
          <MaterialIcons name="upload-file" size={20} color={COLORS.onPrimaryContainer} />
          <Text style={styles.uploadText}>Upload new document</Text>
        </Pressable>
      </ScrollView>
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
  },
  docBody: { flex: 1, gap: 2 },
  docTitle: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  docSubtitle: { fontSize: 13, color: COLORS.onSurfaceVariant },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  statusText: { fontSize: 12, fontWeight: '700' },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    marginTop: 8,
  },
  uploadBtnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  uploadText: { fontSize: 15, fontWeight: '700', color: COLORS.onPrimaryContainer },
});
