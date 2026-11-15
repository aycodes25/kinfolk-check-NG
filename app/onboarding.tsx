import React, { useState } from 'react';
import { View } from 'react-native';
import { useSettings } from '../src/i18n/settings';
import { Body, H1, Muted, PrimaryButton, Screen, SecondaryButton } from '../src/ui/components';
import type { StringKey } from '../src/i18n/strings';

const SLIDES: { title: StringKey; body: StringKey }[] = [
  { title: 'ob1Title', body: 'ob1Body' },
  { title: 'ob2Title', body: 'ob2Body' },
  { title: 'ob3Title', body: 'ob3Body' },
];

export default function Onboarding() {
  const { t, accept, lang, setLang } = useSettings();
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  return (
    <Screen>
      <View style={{ gap: 16, marginTop: 48 }}>
        <Muted>{`${i + 1} / ${SLIDES.length}`}</Muted>
        <H1>{t(SLIDES[i].title)}</H1>
        <Body>{t(SLIDES[i].body)}</Body>
      </View>
      <View style={{ gap: 12, marginTop: 32 }}>
        <PrimaryButton label={last ? t('accept') : t('next')} onPress={() => (last ? accept() : setI(i + 1))} />
        <SecondaryButton label={lang === 'en' ? 'Pidgin' : 'English'} onPress={() => setLang(lang === 'en' ? 'pcm' : 'en')} />
      </View>
    </Screen>
  );
}
