import * as FileSystem from 'expo-file-system/legacy';
import type { Rect } from '../kit/profile';

import type { Mat as CvMat, Rect as CvRectT } from 'react-native-fast-opencv';
type FastOpencv = typeof import('react-native-fast-opencv');

// Loaded lazily so Expo Go, jest and builds without the native module never crash at startup.
function loadOpenCv(): FastOpencv {
  // Check the native side FIRST. In Expo Go / dev, merely requiring the package when its native module is
  // missing makes Metro show a red "Uncaught Error" screen even inside try/catch. Reading is optional
  // (the user can always choose the result by hand), so report "unavailable" quietly instead.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TurboModuleRegistry } = require('react-native') as typeof import('react-native');
  if (!TurboModuleRegistry.get('FastOpencv')) throw new Error('OpenCV native module unavailable');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-fast-opencv') as FastOpencv;
  } catch (e) {
    if (__DEV__) console.warn('react-native-fast-opencv failed to load', e);
    throw new Error('OpenCV native module unavailable');
  }
}

type Releasable = { release(): void } | undefined;
function safeRelease(...objs: Releasable[]): void {
  for (const o of objs) {
    try {
      o?.release();
    } catch {
      // best effort
    }
  }
}

/**
 * Mean darkness (0 = white, 1 = black) of each normalised rectangle, in order.
 * Decodes the photo ONCE: decode -> grayscale -> per rect crop -> mean -> invert.
 * Known limitation: OpenCV decode ignores EXIF orientation, so the capture flow must
 * supply upright pixels (verify on device).
 */
export async function measureRegions(photoUri: string, rects: Rect[]): Promise<number[]> {
  const { OpenCV, Mat, Rect: CvRect, ColorConversionCodes, DataTypes } = loadOpenCv();
  const base64 = await FileSystem.readAsStringAsync(photoUri, { encoding: 'base64' });
  let src: CvMat | undefined;
  let gray: CvMat | undefined;
  try {
    src = Mat.createFromBase64(base64);
    gray = Mat.create(src.rows, src.cols, DataTypes.CV_8U);
    OpenCV.cvtColor(src, gray, ColorConversionCodes.COLOR_BGR2GRAY);
    const out: number[] = [];
    for (const rect of rects) {
      let roi: CvRectT | undefined;
      let cropped: CvMat | undefined;
      let mean: { a: number; release(): void } | undefined;
      try {
        const x = Math.min(src.cols - 1, Math.max(0, Math.round(rect.x * src.cols)));
        const y = Math.min(src.rows - 1, Math.max(0, Math.round(rect.y * src.rows)));
        const w = Math.min(src.cols - x, Math.max(1, Math.round(rect.w * src.cols)));
        const h = Math.min(src.rows - y, Math.max(1, Math.round(rect.h * src.rows)));
        roi = CvRect.create(x, y, w, h);
        cropped = Mat.create(h, w, DataTypes.CV_8U);
        OpenCV.crop(gray, cropped, roi);
        mean = OpenCV.mean(cropped);
        out.push(Math.min(1, Math.max(0, 1 - mean.a / 255)));
      } finally {
        safeRelease(mean, cropped, roi);
      }
    }
    return out;
  } finally {
    safeRelease(gray, src);
  }
}
