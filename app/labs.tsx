import React from 'react';
import { labAdvice, labGuidance } from '../src/domain/labs';
import { useSettings } from '../src/i18n/settings';
import { Body, Card, H1, Muted, Screen } from '../src/ui/components';

export default function Labs() {
  const { t } = useSettings();
  return (
    <Screen>
      <H1>{t('findLab')}</H1>
      <Muted>{labAdvice}</Muted>
      {labGuidance.map((c) => (
        <Card key={c.city}>
          <Body style={{ fontWeight: '700' }}>{c.city}</Body>
          {c.places.map((p) => (
            <Body key={p}>{`• ${p}`}</Body>
          ))}
        </Card>
      ))}
    </Screen>
  );
}
