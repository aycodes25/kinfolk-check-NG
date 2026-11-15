import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { decodePayload } from '../../src/couple/payload';
import { Body, H1, Muted, PrimaryButton, Screen } from '../../src/ui/components';

export default function Scan() {
  const router = useRouter();
  const [perm, requestPerm] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  if (!perm) return <Screen><Muted>Checking camera…</Muted></Screen>;
  if (!perm.granted)
    return (
      <Screen>
        <H1>Camera needed</H1>
        <Body>Allow the camera to scan your partner's QR.</Body>
        <PrimaryButton label="Allow camera" onPress={() => requestPerm()} />
      </Screen>
    );

  return (
    <Screen scroll={false}>
      <H1>Scan partner's QR</H1>
      <View style={{ height: 380, borderRadius: 16, overflow: 'hidden' }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => {
            if (handled.current) return;
            if (decodePayload(data)) {
              handled.current = true;
              setError(null);
              router.replace({ pathname: '/couple/summary', params: { data } });
            } else {
              setError('That QR is not from Kinfolk Check NG.');
            }
          }}
        />
      </View>
      {error && (
        <View accessibilityRole="alert">
          <Body>{error}</Body>
        </View>
      )}
    </Screen>
  );
}
