import { needsLabConfirmation } from '../safety';

const r = (genotype: any, malaria: any) => ({ genotype, malaria });

test.each([
  ['SS', 'negative'],
  ['SC', 'negative'],
  ['AA', 'positive'],
  ['AA', 'invalid'],
])('%s / %s needs lab confirmation', (g, m) => {
  expect(needsLabConfirmation(r(g, m))).toBe(true);
});

test.each([
  ['AA', 'negative'],
  ['AS', 'negative'],
  ['AC', 'negative'],
])('%s / %s does not', (g, m) => {
  expect(needsLabConfirmation(r(g, m))).toBe(false);
});

test('unclear genotype or blood group needs lab confirmation', () => {
  expect(needsLabConfirmation({ genotype: 'unclear', bloodGroup: { abo: 'A', rh: '+' }, malaria: 'negative' })).toBe(true);
  expect(needsLabConfirmation({ genotype: 'AA', bloodGroup: 'unclear', malaria: 'negative' })).toBe(true);
});

test('clear genotype and blood group keep existing behaviour', () => {
  expect(needsLabConfirmation({ genotype: 'AA', bloodGroup: { abo: 'O', rh: '+' }, malaria: 'negative' })).toBe(false);
});
