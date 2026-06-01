import { Linking, Platform } from 'react-native';

export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export type LatLng = { lat: number; lng: number };

/** Great-circle distance in meters between two coordinates. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatKm(meters: number | null | undefined): string {
  if (meters == null || Number.isNaN(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return 'Rs —';
  return `Rs ${Math.round(Number(price)).toLocaleString()}`;
}

/** Rough drive-time estimate (minutes) assuming ~22 km/h city average. */
export function estimateMinutes(meters: number | null | undefined): string {
  if (meters == null || Number.isNaN(meters)) return '—';
  const mins = Math.max(1, Math.round((meters / 1000 / 22) * 60));
  return `~${mins} min`;
}

/** Hand off to the native Google Maps / Apple Maps app for turn-by-turn navigation. */
export function openTurnByTurn(dest: LatLng, label?: string): void {
  const latlng = `${dest.lat},${dest.lng}`;
  const encodedLabel = label ? encodeURIComponent(label) : '';
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${latlng}${encodedLabel ? `&q=${encodedLabel}` : ''}`
      : `google.navigation:q=${latlng}`;
  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latlng}`);
  });
}

/**
 * Decode a Google encoded polyline string into coordinate pairs.
 * (Used to draw the Directions route on the map.)
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

/** Fetch a driving route polyline from the Google Directions API. */
export async function fetchDirections(
  origin: LatLng,
  destination: LatLng,
): Promise<LatLng[] | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${origin.lat},${origin.lng}` +
      `&destination=${destination.lat},${destination.lng}` +
      `&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    const points = json?.routes?.[0]?.overview_polyline?.points;
    if (typeof points === 'string') return decodePolyline(points);
    return null;
  } catch {
    return null;
  }
}
