import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useDevMode } from '../src/dev/devMode';
import { useSettings } from '../src/i18n/settings';
import { Body, Card, Chip, H1, Muted, PrimaryButton, Screen } from '../src/ui/components';

export default function Settings() {
  const router = useRouter();
  const { lang, setLang, t } = useSettings();
  const dev = useDevMode();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <Screen>
      <H1>{t('settings')}</H1>
      <Card>
        <Body style={{ fontWeight: '700' }}>{t('language')}</Body>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="English" selected={lang === 'en'} onPress={() => setLang('en')} />
          <Chip label="Pidgin" selected={lang === 'pcm'} onPress={() => setLang('pcm')} />
        </View>
        <Muted>Medical terms stay in English. Explanations change language.</Muted>
      </Card>
      <PrimaryButton label={t('deleteAll')} onPress={() => router.push('/delete-all')} />
      <Pressable onPress={dev.registerTap}>
        <Muted>{`Kinfolk Check NG v${version}`}</Muted>
      </Pressable>
      {dev.unlocked && <Muted>Developer mode on</Muted>}
    </Screen>
  );
}
