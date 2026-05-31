import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notifications } from './notifications';
import { ReportIssue } from './report-issue';
import { Sidebar } from './sidebar';
import { sidebarNavigate } from './sidebar-nav';

const COLORS = {
  background: '#fbf9f9',
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainer: '#efeded',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  onBackground: '#1b1c1c',
  secondary: '#5e5e5e',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
};

type HelpTopic = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
};

const TOPICS: HelpTopic[] = [
  { icon: 'payments', title: 'Payment Issues', subtitle: 'Missing earnings or deposit delays' },
  { icon: 'build', title: 'App Troubleshooting', subtitle: 'Glitches, updates, or GPS issues' },
  { icon: 'local-shipping', title: 'Delivery Problems', subtitle: 'Address errors or customer issues' },
  { icon: 'manage-accounts', title: 'Profile Updates', subtitle: 'Change vehicle or documents' },
];

export function Help() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const openReport = (category?: string) => {
    setReportCategory(category ?? null);
    setReportOpen(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top app bar */}
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => setMenuOpen(true)} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Menu">
          <MaterialIcons name="menu" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.brand}>FAMMO</Text>
        <Pressable onPress={() => setNotificationsOpen(true)} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Notifications">
          <MaterialIcons name="notifications" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Search */}
        <View style={styles.searchSection}>
          <Text style={styles.title}>How can we help?</Text>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={22} color={COLORS.outline} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for help"
              placeholderTextColor={COLORS.outline}
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Quick help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Help</Text>
          <View style={styles.topicList}>
            {TOPICS.map((topic) => (
              <Pressable
                key={topic.title}
                onPress={() => openReport(topic.title)}
                style={({ pressed }) => [styles.topicCard, pressed && styles.topicCardPressed]}
                accessibilityRole="button">
                <View style={styles.topicIcon}>
                  <MaterialIcons name={topic.icon} size={22} color={COLORS.primary} />
                </View>
                <View style={styles.topicText}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={COLORS.outline} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Safety center */}
        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Safety Center</Text>
          <Text style={styles.safetyText}>
            Access emergency tools and report safety incidents 24/7.
          </Text>
        </View>

        {/* Contact us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactRow}>
            <Pressable
              style={({ pressed }) => [styles.contactBtn, styles.contactPrimary, pressed && styles.contactPressed]}
              accessibilityRole="button">
              <MaterialIcons name="chat" size={28} color={COLORS.onPrimaryContainer} />
              <Text style={styles.contactPrimaryText}>Live Chat</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.contactBtn, styles.contactSecondary, pressed && styles.contactPressed]}
              accessibilityRole="button">
              <MaterialIcons name="call" size={28} color={COLORS.onBackground} />
              <Text style={styles.contactSecondaryText}>Call Support</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => openReport()}
            style={({ pressed }) => [styles.reportBtn, pressed && styles.topicCardPressed]}
            accessibilityRole="button">
            <MaterialIcons name="report-problem" size={22} color={COLORS.primary} />
            <Text style={styles.reportText}>Report an issue</Text>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.outline} />
          </Pressable>
        </View>
      </ScrollView>

      {reportOpen ? (
        <ReportIssue
          initialCategory={reportCategory ?? undefined}
          onBack={() => setReportOpen(false)}
        />
      ) : null}
      {menuOpen ? (
        <Sidebar
          onClose={() => setMenuOpen(false)}
          onNavigate={(label) => sidebarNavigate(router, label)}
        />
      ) : null}
      {notificationsOpen ? <Notifications onBack={() => setNotificationsOpen(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  brand: { fontSize: 18, fontWeight: '800', letterSpacing: 1, color: COLORS.onSurface },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  searchSection: { gap: 16 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: COLORS.onBackground },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.onSurface, padding: 0 },
  section: { gap: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
  },
  topicList: { gap: 16 },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
  },
  topicCardPressed: { transform: [{ scale: 0.98 }], borderColor: COLORS.primaryContainer },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(251,209,3,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicText: { flex: 1, gap: 2 },
  topicTitle: { fontSize: 16, fontWeight: '600', color: COLORS.onBackground },
  topicSubtitle: { fontSize: 14, color: COLORS.onSurfaceVariant },
  safetyCard: {
    height: 192,
    borderRadius: 16,
    backgroundColor: COLORS.onBackground,
    padding: 32,
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  safetyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  safetyText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.8)',
    maxWidth: 280,
  },
  contactRow: { flexDirection: 'row', gap: 16 },
  contactBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  contactPrimary: { backgroundColor: COLORS.primaryContainer },
  contactSecondary: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  contactPressed: { transform: [{ scale: 0.95 }] },
  contactPrimaryText: { fontSize: 16, fontWeight: '600', color: COLORS.onPrimaryContainer },
  contactSecondaryText: { fontSize: 16, fontWeight: '600', color: COLORS.onBackground },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  reportText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
});
