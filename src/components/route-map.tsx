import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

// Google Maps on Android (the Android default + our API key); Apple Maps on
// iOS via the default provider. Apple Maps needs no API key, billing, or Google
// Cloud "Maps SDK for iOS" setup, so the map renders reliably on iOS out of the
// box. Our custom route polyline, markers and 3D follow-camera work on both.
const MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

import { fetchDirections, haversineMeters, LatLng } from '@/hooks/maps';

type RouteMapProps = {
  origin: LatLng | null;
  destination: LatLng;
  /** Optional second leg (e.g. pickup -> dropoff) to also show on the map. */
  via?: LatLng | null;
  /** Precomputed route polyline (e.g. from useTurnByTurn) to draw instead of fetching. */
  routeOverride?: LatLng[] | null;
  style?: object;
  originLabel?: string;
  destinationLabel?: string;
  /**
   * Turn-by-turn mode: tilt into a 3D "course-up" camera that follows the rider
   * (origin) and rotates toward the road ahead, like Google Maps navigation.
   */
  navigation?: boolean;
};

const COLORS = {
  route: '#fbd103',
  origin: '#1b1c1c',
  destination: '#715d00',
};

// 3D navigation camera tuning.
const NAV_PITCH = 55;
const NAV_ZOOM = 17.5;
const NAV_LOOKAHEAD_M = 30;

/** Compass bearing (deg) from point a to point b. */
function bearing(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/**
 * Heading the rider should face: bearing toward the first route point that is
 * at least NAV_LOOKAHEAD_M ahead of the rider, so the camera looks "down the
 * road" rather than jittering on the nearest vertex.
 */
function headingAlongRoute(rider: LatLng, route: LatLng[]): number | null {
  if (route.length < 2) return null;
  // Find the closest vertex to the rider, then look ahead from there.
  let nearestIdx = 0;
  let nearestD = Infinity;
  for (let i = 0; i < route.length; i++) {
    const d = haversineMeters(rider, route[i]);
    if (d < nearestD) {
      nearestD = d;
      nearestIdx = i;
    }
  }
  for (let i = nearestIdx; i < route.length; i++) {
    if (haversineMeters(rider, route[i]) >= NAV_LOOKAHEAD_M) {
      return bearing(rider, route[i]);
    }
  }
  return bearing(rider, route[route.length - 1]);
}

/** Native map showing the rider, the destination, and the driving route. */
export function RouteMap({
  origin,
  destination,
  via,
  routeOverride,
  style,
  originLabel,
  destinationLabel,
  navigation = false,
}: RouteMapProps) {
  const [route, setRoute] = useState<LatLng[]>([]);
  const mapRef = useRef<MapView | null>(null);

  const routeOrigin = origin ?? via ?? destination;

  useEffect(() => {
    // When a route is supplied by the caller (turn-by-turn), draw it directly
    // and skip the redundant Directions fetch.
    if (routeOverride && routeOverride.length > 1) {
      setRoute(routeOverride);
      return;
    }
    let cancelled = false;
    void (async () => {
      const pts = await fetchDirections(routeOrigin, destination);
      if (!cancelled) setRoute(pts ?? [routeOrigin, destination]);
    })();
    return () => {
      cancelled = true;
    };
  }, [routeOverride, routeOrigin.lat, routeOrigin.lng, destination.lat, destination.lng]);

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

  // 3D follow camera: re-aim at the rider each time their GPS or the route
  // updates, tilting the camera and rotating toward the road ahead.
  useEffect(() => {
    if (!navigation || !origin || !mapRef.current) return;
    const heading = headingAlongRoute(origin, route) ?? 0;
    mapRef.current.animateCamera(
      {
        center: { latitude: origin.lat, longitude: origin.lng },
        pitch: NAV_PITCH,
        heading,
        zoom: NAV_ZOOM,
      },
      { duration: 800 },
    );
  }, [navigation, origin?.lat, origin?.lng, route]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={MAP_PROVIDER}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation={!!origin}
        showsMyLocationButton={false}
        showsCompass={navigation}
        showsBuildings={navigation}
        pitchEnabled
        rotateEnabled
        toolbarEnabled={false}>
        {route.length > 1 && (
          <Polyline coordinates={route.map(toCoord)} strokeColor={COLORS.route} strokeWidth={navigation ? 8 : 5} />
        )}
        {origin && !navigation && (
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
