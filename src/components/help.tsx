import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sidebar } from './sidebar';
import { sidebarNavigate } from './sidebar-nav';

const COLORS = {
  background: '#fbf9f9',
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  onBackground: '#1b1c1c',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
};

const SUPPORT_EMAIL = 'Support@fastmotionlogistics.com.ng';
const SUPPORT_PHONE = '+2347026285252';

type Faq = { question: string; answer: string };

const FAQS: Faq[] = [
  {
    question: 'How and when do I get paid for completed deliveries?',
    answer:
      'Your earnings are credited to your in-app wallet as soon as you mark a delivery complete. You can review your balance and payout history any time from the Earnings tab, and withdraw to the bank account on file.',
  },
  {
    question: 'What should I do if I can’t reach the customer at pickup or drop-off?',
    answer:
      'Try calling or messaging them using the contact options on the order screen. If there’s still no response after a few minutes, contact support using the details below and we’ll help you resolve it without affecting your rating.',
  },
  {
    question: 'How do I report a problem with an order?',
    answer:
      'Open the order from your Jobs tab and use the support contact options below — share the order ID and a short description so our team can look into it quickly.',
  },
  {
    question: 'How do I update my bike or document details?',
    answer:
      'Go to Profile, then Bike or Documents to update your information and re-upload files. Changes to verification documents may take a short while to be reviewed.',
  },
  {
    question: 'Why does the app show me as offline when I’m ready to work?',
    answer:
      'Make sure location permissions and GPS are turned on for the app, and that you have a stable internet connection. Toggling the Online switch off and back on from the Home screen usually fixes this.',
  },
];

function FaqItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={({ pressed }) => [styles.faqCard, pressed && styles.faqCardPressed]}
      accessibilityRole="button">
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={22}
          color={COLORS.onSurfaceVariant}
        />
      </View>
      {open ? <Text style={styles.faqAnswer}>{faq.answer}</Text> : null}
    </Pressable>
  );
}

export function Help() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const callSupport = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {});
  };

  const emailSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('FAMO rider support')}`).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top app bar */}
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => setMenuOpen(true)} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Menu">
          <MaterialIcons name="menu" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.brand}>FAMO</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>How can we help?</Text>
        <Text style={styles.subtitle}>
          Reach our support team directly, or check the answers to common questions below.
        </Text>

        {/* Contact us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactRow}>
            <Pressable
              onPress={callSupport}
              style={({ pressed }) => [styles.contactBtn, styles.contactPrimary, pressed && styles.contactPressed]}
              accessibilityRole="button">
              <MaterialIcons name="call" size={28} color={COLORS.onPrimaryContainer} />
              <Text style={styles.contactPrimaryText}>Call us</Text>
              <Text style={styles.contactDetail}>{SUPPORT_PHONE}</Text>
            </Pressable>
            <Pressable
              onPress={emailSupport}
              style={({ pressed }) => [styles.contactBtn, styles.contactSecondary, pressed && styles.contactPressed]}
              accessibilityRole="button">
              <MaterialIcons name="email" size={28} color={COLORS.onBackground} />
              <Text style={styles.contactSecondaryText}>Email us</Text>
              <Text style={styles.contactDetail} numberOfLines={1}>{SUPPORT_EMAIL}</Text>
            </Pressable>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} faq={faq} />
            ))}
          </View>
        </View>
      </ScrollView>

      {menuOpen ? (
        <Sidebar
          onClose={() => setMenuOpen(false)}
          onNavigate={(label) => sidebarNavigate(router, label)}
        />
      ) : null}
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
    gap: 28,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: COLORS.onBackground },
  subtitle: { fontSize: 15, lineHeight: 22, color: COLORS.onSurfaceVariant, marginTop: -16 },
  section: { gap: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
  },
  contactRow: { flexDirection: 'row', gap: 16 },
  contactBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 24,
    paddingHorizontal: 12,
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
  contactDetail: { fontSize: 12, color: COLORS.onSurfaceVariant, maxWidth: '100%' },
  faqList: { gap: 12 },
  faqCard: {
    padding: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    gap: 10,
  },
  faqCardPressed: { borderColor: COLORS.primaryContainer },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.onSurface, lineHeight: 21 },
  faqAnswer: { fontSize: 14, lineHeight: 21, color: COLORS.onSurfaceVariant },
});
