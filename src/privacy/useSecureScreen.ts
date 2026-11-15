import { usePreventScreenCapture } from 'expo-screen-capture';

/**
 * Blocks screenshots and screen recording while the calling screen is mounted
 * (Android: FLAG_SECURE, so captures and the recent-apps card are black).
 * Use on every screen that shows a genotype, blood group, QR code or kit photo.
 */
export function useSecureScreen(): void {
  usePreventScreenCapture('kinfolk-secure');
}
