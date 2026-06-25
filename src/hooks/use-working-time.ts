import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

// Real "Working Time" for today: the number of seconds the rider has actually
// been online (app running + online toggle on). We accumulate live while
// online and persist the running total per calendar day, so the figure is
// genuine — no fabricated values. Time does NOT accrue while the app is killed
// (the rider isn't actually working then), which is the honest behaviour.

const KEY = (day: string) => `famo.workSeconds.${day}`;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Format a seconds count as "Xh Ym". */
export function formatWorkingTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Returns today's accumulated online seconds for the rider, ticking up live
 * while `online` is true. Persists periodically (and on teardown) so the value
 * survives navigation and app restarts within the same day.
 */
export function useWorkingTime(online: boolean): number {
  const [seconds, setSeconds] = useState(0);
  const secondsRef = useRef(0);
  const dayRef = useRef(todayKey());

  // Load today's persisted total once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const day = todayKey();
      dayRef.current = day;
      const stored = await AsyncStorage.getItem(KEY(day));
      if (cancelled) return;
      secondsRef.current = stored ? Number(stored) || 0 : 0;
      setSeconds(secondsRef.current);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // While online, accumulate one second per tick. Update the displayed value
  // each minute (the label has minute resolution) to avoid re-rendering every
  // second, and persist every 15s plus on teardown.
  useEffect(() => {
    if (!online) return;
    const id = setInterval(() => {
      const day = todayKey();
      if (day !== dayRef.current) {
        // Day rolled over while online — start a fresh daily total.
        dayRef.current = day;
        secondsRef.current = 0;
      }
      secondsRef.current += 1;
      if (secondsRef.current % 60 === 0) {
        setSeconds(secondsRef.current);
      }
      if (secondsRef.current % 15 === 0) {
        AsyncStorage.setItem(KEY(dayRef.current), String(secondsRef.current)).catch(() => {});
      }
    }, 1000);
    return () => {
      clearInterval(id);
      setSeconds(secondsRef.current);
      AsyncStorage.setItem(KEY(dayRef.current), String(secondsRef.current)).catch(() => {});
    };
  }, [online]);

  return seconds;
}
