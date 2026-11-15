import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useSettings } from '../src/i18n/settings';
import { photoStore } from '../src/storage/photos';
import { deleteAllData } from '../src/storage/records';
import { Banner, Body, H1, Muted, PrimaryButton, Screen, SecondaryButton } from '../src/ui/components';
import { useWizard } from '../src/wizard/WizardContext';

export default function DeleteAll() {
  const router = useRouter();
  const { t, resetSettings } = useSettings();
  const wizard = useWizard();
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'failed'>('idle');

  const statusRef = useRef(status);
  statusRef.current = status;
  const latest = useRef({ reset: wizard.reset, resetSettings });
  latest.current = { reset: wizard.reset, resetSettings };
  // Safety net: if the screen is left (e.g. hardware back) after a successful delete, drop in-memory state.
  useEffect(
    () => () => {
      if (statusRef.current === 'done') {
        latest.current.reset();
        latest.current.resetSettings();
      }
    },
    [],
  );

  async function run() {
    setStatus('working');
    try {
      const { recordsLeft, photosLeft } = await deleteAllData(photoStore);
      if (recordsLeft === 0 && photosLeft === 0) {
        setStatus('done');
      } else {
        setStatus('failed');
      }
    } catch {
      setStatus('failed');
    }
  }

  if (status === 'done')
    return (
      <Screen>
        <H1>Deleted</H1>
        <Body>All results and kit photos were removed from this phone.</Body>
        <PrimaryButton label="Back to start" onPress={() => {
            wizard.reset();
            resetSettings();
            router.replace('/onboarding');
          }} />
      </Screen>
    );

  return (
    <Screen>
      <H1>{t('areYouSure')}</H1>
      <Banner tone="danger">
        <Body>{t('deleteWarn')}</Body>
      </Banner>
      {status === 'failed' && <Muted>Something was not deleted. Please try again.</Muted>}
      <PrimaryButton label={t('yesDelete')} disabled={status === 'working'} onPress={run} />
      <SecondaryButton label={t('cancel')} onPress={() => router.back()} />
    </Screen>
  );
}
