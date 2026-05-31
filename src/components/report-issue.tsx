import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  surfaceContainerLow: '#f5f3f3',
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
};

const CATEGORIES: { icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
  { icon: 'payments', label: 'Payment' },
  { icon: 'local-shipping', label: 'Delivery' },
  { icon: 'build', label: 'App issue' },
  { icon: 'person', label: 'Account' },
  { icon: 'shield', label: 'Safety' },
  { icon: 'more-horiz', label: 'Other' },
];

type ReportIssueProps = {
  onBack: () => void;
  onSubmit?: (ticket: { category: string; subject: string; description: string }) => void;
  initialCategory?: string;
};

export function ReportIssue({ onBack, onSubmit, initialCategory }: ReportIssueProps) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<string | null>(initialCategory ?? null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attached, setAttached] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = !!category && subject.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit?.({ category: category!, subject: subject.trim(), description: description.trim() });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Close">
            <MaterialIcons name="close" size={24} color={COLORS.onSurfaceVariant} />
          </Pressable>
          <Text style={styles.appBarTitle}>Support Ticket</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check" size={44} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Ticket submitted</Text>
          <Text style={styles.successText}>
            Thanks for reaching out. Our support team will get back to you within 24 hours. Your
            ticket reference is{' '}
            <Text style={styles.ticketRef}>#FM-{Math.floor(100000 + Math.random() * 900000)}</Text>.
          </Text>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            accessibilityRole="button">
            <Text style={styles.primaryBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Report an Issue</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>What's it about?</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const selected = cat.label === category;
              return (
                <Pressable
                  key={cat.label}
                  onPress={() => setCategory(cat.label)}
                  style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                  accessibilityRole="button">
                  <MaterialIcons
                    name={cat.icon}
                    size={22}
                    color={selected ? COLORS.onPrimaryContainer : COLORS.primary}
                  />
                  <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary of the issue"
            placeholderTextColor={COLORS.outline}
            style={styles.input}
            maxLength={80}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tell us what happened in detail…"
            placeholderTextColor={COLORS.outline}
            style={[styles.input, styles.textarea]}
            multiline
            textAlignVertical="top"
            maxLength={600}
          />
          <Text style={styles.counter}>{description.length}/600</Text>

          <Pressable
            onPress={() => setAttached((v) => !v)}
            style={({ pressed }) => [styles.attachBtn, pressed && styles.btnPressed]}
            accessibilityRole="button">
            <MaterialIcons
              name={attached ? 'check-circle' : 'attach-file'}
              size={20}
              color={attached ? COLORS.success : COLORS.primary}
            />
            <Text style={styles.attachText}>
              {attached ? 'screenshot.png attached' : 'Attach a screenshot (optional)'}
            </Text>
          </Pressable>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.primaryBtn,
              !canSubmit && styles.primaryBtnDisabled,
              pressed && styles.btnPressed,
            ]}
            accessibilityRole="button">
            <Text style={styles.primaryBtnText}>Submit ticket</Text>
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
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  scroll: { padding: 20, gap: 10, maxWidth: 480, width: '100%', alignSelf: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface, marginTop: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    width: '31%',
    flexGrow: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
    alignItems: 'center',
    gap: 6,
  },
  categoryCardSelected: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primaryContainer },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant },
  categoryLabelSelected: { color: COLORS.onPrimaryContainer },
  input: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  textarea: { minHeight: 140 },
  counter: { fontSize: 12, color: COLORS.onSurfaceVariant, alignSelf: 'flex-end' },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.outline,
    backgroundColor: COLORS.surfaceContainerLow,
    marginTop: 8,
  },
  attachText: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.onPrimaryContainer },
  btnPressed: { opacity: 0.85 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '700', color: COLORS.onSurface },
  successText: { fontSize: 15, lineHeight: 22, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  ticketRef: { fontWeight: '700', color: COLORS.onSurface },
});
