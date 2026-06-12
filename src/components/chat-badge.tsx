import { StyleSheet, Text, View } from 'react-native';

/**
 * Small unread-count bubble rendered over a chat icon. Absolutely positioned to
 * the top-right of its parent (the parent must not clip overflow). Renders
 * nothing when `count` is zero.
 */
export function ChatBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge} pointerEvents="none">
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800', lineHeight: 13 },
});
