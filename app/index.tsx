import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { formatBloodGroup, formatGenotype } from '../src/domain/explanations';
import type { TestRecord } from '../src/domain/types';
import { useSettings } from '../src/i18n/settings';
import { useSecureScreen } from '../src/privacy/useSecureScreen';
import { listRecords } from '../src/storage/records';
import { Body, Card, H1, Muted, PrimaryButton, Screen, SecondaryButton } from '../src/ui/components';
import { useWizard } from '../src/wizard/WizardContext';

export default function Home() {
  useSecureScreen();
  const router = useRouter();
  const { t } = useSettings();
  const wizard = useWizard();
  const [latest, setLatest] = useState<TestRecord | undefined>();

  useFocusEffect(
    useCallback(() => {
      listRecords()
        .then((r) => setLatest(r[0]))
        .catch(() => setLatest(undefined));
    }, []),
  );

  return (
    <Screen>
      <H1>{t('appName')}</H1>
      <PrimaryButton
        label={t('startTest')}
        onPress={() => {
          wizard.reset();
          router.push('/test/prepare');
        }}
      />
      {latest ? (
        <Card>
          <Muted>{new Date(latest.createdAt).toDateString()}</Muted>
          <Body>{`Genotype: ${formatGenotype(latest.genotype)}`}</Body>
          <Body>{`Blood group: ${formatBloodGroup(latest.bloodGroup)}`}</Body>
          <Body>{`Malaria: ${latest.malaria}`}</Body>
          <SecondaryButton label="View" onPress={() => router.push(`/result/${latest.id}`)} />
        </Card>
      ) : (
        <Card>
          <Muted>{t('noResults')}</Muted>
        </Card>
      )}
      <View style={{ gap: 12 }}>
        <SecondaryButton label={t('checkCompat')} onPress={() => router.push('/couple')} />
        <SecondaryButton label={t('history')} onPress={() => router.push('/history')} />
        <SecondaryButton label={t('settings')} onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}
