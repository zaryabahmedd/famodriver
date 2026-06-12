import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Delivery } from '@/hooks/rider-api';
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
  fammoYellow: '#fbd103',
  positive: '#1f7a3a',
  positiveContainer: 'rgba(31,122,58,0.08)',
};

type PaymentMethodProps = {
  onContinue: () => void;
  onBack: () => void;
  delivery?: Delivery | null;
};

export function PaymentMethod({ onContinue, onBack, delivery }: PaymentMethodProps) {
  const insets = useSafeAreaInsets();
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

  const isCod = delivery?.payment_method === 'cod';
  const isBankTransfer = delivery?.payment_method === 'bank_transfer';
  const screenshot = delivery?.payment_screenshot_url?.trim() || null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="chevron-left" size={26} color={COLORS.gray900} />
        </Pressable>
        <Text style={styles.title}>Payment method</Text>
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
        <Text style={styles.subtext}>Confirm how the customer is paying for this delivery before handing over the package.</Text>

        {isCod ? (
          <View style={[styles.card, styles.cardCod]}>
            <View style={[styles.cardIcon, styles.cardIconCod]}>
              <MaterialIcons name="payments" size={28} color="#000000" />
            </View>
            <Text style={styles.cardTitle}>COD selected by the user</Text>
            <Text style={styles.cardHint}>
              The user has selected Cash on Delivery (COD) — take payment of {delivery?.price != null ? `₦${Math.round(Number(delivery.price)).toLocaleString()}` : 'the order amount'} from the package receiver before confirming the delivery.
            </Text>
          </View>
        ) : isBankTransfer ? (
          <View style={[styles.card, styles.cardBank]}>
            <View style={[styles.cardIcon, styles.cardIconBank]}>
              <MaterialIcons name="account-balance" size={28} color="#000000" />
            </View>
            <Text style={styles.cardTitle}>Payment has been selected as Bank Account</Text>
            <Text style={styles.cardHint}>
              The user paid by bank transfer and has attached a screenshot of the transaction below — no cash is required from them at drop-off.
            </Text>

            {screenshot ? (
              <View style={styles.screenshotWrap}>
                <Text style={styles.screenshotLabel}>Screenshot of the transaction</Text>
                <Image source={{ uri: screenshot }} style={styles.screenshot} contentFit="cover" />
              </View>
            ) : (
              <View style={styles.noScreenshot}>
                <MaterialIcons name="image-not-supported" size={18} color={COLORS.gray400} />
                <Text style={styles.noScreenshotText}>The user did not attach a payment screenshot</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.card, styles.cardUnknown]}>
            <View style={[styles.cardIcon, styles.cardIconUnknown]}>
              <MaterialIcons name="help-outline" size={28} color={COLORS.gray500} />
            </View>
            <Text style={styles.cardTitle}>Payment method not specified</Text>
            <Text style={styles.cardHint}>
              The customer didn’t specify a payment method for this order. Confirm with them directly at drop-off.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>Continue to package photo</Text>
          <MaterialIcons name="arrow-forward" size={22} color="#000000" />
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
    marginBottom: 24,
  },
  card: {
    gap: 12,
    padding: 24,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardCod: { borderColor: COLORS.primaryContainer, backgroundColor: 'rgba(251,209,3,0.06)' },
  cardBank: { borderColor: COLORS.positive, backgroundColor: COLORS.positiveContainer },
  cardUnknown: {},
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconCod: { backgroundColor: COLORS.fammoYellow },
  cardIconBank: { backgroundColor: '#bfe8cc' },
  cardIconUnknown: { backgroundColor: COLORS.gray100 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.gray900, lineHeight: 24 },
  cardHint: { fontSize: 14, fontWeight: '500', color: COLORS.gray500, lineHeight: 20 },
  screenshotWrap: { gap: 8, marginTop: 8 },
  screenshotLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gray400,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  screenshot: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
  },
  noScreenshot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
  },
  noScreenshotText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
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
  ctaText: { fontSize: 18, fontWeight: '700', color: '#000000' },
});
