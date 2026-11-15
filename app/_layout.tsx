import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SettingsProvider, useSettings } from '../src/i18n/settings';
import { photoStore } from '../src/storage/photos';
import { purgeOrphanPhotos } from '../src/storage/records';
import { WizardProvider } from '../src/wizard/WizardContext';
import { useTheme } from '../src/ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate({ children }: { children: React.ReactNode }) {
  const { loaded, accepted } = useSettings();
  const segments = useSegments();
  const router = useRouter();
  // Cold start only: no wizard can be in progress, so unreferenced photos are safe to purge.
  useEffect(() => {
    if (loaded) purgeOrphanPhotos(photoStore).catch(() => {});
  }, [loaded]);
  useEffect(() => {
    if (!loaded) return;
    const onOnboarding = segments[0] === 'onboarding';
    if (!accepted && !onOnboarding) router.replace('/onboarding');
    if (accepted && onOnboarding) router.replace('/');
    SplashScreen.hideAsync().catch(() => {});
  }, [loaded, accepted, segments]);
  return <>{children}</>;
}

export default function RootLayout() {
  const t = useTheme();
  return (
    <SettingsProvider>
      <WizardProvider>
        <Gate>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: t.bg },
              headerTintColor: t.primary,
              headerTitleStyle: { color: t.ink },
              contentStyle: { backgroundColor: t.bg },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Kinfolk Check NG' }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="history" options={{ title: 'History' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="delete-all" options={{ title: 'Delete my data' }} />
            <Stack.Screen name="labs" options={{ title: 'Find a lab near me' }} />
            <Stack.Screen name="result/[id]" options={{ title: 'Your results' }} />
            <Stack.Screen name="couple/index" options={{ title: 'Check compatibility' }} />
            <Stack.Screen name="couple/scan" options={{ title: 'Scan QR' }} />
            <Stack.Screen name="couple/summary" options={{ title: 'Compatibility' }} />
            <Stack.Screen name="test/prepare" options={{ title: 'Prepare your kit' }} />
            <Stack.Screen name="test/timer" options={{ title: 'Wait for results' }} />
            <Stack.Screen name="test/capture" options={{ title: 'Photograph kit' }} />
            <Stack.Screen name="test/review" options={{ title: 'Confirm results' }} />
          </Stack>
        </Gate>
      </WizardProvider>
    </SettingsProvider>
  );
}
