import { encodePayload, decodePayload } from '../payload';

const person = { genotype: 'AS', bloodGroup: { abo: 'O', rh: '+' } } as const;

test('round trip', () => {
  expect(decodePayload(encodePayload(person))).toEqual(person);
});

test('payload contains only version, genotype, blood group and Rh', () => {
  const obj = JSON.parse(encodePayload(person));
  expect(Object.keys(obj).sort()).toEqual(['b', 'g', 'r', 'v']);
});

test('rejects extra fields (e.g. a name)', () => {
  expect(decodePayload(JSON.stringify({ v: 1, g: 'AS', b: 'O', r: '+', name: 'Ada' }))).toBeNull();
});

test('rejects bad values and bad versions and garbage', () => {
  expect(decodePayload(JSON.stringify({ v: 2, g: 'AS', b: 'O', r: '+' }))).toBeNull();
  expect(decodePayload(JSON.stringify({ v: 1, g: 'ZZ', b: 'O', r: '+' }))).toBeNull();
  expect(decodePayload(JSON.stringify({ v: 1, g: 'AS', b: 'X', r: '+' }))).toBeNull();
  expect(decodePayload('not json')).toBeNull();
});
