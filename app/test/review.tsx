import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { UNCLEAR_LABEL } from '../../src/domain/explanations';
import { needsLabConfirmation } from '../../src/domain/safety';
import type { ABO, BloodGroupResult, GenotypeResult, MalariaResult, TestRecord } from '../../src/domain/types';
import { useSettings } from '../../src/i18n/settings';
import { defaultKitProfile, TEST_ORDER } from '../../src/kit/profile';
import { saveRecord } from '../../src/storage/records';
import { Banner, Body, Card, Chip, H1, Muted, PrimaryButton, Screen } from '../../src/ui/components';
import { useTheme } from '../../src/ui/theme';
import { useWizard } from '../../src/wizard/WizardContext';
import {
  ackKeyFor,
  AckState,
  canOpenCamera,
  canSave,
  createSingleFlight,
  emptyAck,
  isAcknowledged,
  resetAck,
  shouldPreselect,
  setAcknowledged,
} from '../../src/wizard/safetyGate';

function parseBloodGroup(v: string): BloodGroupResult {
  if (v === 'unclear') return 'unclear';
  return { abo: v.slice(0, -1) as ABO, rh: v.slice(-1) as '+' | '-' };
}

export default function Review() {
  const router = useRouter();
  const theme = useTheme();
  const { t, lang } = useSettings();
  const w = useWizard();
  const [ack, setAck] = useState<AckState>(emptyAck);
  const [saving, setSaving] = useState(false); // UI only; the real guard is `once`
  const [saveError, setSaveError] = useState(false);
  const savedRef = useRef(false);
  const once = useRef(createSingleFlight()).current;

  const allowed = canOpenCamera(w.timerDone);
  useEffect(() => {
    // After a successful save the wizard is reset (timerDone false); don't bounce to the timer then.
    if (!allowed && !savedRef.current) router.replace('/test/timer');
  }, [allowed]);

  // Pre-select the suggestion only for a tuned kit profile and confident readings. The user still confirms.
  useEffect(() => {
    for (const k of TEST_ORDER) {
      const s = w.suggestions[k];
      const min = defaultKitProfile.tests[k].thresholds.minConfidence;
      if (s?.pattern && shouldPreselect(defaultKitProfile.tuned, s.confidence, min) && !w.confirmed[k]) {
        w.setConfirmed(k, s.pattern);
      }
    }
  }, []);

  const complete = TEST_ORDER.every((k) => !!w.confirmed[k]);
  const draft =
    complete
      ? {
          genotype: w.confirmed.genotype as GenotypeResult,
          bloodGroup: parseBloodGroup(w.confirmed.bloodGroup as string),
          malaria: w.confirmed.malaria as MalariaResult,
        }
      : null;
  const serious = draft ? needsLabConfirmation(draft) : false;
  const key = ackKeyFor(w.confirmed);
  const acknowledged = isAcknowledged(ack, key, serious);

  // Changing any result drops the stored acknowledgement, so it can never come back ticked.
  function choose(k: (typeof TEST_ORDER)[number], v: string) {
    const next = { ...w.confirmed, [k]: v };
    setAck((prev) => resetAck(prev, ackKeyFor(next)));
    w.setConfirmed(k, v);
  }

  async function save() {
    if (!canSave({ complete, serious, acknowledged, saving })) return;
    await once(async () => {
      setSaving(true);
      setSaveError(false);
      const record: TestRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        genotype: w.confirmed.genotype as GenotypeResult,
        bloodGroup: parseBloodGroup(w.confirmed.bloodGroup as string),
        malaria: w.confirmed.malaria as MalariaResult,
        photos: w.photos,
      };
      try {
        await saveRecord(record);
      } catch {
        setSaving(false);
        setSaveError(true);
        return;
      }
      savedRef.current = true;
      w.reset();
      router.dismissAll();
      router.push(`/result/${record.id}`);
    });
  }

  if (!allowed) return null;

  return (
    <Screen>
      <H1>Confirm your results</H1>
      <Muted>{t('assistedNote')}</Muted>
      {TEST_ORDER.map((k) => {
        const def = defaultKitProfile.tests[k];
        const s = w.suggestions[k];
        const suggested = s?.pattern && s.confidence >= def.thresholds.minConfidence ? s.pattern : null;
        // Genotype and blood group may always be left "unclear": the app never forces a guess.
        const options =
          k === 'malaria' ? ['negative', 'positive', 'invalid'] : [...Object.keys(def.patterns), 'unclear'];
        return (
          <Card key={k}>
            <Body style={{ fontWeight: '700' }}>{def.label}</Body>
            {suggested ? (
              defaultKitProfile.tuned ? (
                <Muted>{`${t('assisted')}: ${suggested} — please check it matches your kit.`}</Muted>
              ) : (
                <Muted>{`Assisted reading suggests: ${suggested} — tap to choose it`}</Muted>
              )
            ) : (
              <Muted>Could not read this clearly. Choose what you see on your kit, or choose Unclear.</Muted>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {options.map((o) => (
                <Chip key={o} label={o === 'unclear' ? UNCLEAR_LABEL[lang] : o} selected={w.confirmed[k] === o} onPress={() => choose(k, o)} />
              ))}
            </View>
          </Card>
        );
      })}

      {serious && (
        <Banner tone="danger">
          <Body style={{ fontWeight: '700' }}>{t('seeDoctor')}</Body>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acknowledged }} onPress={() => setAck(setAcknowledged(key, !acknowledged))}>
            <Text style={{ color: theme.ink, fontSize: 16 }}>{`${acknowledged ? '☑' : '☐'}  ${t('ackLab')}`}</Text>
          </Pressable>
        </Banner>
      )}

      {saveError && <Body>Could not save. Please try again.</Body>}
      <PrimaryButton
        label={saving ? 'Saving...' : 'Confirm and save'}
        disabled={!canSave({ complete, serious, acknowledged, saving })}
        onPress={save}
      />
    </Screen>
  );
}
