import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
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
  success: '#22c55e',
};

const AVATAR_URI =
  'https://lh3.googleusercontent.com/aida/ADBb0ujS-tqqpzwjlG_xyAfylS0Yyk_zz0sK0kL6VegDbOI3XKFds6mk57O17CBaGpgTrzNt5CMxP_qATmN2xUx31G2o6qrSrP3Joomsf15Zbvth4XYeHv-MUIvtOUtyNIQZmAxF4GXURmiZLfcfWCtG4XvMb9BIFZ7zlfDtqtEM-LJheTp0_C6K_zZb8B5fmdPgDpJHoQ8jXwObzByov9C4C96cy90E8nXrvgJ-TMYIESe6sjC_1DIkkxWmOZo';

const QUICK_REPLIES = ['On my way!', "I'm outside", 'Running 5 min late', 'Where exactly?'];

type Message = {
  id: number;
  text: string;
  fromMe: boolean;
  time: string;
};

const INITIAL: Message[] = [
  { id: 1, text: 'Hi! I just picked up your package.', fromMe: true, time: '2:02 PM' },
  { id: 2, text: 'Great, thank you! How long will it take?', fromMe: false, time: '2:03 PM' },
  { id: 3, text: 'About 15 minutes. Traffic is light.', fromMe: true, time: '2:03 PM' },
  { id: 4, text: 'Perfect. Please ring the bell when you arrive.', fromMe: false, time: '2:04 PM' },
];

type ChatProps = {
  name?: string;
  onBack?: () => void;
  onCall?: () => void;
};

export function Chat({ name = 'Sara Ali', onBack, onCall }: ChatProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, text: trimmed, fromMe: true, time: 'Now' },
    ]);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerName}>{name}</Text>
            <Text style={styles.headerStatus}>Recipient · Online</Text>
          </View>
        </View>
        <Pressable onPress={onCall} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Call">
          <MaterialIcons name="call" size={22} color={COLORS.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          <Text style={styles.dateChip}>Today</Text>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.bubbleRow, msg.fromMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
              <View style={[styles.bubble, msg.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, msg.fromMe && styles.bubbleTextMe]}>{msg.text}</Text>
                <Text style={[styles.bubbleTime, msg.fromMe && styles.bubbleTimeMe]}>{msg.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Quick replies */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}>
          {QUICK_REPLIES.map((reply) => (
            <Pressable key={reply} onPress={() => send(reply)} style={styles.quickChip} accessibilityRole="button">
              <Text style={styles.quickText}>{reply}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Composer */}
        <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.inputWrap}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message"
              placeholderTextColor={COLORS.outline}
              style={styles.input}
              multiline
              onSubmitEditing={() => send(draft)}
            />
          </View>
          <Pressable
            onPress={() => send(draft)}
            style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Send">
            <MaterialIcons name="send" size={22} color={COLORS.onPrimaryContainer} />
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
    zIndex: 1800,
  },
  flex: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  headerName: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  headerStatus: { fontSize: 12, color: COLORS.onSurfaceVariant },
  messages: { padding: 16, gap: 10, maxWidth: 480, width: '100%', alignSelf: 'center' },
  dateChip: {
    alignSelf: 'center',
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    overflow: 'hidden',
    marginBottom: 4,
  },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 2 },
  bubbleMe: { backgroundColor: COLORS.primaryContainer, borderBottomRightRadius: 4 },
  bubbleThem: {
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 20, color: COLORS.onSurface },
  bubbleTextMe: { color: COLORS.onPrimaryContainer },
  bubbleTime: { fontSize: 10, color: COLORS.onSurfaceVariant, alignSelf: 'flex-end' },
  bubbleTimeMe: { color: COLORS.onPrimaryContainer, opacity: 0.7 },
  quickRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  quickText: { fontSize: 13, fontWeight: '500', color: COLORS.onSurfaceVariant },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  inputWrap: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 24,
  },
  input: { fontSize: 15, color: COLORS.onSurface, paddingVertical: 12 },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
