import AsyncStorage from '@react-native-async-storage/async-storage';
import { purgeOrphanPhotos, listRecords, saveRecord, getRecord, deleteAllData, type PhotoStoreLike } from '../records';
import type { TestRecord } from '../../domain/types';

const rec = (id: string, createdAt: number): TestRecord => ({
  id,
  createdAt,
  genotype: 'AS',
  bloodGroup: { abo: 'O', rh: '+' },
  malaria: 'negative',
  photos: { genotype: `file://${id}.jpg` },
});

function fakePhotos(initial: string[]): PhotoStoreLike & { files: string[] } {
  const store = {
    files: [...initial],
    async save(uri: string) {
      store.files.push(uri);
      return uri;
    },
    async deleteAll() {
      store.files = [];
    },
    async count() {
      return store.files.length;
    },
    async listFiles() {
      return [...store.files];
    },
    async delete(path: string) {
      store.files = store.files.filter((f) => f !== path);
    },
  };
  return store;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('saves and lists newest first', async () => {
  await saveRecord(rec('a', 1));
  await saveRecord(rec('b', 2));
  expect((await listRecords()).map((r) => r.id)).toEqual(['b', 'a']);
  expect((await getRecord('a'))?.id).toBe('a');
});

test('deleteAllData removes records AND photos and verifies', async () => {
  await saveRecord(rec('a', 1));
  const photos = fakePhotos(['x.jpg', 'y.jpg']);
  const result = await deleteAllData(photos);
  expect(result).toEqual({ recordsLeft: 0, photosLeft: 0 });
  expect(await listRecords()).toEqual([]);
  expect(photos.files).toEqual([]);
});

describe('listRecords corrupt data', () => {
  test.each([['corrupt string', '{not json'], ['null', 'null'], ['object', '{}']])('%s -> []', async (_n, raw) => {
    await AsyncStorage.setItem('kc:records', raw);
    expect(await listRecords()).toEqual([]);
    expect(await AsyncStorage.getItem('kc:records')).toBe(raw);
  });
});

describe('purgeOrphanPhotos', () => {
  test('keeps referenced, deletes unreferenced', async () => {
    await saveRecord(rec('a', 1)); // references file://a.jpg
    const photos = fakePhotos(['file://a.jpg', 'file://orphan.jpg']);
    await purgeOrphanPhotos(photos);
    expect(photos.files).toEqual(['file://a.jpg']);
  });
  test('never throws on delete failure and continues', async () => {
    const photos = fakePhotos(['o1', 'o2']);
    const deleted: string[] = [];
    photos.delete = async (p: string) => {
      if (p === 'o1') throw new Error('nope');
      deleted.push(p);
    };
    await expect(purgeOrphanPhotos(photos)).resolves.toBeUndefined();
    expect(deleted).toEqual(['o2']);
  });
  test('never throws if listing fails', async () => {
    const photos = fakePhotos([]);
    photos.listFiles = async () => {
      throw new Error('x');
    };
    await expect(purgeOrphanPhotos(photos)).resolves.toBeUndefined();
  });
});

describe('deleteAllData ordering and failure handling', () => {
  afterEach(() => jest.restoreAllMocks());

  test('deletes photos BEFORE clearing AsyncStorage', async () => {
    const calls: string[] = [];
    const photos = fakePhotos(['x.jpg']);
    const origDelete = photos.deleteAll;
    photos.deleteAll = async () => {
      calls.push('photos');
      await origDelete();
    };
    jest.spyOn(AsyncStorage, 'clear').mockImplementation(async () => {
      calls.push('clear');
      await AsyncStorage.multiRemove(await AsyncStorage.getAllKeys());
    });
    await deleteAllData(photos);
    expect(calls).toEqual(['photos', 'clear']);
  });

  test('photo deletion throwing still clears AsyncStorage and rejects', async () => {
    await saveRecord(rec('a', 1));
    const photos = fakePhotos(['x.jpg']);
    photos.deleteAll = async () => {
      throw new Error('photo fail');
    };
    await expect(deleteAllData(photos)).rejects.toThrow('photo fail');
    expect(await listRecords()).toEqual([]);
  });

  test('AsyncStorage clear failing still deletes photos and rejects', async () => {
    const photos = fakePhotos(['x.jpg']);
    jest.spyOn(AsyncStorage, 'clear').mockRejectedValue(new Error('clear fail'));
    await expect(deleteAllData(photos)).rejects.toThrow('clear fail');
    expect(photos.files).toEqual([]);
  });
});
