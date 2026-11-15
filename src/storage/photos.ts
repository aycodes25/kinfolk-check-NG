import * as FS from 'expo-file-system/legacy';
import type { PhotoStoreLike } from './records';

const DIR = (FS.documentDirectory ?? '') + 'kc-photos/';

const CAMERA_DIR = `${FS.cacheDirectory ?? ''}Camera/`;

export type PhotoStore = PhotoStoreLike;

export const photoStore: PhotoStore = {
  async save(uri) {
    await FS.makeDirectoryAsync(DIR, { intermediates: true });
    const dest = `${DIR}${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    await FS.copyAsync({ from: uri, to: dest });
    try {
      await FS.deleteAsync(uri, { idempotent: true });
    } catch {
      // copy succeeded; leftover original is best-effort
    }
    return dest;
  },
  async deleteAll() {
    await FS.deleteAsync(DIR, { idempotent: true });
    await FS.deleteAsync(CAMERA_DIR, { idempotent: true });
  },
  async count() {
    let n = 0;
    for (const d of [DIR, CAMERA_DIR]) {
      const info = await FS.getInfoAsync(d);
      if (info.exists) n += (await FS.readDirectoryAsync(d)).length;
    }
    return n;
  },
  async listFiles() {
    const info = await FS.getInfoAsync(DIR);
    if (!info.exists) return [];
    return (await FS.readDirectoryAsync(DIR)).map((f) => DIR + f);
  },
  async delete(path) {
    await FS.deleteAsync(path, { idempotent: true });
  },
};
