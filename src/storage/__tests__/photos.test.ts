jest.mock('expo-file-system/legacy', () => {
  const files = new Set<string>();
  const state = { files, failDeleteOf: null as string | null };
  return {
    __state: state,
    documentDirectory: 'file:///doc/',
    cacheDirectory: 'file:///cache/',
    makeDirectoryAsync: async (d: string) => {
      files.add(d);
    },
    copyAsync: async ({ from, to }: { from: string; to: string }) => {
      if (!files.has(from)) throw new Error('missing source');
      files.add(to);
    },
    deleteAsync: async (p: string) => {
      if (state.failDeleteOf === p) throw new Error('delete failed');
      [...files].filter((f) => f === p || f.startsWith(p)).forEach((f) => files.delete(f));
    },
    getInfoAsync: async (p: string) => ({ exists: files.has(p) }),
    readDirectoryAsync: async (d: string) =>
      [...files].filter((f) => f !== d && f.startsWith(d)).map((f) => f.slice(d.length)),
  };
});

import * as FS from 'expo-file-system/legacy';
import { photoStore } from '../photos';

const state = (FS as unknown as { __state: { files: Set<string>; failDeleteOf: string | null } }).__state;
const DIR = 'file:///doc/kc-photos/';
const CAM = 'file:///cache/Camera/';

beforeEach(() => {
  state.files.clear();
  state.failDeleteOf = null;
});

test('save copies into kc-photos and deletes the original', async () => {
  const src = CAM + 'orig.jpg';
  state.files.add(src);
  const dest = await photoStore.save(src);
  expect(dest.startsWith(DIR)).toBe(true);
  expect(state.files.has(dest)).toBe(true);
  expect(state.files.has(src)).toBe(false);
});

test('save still returns the new path if deleting the original throws', async () => {
  const src = CAM + 'orig.jpg';
  state.files.add(src);
  state.failDeleteOf = src;
  const dest = await photoStore.save(src);
  expect(state.files.has(dest)).toBe(true);
});

test('deleteAll deletes kc-photos and the cache Camera folder', async () => {
  state.files.add(DIR);
  state.files.add(DIR + 'a.jpg');
  state.files.add(CAM);
  state.files.add(CAM + 'b.jpg');
  await photoStore.deleteAll();
  expect([...state.files]).toEqual([]);
});

test('count is 0 when both dirs are missing', async () => {
  expect(await photoStore.count()).toBe(0);
});

test('count includes files in kc-photos and the cache Camera folder', async () => {
  state.files.add(DIR);
  state.files.add(DIR + 'a.jpg');
  state.files.add(CAM);
  state.files.add(CAM + 'b.jpg');
  state.files.add(CAM + 'c.jpg');
  expect(await photoStore.count()).toBe(3);
});

test('listFiles returns full kc-photos paths; delete removes one', async () => {
  state.files.add(DIR);
  state.files.add(DIR + 'a.jpg');
  expect(await photoStore.listFiles()).toEqual([DIR + 'a.jpg']);
  await photoStore.delete(DIR + 'a.jpg');
  expect(await photoStore.listFiles()).toEqual([]);
});
