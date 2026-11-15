import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { TestKind } from '../../src/domain/types';
import { defaultKitProfile, TEST_ORDER } from '../../src/kit/profile';
import { photoStore } from '../../src/storage/photos';
import { Body, H1, Muted, PrimaryButton, Screen } from '../../src/ui/components';
import { visionReader } from '../../src/vision';
import { shrinkForReading } from '../../src/vision/resize';
import { canOpenCamera } from '../../src/wizard/safetyGate';
import { useWizard } from '../../src/wizard/WizardContext';

export default function Capture() {
  const router = useRouter();
  const wizard = useWizard();
  const camera = useRef<CameraView>(null);
  const [perm, requestPerm] = useCameraPermissions();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [snapError, setSnapError] = useState(false);

  const allowed = canOpenCamera(wizard.timerDone);
  useEffect(() => {
    if (!allowed) router.replace('/test/timer');
  }, [allowed]);

  const single = defaultKitProfile.captureMode === 'single-photo';
  const kinds: TestKind[] = single ? ['genotype'] : TEST_ORDER;
  const kind = kinds[index];
  const def = defaultKitProfile.tests[kind];

  if (!allowed) return null;
  if (!perm) return <Screen><Muted>Checking camera…</Muted></Screen>;
  if (!perm.granted) {
    return (
      <Screen>
        <H1>Camera needed</H1>
        <Body>Kinfolk Check NG needs the camera to photograph your kit.</Body>
        <PrimaryButton label="Allow camera" onPress={() => requestPerm()} />
        <PrimaryButton label="Skip photos, enter by hand" onPress={() => router.replace('/test/review')} />
      </Screen>
    );
  }

  async function snap() {
    if (!camera.current || busy) return;
    setBusy(true);
    setSnapError(false);
    try {
      const shot = await camera.current.takePictureAsync({ quality: 0.8 });
      const smallUri = await shrinkForReading(shot);
      const saved = await photoStore.save(smallUri);
      const targets: TestKind[] = single ? TEST_ORDER : [kind];
      for (const k of targets) {
        wizard.setPhoto(k, saved);
        wizard.setSuggestion(k, await visionReader.readWindow(saved, defaultKitProfile.tests[k]));
      }
      if (index + 1 < kinds.length) setIndex(index + 1);
      else router.replace('/test/review');
    } catch {
      setSnapError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll={false}>
      <H1>{`${single ? 'Your kit' : def.label} (${index + 1}/${kinds.length})`}</H1>
      <Muted>{def.captureHint}</Muted>
      <View style={{ height: 380, borderRadius: 16, overflow: 'hidden' }}>
        <CameraView ref={camera} style={{ flex: 1 }} facing="back" />
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: '10%', right: '10%', top: '20%', bottom: '20%', borderWidth: 3, borderColor: '#FFFFFF', borderRadius: 12 }}
        />
      </View>
      {snapError && (
        <View accessibilityRole="alert">
          <Body>Could not take the photo. Please try again, or enter results by hand.</Body>
        </View>
      )}
      <PrimaryButton label={busy ? 'Reading…' : 'Take photo'} disabled={busy} onPress={snap} />
      <PrimaryButton label="Skip photo, enter by hand" onPress={() => router.replace('/test/review')} />
    </Screen>
  );
}
