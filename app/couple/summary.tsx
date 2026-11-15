import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { decodePayload } from '../../src/couple/payload';
import { coupleSummary, shareableProfile } from '../../src/domain/couple';
import { childRiskNote, COUNSELLOR_NOTE, explainCouple, formatBloodGroup, formatGenotype, SCREENING_NOTE } from '../../src/domain/explanations';
import type { TestRecord } from '../../src/domain/types';
import { useSettings } from '../../src/i18n/settings';
import { useSecureScreen } from '../../src/privacy/useSecureScreen';
import { listRecords } from '../../src/storage/records';
import { Banner, Body, Card, H1, Muted, PrimaryButton, Screen } from '../../src/ui/components';

export default function Summary() {
  useSecureScreen();
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();
  const { lang, t } = useSettings();
  const [mine, setMine] = useState<TestRecord | undefined | null>(null);

  useEffect(() => {
    listRecords().then((r) => setMine(r[0])).catch(() => setMine(undefined));
  }, []);

  const partner = data ? decodePayload(data) : null;
  if (mine === null) return <Screen><Muted>Loading…</Muted></Screen>;
  const mineProfile = mine ? shareableProfile(mine) : null;
  if (!mine || !partner || !mineProfile)
    return (
      <Screen>
        <Body>We could not compare. Make sure your own result is clear (not "unclear") and you scanned a valid QR.</Body>
        <PrimaryButton label="Back" onPress={() => router.replace('/couple')} />
      </Screen>
    );

  const s = coupleSummary(mineProfile, partner);
  return (
    <Screen>
      <H1>{t('checkCompat')}</H1>
      <Card>
        <Body>{`You (${new Date(mine.createdAt).toDateString()}): ${formatGenotype(mineProfile.genotype)}, ${formatBloodGroup(mineProfile.bloodGroup)}`}</Body>
        <Body>{`Partner: ${partner.genotype}, ${formatBloodGroup(partner.bloodGroup)}`}</Body>
      </Card>
      <Banner tone={s.level === 'clear' ? 'success' : s.level === 'lower' ? 'warning' : 'danger'}>
        <Body>{explainCouple(s.level, s.rh, lang)}</Body>
      </Banner>
      <Banner tone="warning">
        <Body>{`${SCREENING_NOTE[lang]} ${COUNSELLOR_NOTE[lang]}`}</Body>
      </Banner>
      <Card>
        <Body style={{ fontWeight: '700' }}>Chance for each child</Body>
        {Object.entries(s.risk).map(([g, p]) => (
          <Body key={g}>{`${g}: ${Math.round((p as number) * 100)}%`}</Body>
        ))}
        {childRiskNote(s.risk, lang) !== '' && <Muted>{childRiskNote(s.risk, lang)}</Muted>}
      </Card>
    </Screen>
  );
}
