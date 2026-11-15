import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { useDevMode } from '../../src/dev/devMode';
import { useSettings } from '../../src/i18n/settings';
import { defaultKitProfile } from '../../src/kit/profile';
import { formatMmSs, secondsLeft } from '../../src/kit/timer';
import { Body, Card, H1, Muted, PrimaryButton, Screen, SecondaryButton } from '../../src/ui/components';
import { useTheme } from '../../src/ui/theme';
import { useWizard } from '../../src/wizard/WizardContext';

const WAIT_MINUTES = Math.max(...Object.values(defaultKitProfile.tests).map((t) => t.waitMinutes));

export default function Timer() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useSettings();
  const dev = useDevMode();
  const wizard = useWizard();
  const endAt = useRef(Date.now() + WAIT_MINUTES * 60_000).current;
  const [left, setLeft] = useState(WAIT_MINUTES * 60);

  useEffect(() => {
    const id = setInterval(() => setLeft(secondsLeft(endAt, Date.now())), 500);
    return () => clearInterval(id);
  }, [endAt]);

  useEffect(() => {
    if (left <= 0) wizard.setTimerDone(true);
  }, [left]);

  return (
    <Screen>
      <H1>Wait for results</H1>
      <Card style={{ alignItems: 'center' }}>
        <Text style={{ color: theme.primary, fontSize: 64, fontWeight: '800' }}>{formatMmSs(left)}</Text>
        <Body>Do not read the kit before the timer ends.</Body>
      </Card>
      <Muted>{t('timerNote')}</Muted>
      <PrimaryButton label="Photograph my kit" disabled={left > 0} onPress={() => router.replace('/test/capture')} />
      {dev.unlocked && <SecondaryButton
          label="Skip wait (developer)"
          onPress={() => {
            wizard.setTimerDone(true);
            router.replace('/test/capture');
          }}
        />}
    </Screen>
  );
}
