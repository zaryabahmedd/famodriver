import { useEffect, useRef, useState } from 'react';

import { fetchRoute, haversineMeters, LatLng, NavRoute, NavStep } from './maps';

/** Distance (m) from a step's end at which we consider that maneuver completed. */
const ADVANCE_RADIUS_M = 35;
/** If the rider strays this far (m) from the route polyline, re-fetch directions. */
const REROUTE_THRESHOLD_M = 70;
/** Re-fetch the destination route if it shifts by more than this (m). */
const DEST_MOVE_THRESHOLD_M = 40;

export type TurnByTurn = {
  /** Drawable route polyline for the map (null until the first fetch resolves). */
  polyline: LatLng[] | null;
  /** The maneuver the rider is currently approaching. */
  currentStep: NavStep | null;
  /** The step after the current one (for a "then…" preview). */
  nextStep: NavStep | null;
  /** Straight-line distance (m) from the rider to the current maneuver point. */
  distanceToManeuver: number | null;
  /** Remaining driving distance (m) to the destination along the route. */
  remainingMeters: number | null;
  /** Remaining driving time (s) to the destination along the route. */
  remainingSeconds: number | null;
  /** True while a directions request is in flight. */
  loading: boolean;
};

const EMPTY: TurnByTurn = {
  polyline: null,
  currentStep: null,
  nextStep: null,
  distanceToManeuver: null,
  remainingMeters: null,
  remainingSeconds: null,
  loading: false,
};

/** Shortest distance (m) from a point to a polyline (segment-wise). */
function distanceToPolyline(point: LatLng, line: LatLng[]): number {
  if (line.length === 0) return Infinity;
  let min = Infinity;
  for (let i = 0; i < line.length; i++) {
    const d = haversineMeters(point, line[i]);
    if (d < min) min = d;
  }
  return min;
}

/**
 * Live in-app turn-by-turn navigation driven by the rider's GPS.
 *
 * Fetches a Google Directions route once per origin/destination, then advances
 * the active step as the rider's coordinates move past each maneuver. Re-fetches
 * when the rider drifts off-route or the destination changes. Returns null-ish
 * fields (graceful degradation) when no API key is configured.
 */
export function useTurnByTurn(
  riderCoords: LatLng | null,
  destination: LatLng | null,
): TurnByTurn {
  const [route, setRoute] = useState<NavRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Refs that drive the fetch decision without re-running effects on every tick.
  const fetchedDestRef = useRef<LatLng | null>(null);
  const fetchedOriginRef = useRef<LatLng | null>(null);
  const inFlightRef = useRef(false);

  // (Re)fetch the route when needed: no route yet, destination moved, or the
  // rider has strayed off the existing polyline.
  useEffect(() => {
    if (!destination || !riderCoords) return;

    const destMoved =
      !fetchedDestRef.current ||
      haversineMeters(fetchedDestRef.current, destination) > DEST_MOVE_THRESHOLD_M;
    const offRoute =
      route != null && distanceToPolyline(riderCoords, route.polyline) > REROUTE_THRESHOLD_M;
    const needsFetch = route == null || destMoved || offRoute;

    if (!needsFetch || inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);
    let cancelled = false;
    void (async () => {
      const next = await fetchRoute(riderCoords, destination);
      if (!cancelled) {
        if (next) {
          setRoute(next);
          setStepIndex(0);
          fetchedDestRef.current = destination;
          fetchedOriginRef.current = riderCoords;
        }
        setLoading(false);
      }
      inFlightRef.current = false;
    })();
    return () => {
      cancelled = true;
    };
  }, [riderCoords, destination, route]);

  // Advance the active step as the rider passes each maneuver point.
  useEffect(() => {
    if (!route || !riderCoords || route.steps.length === 0) return;
    let idx = stepIndex;
    while (
      idx < route.steps.length - 1 &&
      haversineMeters(riderCoords, route.steps[idx].end) < ADVANCE_RADIUS_M
    ) {
      idx++;
    }
    if (idx !== stepIndex) setStepIndex(idx);
  }, [riderCoords, route, stepIndex]);

  if (!route) return { ...EMPTY, loading };

  const currentStep = route.steps[stepIndex] ?? null;
  const nextStep = route.steps[stepIndex + 1] ?? null;
  const distanceToManeuver =
    currentStep && riderCoords ? haversineMeters(riderCoords, currentStep.end) : null;

  // Remaining = distance to the current maneuver + the full length of every
  // subsequent step.
  let remainingMeters: number | null = null;
  let remainingSeconds: number | null = null;
  if (currentStep) {
    remainingMeters = distanceToManeuver ?? currentStep.distanceMeters;
    remainingSeconds = currentStep.durationSeconds;
    for (let i = stepIndex + 1; i < route.steps.length; i++) {
      remainingMeters += route.steps[i].distanceMeters;
      remainingSeconds += route.steps[i].durationSeconds;
    }
  }

  return {
    polyline: route.polyline,
    currentStep,
    nextStep,
    distanceToManeuver,
    remainingMeters,
    remainingSeconds,
    loading,
  };
}
