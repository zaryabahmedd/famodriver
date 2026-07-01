import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Onboarding } from '@/components/onboarding';
import { SignUpFlow } from '@/components/sign-up-flow';
import { clearRiderSession, getRiderToken } from '@/hooks/rider-session';
import { AuthContext } from '@/hooks/use-auth';
import { OnlineStatusContext } from '@/hooks/use-online-status';

const ONBOARDING_KEY = 'famo.onboardingComplete';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [authDone, setAuthDone] = useState<boolean | null>(null);
  const [riderOnline, setRiderOnline] = useState(false);
  const [riderStarting, setRiderStarting] = useState(false);
  const [goOnlineFn, setGoOnlineFn] = useState<(() => Promise<boolean>) | null>(null);
  const [goOfflineFn, setGoOfflineFn] = useState<(() => Promise<void>) | null>(null);

  const setGoOnline = useCallback((fn: (() => Promise<boolean>) | null) => {
    setGoOnlineFn(() => fn);
  }, []);

  const setGoOffline = useCallback((fn: (() => Promise<void>) | null) => {
    setGoOfflineFn(() => fn);
  }, []);

  useEffect(() => {
    // Use the actual session token as the source of truth for auth state.
    // getRiderToken() returns null if the token is missing or expired, and
    // automatically clears the stale token from the keystore in that case.
    Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY),
      getRiderToken(),
    ])
      .then(([onboarding, token]) => {
        setOnboardingDone(onboarding === 'true');
        setAuthDone(token !== null);
      })
      .catch(() => {
        setOnboardingDone(false);
        setAuthDone(false);
      });
  }, []);

  const completeOnboarding = () => {
    setOnboardingDone(true);
    AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
  };

  // Token is already in the keystore after login — just update React state.
  const completeAuth = () => {
    setAuthDone(true);
  };

  const logout = () => {
    // Mark the rider unavailable BEFORE clearing the session — goOffline needs a
    // valid token to write rider_locations, and clearRiderSession wipes it. This
    // stops the backend from offering deliveries to a rider who has logged out.
    // Best-effort and time-boxed: a failed/slow availability write must never
    // block or stall the logout (a stale row self-heals via the dispatch
    // freshness window regardless).
    const offline = Promise.resolve(goOfflineFn?.()).catch(() => {});
    const bounded = Promise.race([offline, new Promise((r) => setTimeout(r, 3000))]);
    void bounded.finally(() => {
      setAuthDone(false);
      clearRiderSession();
    });
  };

  const renderContent = () => {
    if (onboardingDone === null || authDone === null) {
      return null;
    }

    if (!onboardingDone) {
      return <Onboarding onDone={completeOnboarding} />;
    }

    if (!authDone) {
      return <SignUpFlow onComplete={completeAuth} />;
    }

    return <AppTabs />;
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthContext.Provider value={{ logout }}>
        <OnlineStatusContext.Provider
          value={{
            online: riderOnline,
            starting: riderStarting,
            setOnline: setRiderOnline,
            setStarting: setRiderStarting,
            goOnline: goOnlineFn,
            setGoOnline,
            goOffline: goOfflineFn,
            setGoOffline,
          }}>
          {renderContent()}
          <AnimatedSplashOverlay />
        </OnlineStatusContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
