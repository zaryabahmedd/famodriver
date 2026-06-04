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
  if (price == null) return '₦—';
  return `₦${Math.round(Number(price)).toLocaleString()}`;
}

/** Delivery fare rate in Nigerian Naira (₦) per kilometre. */
export const FARE_PER_KM = 180;

/**
 * Compute the delivery fare in Naira from a distance in metres at the flat
 * ₦180/km rate. Returns null when the distance is unknown.
 */
export function calculateFare(meters: number | null | undefined): number | null {
  if (meters == null || Number.isNaN(meters)) return null;
  return Math.round((meters / 1000) * FARE_PER_KM);
}

/** Rough drive-time estimate (minutes) assuming ~22 km/h city average. */
export function estimateMinutes(meters: number | null | undefined): string {
  if (meters == null || Number.isNaN(meters)) return '—';
  const mins = Math.max(1, Math.round((meters / 1000 / 22) * 60));
  return `~${mins} min`;
}

/** Format a duration in seconds as a compact ETA label (e.g. "~7 min"). */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return '—';
  const mins = Math.max(1, Math.round(seconds / 60));
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
  const route = await fetchRoute(origin, destination);
  return route?.polyline ?? null;
}

/** A single turn-by-turn maneuver from the Directions API. */
export type NavStep = {
  /** Human-readable instruction with HTML stripped (e.g. "Turn left onto Main St"). */
  instruction: string;
  /** Google maneuver code (e.g. "turn-left", "roundabout-right"), or null for "head". */
  maneuver: string | null;
  distanceMeters: number;
  durationSeconds: number;
  start: LatLng;
  /** Coordinate where this step ends (i.e. where the maneuver happens). */
  end: LatLng;
};

/** A full driving route: drawable polyline + step list + totals. */
export type NavRoute = {
  polyline: LatLng[];
  steps: NavStep[];
  distanceMeters: number;
  durationSeconds: number;
};

/** Strip HTML tags/entities from a Directions `html_instructions` string. */
export function stripHtmlInstructions(html: string): string {
  return html
    .replace(/<div[^>]*>/gi, ' - ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch a full driving route (polyline + turn-by-turn steps + ETA) from the
 * Google Directions API. Returns null if no API key is set or the request fails.
 */
export async function fetchRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<NavRoute | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${origin.lat},${origin.lng}` +
      `&destination=${destination.lat},${destination.lng}` +
      `&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    const route = json?.routes?.[0];
    const leg = route?.legs?.[0];
    if (!route || !leg) return null;

    const overview = route.overview_polyline?.points;
    const polyline =
      typeof overview === 'string' ? decodePolyline(overview) : [origin, destination];

    const steps: NavStep[] = Array.isArray(leg.steps)
      ? leg.steps.map((s: any): NavStep => ({
          instruction: stripHtmlInstructions(String(s.html_instructions ?? '')),
          maneuver: typeof s.maneuver === 'string' ? s.maneuver : null,
          distanceMeters: Number(s.distance?.value ?? 0),
          durationSeconds: Number(s.duration?.value ?? 0),
          start: { lat: s.start_location?.lat, lng: s.start_location?.lng },
          end: { lat: s.end_location?.lat, lng: s.end_location?.lng },
        }))
      : [];

    return {
      polyline,
      steps,
      distanceMeters: Number(leg.distance?.value ?? 0),
      durationSeconds: Number(leg.duration?.value ?? 0),
    };
  } catch {
    return null;
  }
}

/** Map a Google maneuver code to a MaterialIcons glyph name for the nav banner. */
export function maneuverIcon(maneuver: string | null): string {
  switch (maneuver) {
    case 'turn-left':
    case 'turn-slight-left':
    case 'turn-sharp-left':
    case 'ramp-left':
    case 'fork-left':
      return 'turn-left';
    case 'turn-right':
    case 'turn-slight-right':
    case 'turn-sharp-right':
    case 'ramp-right':
    case 'fork-right':
      return 'turn-right';
    case 'uturn-left':
    case 'uturn-right':
      return 'u-turn-left';
    case 'roundabout-left':
    case 'roundabout-right':
      return 'roundabout-left';
    case 'merge':
      return 'merge';
    case 'straight':
      return 'straight';
    default:
      return 'navigation';
  }
}
