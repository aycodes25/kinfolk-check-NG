import { defaultKitProfile, TEST_ORDER } from '../profile';

test('three separate test definitions exist', () => {
  expect(Object.keys(defaultKitProfile.tests).sort()).toEqual(['bloodGroup', 'genotype', 'malaria']);
  expect(TEST_ORDER).toEqual(['genotype', 'bloodGroup', 'malaria']);
});

test('default capture mode is three-photo', () => {
  expect(defaultKitProfile.captureMode).toBe('three-photo');
});

test('each test lists the patterns the app accepts', () => {
  expect(Object.keys(defaultKitProfile.tests.genotype.patterns).sort()).toEqual(['AA', 'AC', 'AS', 'SC', 'SS']);
  expect(Object.keys(defaultKitProfile.tests.bloodGroup.patterns)).toHaveLength(8);
  expect(Object.keys(defaultKitProfile.tests.malaria.patterns).sort()).toEqual(['negative', 'positive']);
});

test('every pattern only references defined bands', () => {
  for (const t of Object.values(defaultKitProfile.tests)) {
    const ids = t.bands.map((b) => b.id);
    for (const used of Object.values(t.patterns).flat()) expect(ids).toContain(used);
  }
});

test('wait times come from the profile (10 minutes by default)', () => {
  for (const t of Object.values(defaultKitProfile.tests)) expect(t.waitMinutes).toBe(10);
});
