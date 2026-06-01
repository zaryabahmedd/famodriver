import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { fetchDirections, haversineMeters, LatLng } from '@/hooks/maps';

type RouteMapProps = {
  origin: LatLng | null;
  destination: LatLng;
  /** Optional second leg (e.g. pickup -> dropoff) to also show on the map. */
  via?: LatLng | null;
  style?: object;
  originLabel?: string;
  destinationLabel?: string;
};

const COLORS = {
  route: '#fbd103',
  origin: '#1b1c1c',
  destination: '#715d00',
};

/** Native map showing the rider, the destination, and the driving route. */
export function RouteMap({
  origin,
  destination,
  via,
  style,
  originLabel,
  destinationLabel,
}: RouteMapProps) {
  const [route, setRoute] = useState<LatLng[]>([]);

  const routeOrigin = origin ?? via ?? destination;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const pts = await fetchDirections(routeOrigin, destination);
      if (!cancelled) setRoute(pts ?? [routeOrigin, destination]);
    })();
    return () => {
      cancelled = true;
    };
  }, [routeOrigin.lat, routeOrigin.lng, destination.lat, destination.lng]);

  const region = useMemo(() => {
    const pts = [routeOrigin, destination, ...(via ? [via] : [])];
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const pad = 1.6;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.01, (maxLat - minLat) * pad),
      longitudeDelta: Math.max(0.01, (maxLng - minLng) * pad),
    };
  }, [routeOrigin, destination, via]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation={!!origin}
        showsMyLocationButton={false}
        toolbarEnabled={false}>
        {route.length > 1 && (
          <Polyline coordinates={route.map(toCoord)} strokeColor={COLORS.route} strokeWidth={5} />
        )}
        {origin && (
          <Marker coordinate={toCoord(origin)} title={originLabel ?? 'You'} pinColor="#2563eb" />
        )}
        {via && (
          <Marker coordinate={toCoord(via)} title="Pickup" pinColor="#f59e0b" />
        )}
        <Marker
          coordinate={toCoord(destination)}
          title={destinationLabel ?? 'Destination'}
          pinColor="#16a34a"
        />
      </MapView>
    </View>
  );
}

function toCoord(p: LatLng) {
  return { latitude: p.lat, longitude: p.lng };
}

// Re-export so callers can show a rough distance label without another import.
export { haversineMeters };

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
