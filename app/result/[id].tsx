import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { explainBloodGroup, explainGenotype, explainMalaria, formatBloodGroup, formatGenotype, SCREENING_NOTE } from '../../src/domain/explanations';
import { needsLabConfirmation } from '../../src/domain/safety';
import type { TestRecord } from '../../src/domain/types';
import { useSettings } from '../../src/i18n/settings';
import { useSecureScreen } from '../../src/privacy/useSecureScreen';
import { getRecord } from '../../src/storage/records';
import { Banner, Body, Card, H1, Muted, PrimaryButton, Screen, SecondaryButton } from '../../src/ui/components';

export default function Result() {
  const raw = useLocalSearchParams<{ id: string | string[] }>().id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  useSecureScreen();
  const router = useRouter();
  const { lang, setLang, t } = useSettings();
  const [rec, setRec] = useState<TestRecord | undefined | null>(null);

  useEffect(() => {
    getRecord(id)
      .then(setRec)
      .catch(() => setRec(undefined));
  }, [id]);

  if (rec === null) return <Screen><Muted>Loading…</Muted></Screen>;
  if (!rec) return <Screen><Body>Result not found.</Body></Screen>;

  const serious = needsLabConfirmation(rec);
  return (
    <Screen>
      <H1>Your results</H1>
      <Muted>{t('assisted')}</Muted>
      <Banner tone="warning">
        <Body>{SCREENING_NOTE[lang]}</Body>
      </Banner>
      {serious && (
        <Banner tone="danger">
          <Body style={{ fontWeight: '700' }}>{t('seeDoctor')}</Body>
          <PrimaryButton label={t('findLab')} onPress={() => router.push('/labs')} />
        </Banner>
      )}
      <Card>
        <Body style={{ fontWeight: '700' }}>{`Genotype: ${formatGenotype(rec.genotype)}`}</Body>
        <Body>{explainGenotype(rec.genotype, lang)}</Body>
      </Card>
      <Card>
        <Body style={{ fontWeight: '700' }}>{`Blood group: ${formatBloodGroup(rec.bloodGroup)}`}</Body>
        <Body>{explainBloodGroup(rec.bloodGroup, lang)}</Body>
      </Card>
      <Card>
        <Body style={{ fontWeight: '700' }}>{`Malaria: ${rec.malaria}`}</Body>
        <Body>{explainMalaria(rec.malaria, lang)}</Body>
      </Card>
      <SecondaryButton label={lang === 'en' ? 'Read in Pidgin' : 'Read in English'} onPress={() => setLang(lang === 'en' ? 'pcm' : 'en')} />
      <PrimaryButton label={t('checkCompat')} onPress={() => router.push('/couple')} />
    </Screen>
  );
}
