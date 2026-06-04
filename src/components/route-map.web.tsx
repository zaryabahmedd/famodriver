import { StyleSheet, Text, View } from 'react-native';

import { LatLng } from '@/hooks/maps';

type RouteMapProps = {
  origin: LatLng | null;
  destination: LatLng;
  via?: LatLng | null;
  routeOverride?: LatLng[] | null;
  style?: object;
  originLabel?: string;
  destinationLabel?: string;
  navigation?: boolean;
};

/** Web fallback: react-native-maps is native-only. */
export function RouteMap({ style }: RouteMapProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>Live map available in the mobile app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef0f2',
  },
  text: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
});
