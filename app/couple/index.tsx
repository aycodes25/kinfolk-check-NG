import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { encodePayload } from '../../src/couple/payload';
import { shareableProfile } from '../../src/domain/couple';
import type { TestRecord } from '../../src/domain/types';
import { useSettings } from '../../src/i18n/settings';
import { useSecureScreen } from '../../src/privacy/useSecureScreen';
import { listRecords } from '../../src/storage/records';
import { Body, Card, H1, Muted, PrimaryButton, Screen } from '../../src/ui/components';

export default function CoupleHome() {
  useSecureScreen();
  const router = useRouter();
  const { t } = useSettings();
  const [rec, setRec] = useState<TestRecord | undefined | null>(null);

  useEffect(() => {
    listRecords().then((r) => setRec(r[0])).catch(() => setRec(undefined));
  }, []);

  if (rec === null) return <Screen><Muted>Loading…</Muted></Screen>;
  if (!rec)
    return (
      <Screen>
        <H1>{t('checkCompat')}</H1>
        <Body>Complete your own test first, then you can share your QR with your partner.</Body>
        <PrimaryButton label={t('startTest')} onPress={() => router.push('/test/prepare')} />
      </Screen>
    );

  const profile = shareableProfile(rec);
  if (!profile)
    return (
      <Screen>
        <H1>{t('checkCompat')}</H1>
        <Body>Your latest result is unclear, so no QR code is made. Retake the test, or go to a lab, then try again.</Body>
        <PrimaryButton label={t('startTest')} onPress={() => router.push('/test/prepare')} />
      </Screen>
    );
  const value = encodePayload(profile);
  return (
    <Screen>
      <H1>{t('checkCompat')}</H1>
      <Muted>Your QR shares only your genotype and blood group. No name, phone or photo.</Muted>
      <Muted>{t('qrTrustNote')}</Muted>
      <Card style={{ alignItems: 'center' }}>
        <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12 }}>
          <QRCode value={value} size={220} />
        </View>
      </Card>
      <PrimaryButton label="Scan my partner's QR" onPress={() => router.push('/couple/scan')} />
    </Screen>
  );
}
