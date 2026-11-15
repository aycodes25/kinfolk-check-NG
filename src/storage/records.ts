import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TestRecord } from '../domain/types';

const KEY = 'kc:records';

export interface PhotoStoreLike {
  save(uri: string): Promise<string>;
  deleteAll(): Promise<void>;
  count(): Promise<number>;
  listFiles(): Promise<string[]>;
  delete(path: string): Promise<void>;
}

export async function listRecords(): Promise<TestRecord[]> {
  const raw = await AsyncStorage.getItem(KEY);
  let all: TestRecord[] = [];
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) all = parsed as TestRecord[];
  } catch {
    // corrupt data: treat as empty, never delete
  }
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveRecord(r: TestRecord): Promise<void> {
  const all = await listRecords();
  await AsyncStorage.setItem(KEY, JSON.stringify([...all.filter((x) => x.id !== r.id), r]));
}

export async function getRecord(id: string): Promise<TestRecord | undefined> {
  return (await listRecords()).find((r) => r.id === id);
}

/**
 * Deletes every photo, then every record/setting, then verifies nothing remains.
 * Photos go first so a failure never leaves orphan photos no record references.
 * Both steps are always attempted; the first error is rethrown afterwards.
 */
export async function deleteAllData(
  photos: PhotoStoreLike,
): Promise<{ recordsLeft: number; photosLeft: number }> {
  let firstError: unknown;
  let failed = false;
  const attempt = async (step: () => Promise<void>) => {
    try {
      await step();
    } catch (e) {
      if (!failed) {
        failed = true;
        firstError = e;
      }
    }
  };
  await attempt(() => photos.deleteAll());
  await attempt(() => AsyncStorage.clear());
  if (failed) throw firstError;
  return { recordsLeft: (await listRecords()).length, photosLeft: await photos.count() };
}

/** Deletes kc-photos files that no saved record references. Best effort: never throws. */
export async function purgeOrphanPhotos(photos: PhotoStoreLike): Promise<void> {
  try {
    const referenced = new Set<string>();
    for (const r of await listRecords()) {
      for (const p of Object.values(r.photos ?? {})) if (p) referenced.add(p);
    }
    for (const f of await photos.listFiles()) {
      if (referenced.has(f)) continue;
      try {
        await photos.delete(f);
      } catch {
        // keep going
      }
    }
  } catch {
    // best effort
  }
}
