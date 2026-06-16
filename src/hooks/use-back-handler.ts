import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * Registers an Android hardware back-button handler that is active only while
 * the hosting screen is focused. Because every tab screen stays mounted, the
 * focus gate ensures only the visible tab reacts to a back press.
 *
 * `handler` returns `true` when it has handled the press (event consumed), or
 * `false` to let lower handlers / the system default run. The latest closure is
 * always invoked, so the handler can read current state without re-subscribing
 * on every render.
 */
export function useBackHandler(handler: () => boolean) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () =>
        handlerRef.current(),
      );
      return () => subscription.remove();
    }, []),
  );
}
