import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, Pressable } from 'react-native';
import { formatBloodGroup, formatGenotype } from '../src/domain/explanations';
import type { TestRecord } from '../src/domain/types';
import { useSettings } from '../src/i18n/settings';
import { useSecureScreen } from '../src/privacy/useSecureScreen';
import { listRecords } from '../src/storage/records';
import { Body, Card, Muted, Screen } from '../src/ui/components';

export default function History() {
  useSecureScreen();
  const router = useRouter();
  const { t } = useSettings();
  const [items, setItems] = useState<TestRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      listRecords().then(setItems).catch(() => setItems([]));
    }, []),
  );

  return (
    <Screen>
      {items.length === 0 && <Muted>{t('noResults')}</Muted>}
      {items.map((r) => (
        <Pressable key={r.id} onPress={() => router.push(`/result/${r.id}`)}>
          <Card>
            <Muted>{new Date(r.createdAt).toDateString()}</Muted>
            <Body>{`${formatGenotype(r.genotype)} · ${formatBloodGroup(r.bloodGroup)} · malaria ${r.malaria}`}</Body>
            {r.photos.genotype && (
              <Image source={{ uri: r.photos.genotype }} style={{ height: 120, borderRadius: 8 }} resizeMode="cover" />
            )}
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
