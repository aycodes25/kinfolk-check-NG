import { interpretMeasurements, MIN_CONTRAST } from '../interpret';
import { defaultKitProfile } from '../../kit/profile';

const g = defaultKitProfile.tests.genotype;
const m = defaultKitProfile.tests.malaria;
const bg = defaultKitProfile.tests.bloodGroup;

test('genotype AS: A and S bands dark, C light', () => {
  const r = interpretMeasurements(g, { control: 0.8, bands: { A: 0.8, S: 0.8, C: 0.02 } });
  expect(r.pattern).toBe('AS');
  expect(r.confidence).toBeGreaterThanOrEqual(g.thresholds.minConfidence);
});

test('genotype with missing control gives no pattern', () => {
  const r = interpretMeasurements(g, { control: 0.05, bands: { A: 0.8, S: 0.02, C: 0.02 } });
  expect(r.pattern).toBeNull();
  expect(r.reason).toBe('no-control');
});

test('ambiguous bands near the threshold have low confidence', () => {
  const r = interpretMeasurements(g, { control: 0.8, bands: { A: 0.8, S: 0.27, C: 0.02 } });
  expect(r.confidence).toBeLessThan(g.thresholds.minConfidence);
});

test('impossible genotype pattern yields null', () => {
  const r = interpretMeasurements(g, { control: 0.8, bands: { A: 0.02, S: 0.02, C: 0.02 } });
  expect(r.pattern).toBeNull();
  expect(r.reason).toBe('low-confidence');
});

test('malaria positive with a test line as dark as the control line is still read (contrast guard is for control-less tests only)', () => {
  const r = interpretMeasurements(m, { control: 0.8, bands: { T: 0.78 } });
  expect(r.pattern).toBe('positive');
});

test('malaria positive and negative', () => {
  expect(interpretMeasurements(m, { control: 0.8, bands: { T: 0.9 } }).pattern).toBe('positive');
  expect(interpretMeasurements(m, { control: 0.8, bands: { T: 0.01 } }).pattern).toBe('negative');
});

test('malaria without control is invalid', () => {
  const r = interpretMeasurements(m, { control: 0.0, bands: { T: 0.01 } });
  expect(r.pattern).toBe('invalid');
});

test('blood group A+ when A and D dark', () => {
  expect(interpretMeasurements(bg, { control: null, bands: { A: 0.9, B: 0, D: 0.9 } }).pattern).toBe('A+');
});

describe('blank / low-contrast guard', () => {
  const blank = { pattern: null, confidence: 0, reason: 'low-confidence' };
  test('all-zero blood group bands are not a confident O-', () => {
    expect(interpretMeasurements(bg, { control: null, bands: { A: 0, B: 0, D: 0 } })).toEqual(blank);
  });
  test('all-dark blood group bands read null', () => {
    expect(interpretMeasurements(bg, { control: null, bands: { A: 0.95, B: 0.95, D: 0.95 } })).toEqual(blank);
  });
  test('near-equal low-contrast bands read null', () => {
    expect(interpretMeasurements(bg, { control: null, bands: { A: 0.5, B: 0.52, D: 0.54 } })).toEqual(blank);
  });
  test('genuine O- (D light, all else equal) is not special-cased: needs contrast', () => {
    expect(MIN_CONTRAST).toBe(0.08);
  });
});
