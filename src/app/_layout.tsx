import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Onboarding } from '@/components/onboarding';
import { SignUpFlow } from '@/components/sign-up-flow';
import { AuthContext } from '@/hooks/use-auth';

const ONBOARDING_KEY = 'famo.onboardingComplete';
const AUTH_KEY = 'famo.authComplete';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [authDone, setAuthDone] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY),
      AsyncStorage.getItem(AUTH_KEY),
    ])
      .then(([onboarding, auth]) => {
        setOnboardingDone(onboarding === 'true');
        setAuthDone(auth === 'true');
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

  const completeAuth = () => {
    setAuthDone(true);
    AsyncStorage.setItem(AUTH_KEY, 'true').catch(() => {});
  };

  const logout = () => {
    setAuthDone(false);
    AsyncStorage.removeItem(AUTH_KEY).catch(() => {});
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthContext.Provider value={{ logout }}>
        <AnimatedSplashOverlay />
        <AppTabs />
        {onboardingDone === true && authDone === false && (
          <SignUpFlow onComplete={completeAuth} />
        )}
        {onboardingDone === false && <Onboarding onDone={completeOnboarding} />}
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
