import { coupleSummary, shareableProfile } from '../couple';

const p = (g: any, abo: any, rh: any) => ({ genotype: g, bloodGroup: { abo, rh } });

test('AS + AS is elevated', () => {
  const s = coupleSummary(p('AS', 'O', '+'), p('AS', 'A', '+'));
  expect(s.level).toBe('elevated');
  expect(s.sickleChance).toBe(0.25);
  expect(s.rh).toBe('match');
});

test('only AA + AA is clear (the only pairing that may be shown green)', () => {
  expect(coupleSummary(p('AA', 'O', '+'), p('AA', 'O', '+')).level).toBe('clear');
});

test.each([
  ['AA', 'AS'],
  ['AA', 'AC'],
  ['AS', 'AA'],
  ['AC', 'AC'],
  ['AC', 'AA'],
])('%s + %s has no sickle chance but is NOT clear: lower', (a, b) => {
  const s = coupleSummary(p(a, 'O', '+'), p(b, 'O', '+'));
  expect(s.sickleChance).toBe(0);
  expect(s.level).toBe('lower');
});

test.each([
  ['AS', 'AS'],
  ['AS', 'SS'],
  ['AS', 'AC'],
  ['SS', 'AS'],
])('%s + %s is elevated', (a, b) => {
  expect(coupleSummary(p(a, 'O', '+'), p(b, 'O', '+')).level).toBe('elevated');
});

describe('shareableProfile (what may go into a QR / comparison)', () => {
  test('returns the profile when both results are clear', () => {
    expect(shareableProfile({ genotype: 'AS', bloodGroup: { abo: 'A', rh: '+' } })).toEqual(p('AS', 'A', '+'));
  });
  test('unclear genotype is never shareable', () => {
    expect(shareableProfile({ genotype: 'unclear', bloodGroup: { abo: 'A', rh: '+' } })).toBeNull();
  });
  test('unclear blood group is never shareable', () => {
    expect(shareableProfile({ genotype: 'AA', bloodGroup: 'unclear' })).toBeNull();
  });
});

test('Rh mismatch is flagged', () => {
  expect(coupleSummary(p('AA', 'O', '-'), p('AA', 'O', '+')).rh).toBe('mismatch');
});
