import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#fbf9f9',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  onSecondaryContainer: '#646464',
  primary: '#715d00',
  primaryContainer: '#fbd103',
  onPrimaryContainer: '#6d5a00',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  surfaceContainerHigh: '#e9e8e7',
};

const FILTERS = ['All', '5 Stars', '4 Stars', 'Speed'];

type Review = {
  name: string;
  time: string;
  rating: number;
  message: string;
};

const REVIEWS: Review[] = [
  {
    name: 'Sara Ali',
    time: '2 hours ago',
    rating: 5,
    message: 'Very polite and delivered the package quickly!',
  },
  {
    name: 'Michael Zhang',
    time: '5 hours ago',
    rating: 5,
    message: 'Package was handled with care. Excellent service, five stars for sure!',
  },
  {
    name: 'Elena Rodriguez',
    time: 'Yesterday',
    rating: 5,
    message: 'Arrived earlier than expected. Very professional and friendly rider.',
  },
  {
    name: 'David Smith',
    time: '2 days ago',
    rating: 4,
    message: 'Good delivery. The box was slightly wet from the rain but the contents were fine.',
  },
  {
    name: 'Amara Okafor',
    time: '3 days ago',
    rating: 5,
    message: 'Perfect delivery! Highly recommend this rider for sensitive items.',
  },
];

function Stars({ rating, size }: { rating: number; size: number }) {
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialIcons
          key={i}
          name={i < rating ? 'star' : 'star-border'}
          size={size}
          color={COLORS.primaryContainer}
        />
      ))}
    </View>
  );
}

type ReviewsProps = {
  onBack?: () => void;
};

export function Reviews({ onBack }: ReviewsProps) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top app bar */}
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.brand}>FAMMO</Text>
        <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Notifications">
          <MaterialIcons name="notifications" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.scoreNumber}>4.98</Text>
          <Stars rating={5} size={30} />
          <Text style={styles.reviewCount}>1,284 reviews</Text>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {FILTERS.map((filter) => {
            const active = filter === activeFilter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
                <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Review list */}
        <View style={styles.list}>
          {REVIEWS.map((review) => (
            <View key={review.name} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{review.name}</Text>
                  <Text style={styles.cardTime}>{review.time}</Text>
                </View>
                <Stars rating={review.rating} size={18} />
              </View>
              <Text style={styles.cardMessage}>{review.message}</Text>
            </View>
          ))}
        </View>
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
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  summary: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  scoreNumber: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '900',
    letterSpacing: -1,
    color: COLORS.onSurface,
  },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewCount: { fontSize: 16, fontWeight: '600', color: COLORS.onSurfaceVariant, marginTop: 4 },
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  chipActive: { backgroundColor: COLORS.primaryContainer },
  chipInactive: { borderWidth: 1, borderColor: COLORS.outlineVariant },
  chipText: { fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: COLORS.onPrimaryContainer },
  chipTextInactive: { color: COLORS.onSurfaceVariant },
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, gap: 16 },
  card: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface },
  cardTime: { fontSize: 14, fontWeight: '500', color: COLORS.onSecondaryContainer },
  cardMessage: { fontSize: 16, lineHeight: 24, color: COLORS.onSurfaceVariant },
});
