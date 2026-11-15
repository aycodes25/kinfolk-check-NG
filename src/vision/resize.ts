/** Photos are shrunk to at most this many pixels wide before OpenCV reads (and before they are stored). */
export const MAX_PHOTO_WIDTH = 1200;

/** Target width if the photo is wider than the cap, otherwise null (never enlarge). */
export function fitWidth(width: number): number | null {
  if (!Number.isFinite(width) || width <= MAX_PHOTO_WIDTH) return null;
  return MAX_PHOTO_WIDTH;
}

export interface ShrinkDeps {
  manipulate(uri: string, width: number): Promise<{ uri: string }>;
  remove(uri: string): Promise<void>;
}

// Loaded lazily so jest and builds without the native module never crash at startup.
const defaultDeps: ShrinkDeps = {
  async manipulate(uri, width) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const M = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
    return M.manipulateAsync(uri, [{ resize: { width } }], { compress: 0.85, format: M.SaveFormat.JPEG });
  },
  async remove(uri) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const FS = require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
    await FS.deleteAsync(uri, { idempotent: true });
  },
};

/**
 * Returns the uri of a photo no wider than MAX_PHOTO_WIDTH. The big original is deleted (best effort)
 * once the shrunk copy exists; if shrinking fails the error propagates and the original is kept.
 */
export async function shrinkForReading(
  shot: { uri: string; width: number },
  deps: ShrinkDeps = defaultDeps,
): Promise<string> {
  const target = fitWidth(shot.width);
  if (target === null) return shot.uri;
  const small = await deps.manipulate(shot.uri, target);
  try {
    await deps.remove(shot.uri);
  } catch {
    // best effort: orphan purge at startup / delete-all also clear the camera cache
  }
  return small.uri;
}
