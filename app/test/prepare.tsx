import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Card, H1, PrimaryButton, Screen } from '../../src/ui/components';
import { useTheme } from '../../src/ui/theme';
import { useWizard } from '../../src/wizard/WizardContext';

const ITEMS = [
  'Wash and dry your hands.',
  'Open the kit: lancet, alcohol swab, test strip, blood group card, malaria cassette, buffer.',
  'Clean your fingertip with the swab and let it dry.',
  'Prick the side of your fingertip with the lancet.',
  'Follow the kit leaflet to apply blood to each test. Start the timer straight after.',
];

export default function Prepare() {
  const router = useRouter();
  const t = useTheme();
  const wizard = useWizard();
  // Every entry to Prepare starts a fresh test.
  useEffect(() => {
    wizard.reset();
  }, []);
  const [done, setDone] = useState<boolean[]>(ITEMS.map(() => false));
  const all = done.every(Boolean);
  return (
    <Screen>
      <H1>Prepare your kit</H1>
      {ITEMS.map((text, i) => (
        <Pressable
          key={i}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done[i] }}
          onPress={() => setDone(done.map((d, j) => (j === i ? !d : d)))}
        >
          <Card>
            <Text style={{ color: t.ink, fontSize: 17 }}>{`${done[i] ? '☑' : '☐'}  ${text}`}</Text>
          </Card>
        </Pressable>
      ))}
      <PrimaryButton label="Blood applied — start timer" disabled={!all} onPress={() => router.push('/test/timer')} />
    </Screen>
  );
}
