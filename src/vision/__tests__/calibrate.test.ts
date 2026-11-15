import { defaultKitProfile } from '../../kit/profile';
import { calibrate } from '../calibrate';

const g = defaultKitProfile.tests.genotype;
const m = defaultKitProfile.tests.malaria;
const bg = defaultKitProfile.tests.bloodGroup;

const gs = (truth: string, A: number, S: number, C: number, control = 0.8) => ({
  truth,
  measurements: { control, bands: { A, S, C } },
});

describe('calibrate: lineMin', () => {
  test('puts lineMin midway between the darkest absent band and the lightest present band', () => {
    const r = calibrate(g, [gs('AS', 0.8, 0.7, 0.1), gs('AA', 0.9, 0.2, 0.1), gs('SS', 0.1, 0.8, 0.2)]);
    // absent max = 0.2, present min = 0.7
    expect(r.lineMin).toBeCloseTo(0.45, 5);
    expect(r.gap).toBeCloseTo(0.5, 5);
    expect(r.ok).toBe(true);
    expect(r.accuracy).toEqual({ correct: 3, total: 3 });
  });

  test('overlap between absent and present bands means the kit cannot be read reliably', () => {
    const r = calibrate(g, [gs('AS', 0.5, 0.4, 0.1), gs('AA', 0.9, 0.45, 0.1)]);
    expect(r.ok).toBe(false);
    expect(r.lineMin).toBeNull();
    expect(r.warnings.join(' ')).toMatch(/overlap/i);
  });

  test('a small gap is flagged as weak separation', () => {
    const r = calibrate(g, [gs('AS', 0.5, 0.45, 0.3), gs('AA', 0.5, 0.35, 0.3)]);
    expect(r.ok).toBe(false);
    expect(r.warnings.join(' ')).toMatch(/weak/i);
  });

  test('no samples is not ok and says so', () => {
    const none = calibrate(g, []);
    expect(none.ok).toBe(false);
    expect(none.warnings.join(' ')).toMatch(/no samples/i);
  });
});

describe('calibrate: control and invalid', () => {
  test('controlMin sits between failed-control (invalid) and good-control samples', () => {
    const r = calibrate(m, [
      { truth: 'positive', measurements: { control: 0.8, bands: { T: 0.7 } } },
      { truth: 'negative', measurements: { control: 0.7, bands: { T: 0.1 } } },
      { truth: 'invalid', measurements: { control: 0.05, bands: { T: 0.05 } } },
    ]);
    expect(r.controlMin).toBeCloseTo((0.7 + 0.05) / 2, 5);
    expect(r.accuracy).toEqual({ correct: 3, total: 3 });
  });

  test('without invalid examples controlMin is conservative (half the weakest good control)', () => {
    const r = calibrate(m, [
      { truth: 'positive', measurements: { control: 0.8, bands: { T: 0.7 } } },
      { truth: 'negative', measurements: { control: 0.6, bands: { T: 0.1 } } },
    ]);
    expect(r.controlMin).toBeCloseTo(0.3, 5);
    expect(r.warnings.join(' ')).toMatch(/invalid/i);
  });

  test('tests without a control line report controlMin null', () => {
    const r = calibrate(bg, [
      { truth: 'A+', measurements: { control: null, bands: { A: 0.8, B: 0.1, D: 0.8 } } },
      { truth: 'O-', measurements: { control: null, bands: { A: 0.1, B: 0.1, D: 0.1 } } },
    ]);
    expect(r.controlMin).toBeNull();
    expect(r.lineMin).toBeCloseTo(0.45, 5);
  });

  test('unknown truth labels are reported and ignored', () => {
    const r = calibrate(g, [gs('AS', 0.8, 0.7, 0.1), gs('AA', 0.9, 0.2, 0.1), gs('XX', 0.5, 0.5, 0.5)]);
    expect(r.warnings.join(' ')).toMatch(/XX/);
    expect(r.lineMin).toBeCloseTo(0.45, 5);
  });
});
