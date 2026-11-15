import { defaultKitProfile } from '../../kit/profile';
import { createOpenCvReader } from '../opencv';

const g = defaultKitProfile.tests.genotype;
const unmeasurable = { pattern: null, confidence: 0, reason: 'unmeasurable' };

function valuesFor(rects: unknown[]): number[] {
  const values: Record<string, number> = { A: 0.8, S: 0.8, C: 0.02 };
  return rects.map((r) => {
    if (g.control && r === g.control) return 0.9;
    const band = g.bands.find((b) => b.rect === r);
    return band ? values[band.id] : 0;
  });
}

test('measures once, control first then bands in order, and maps to a pattern', async () => {
  const measure = jest.fn(async (_uri: string, rects: unknown[]) => valuesFor(rects));
  const r = await createOpenCvReader(measure as never).readWindow('file://x.jpg', g);
  expect(measure).toHaveBeenCalledTimes(1);
  const expected = [...(g.control ? [g.control] : []), ...g.bands.map((b) => b.rect)];
  expect(measure.mock.calls[0][1]).toEqual(expected);
  expect(r.pattern).toBe('AS');
});

test('measurement failure falls back to unmeasurable', async () => {
  const reader = createOpenCvReader(async () => {
    throw new Error('native module missing');
  });
  expect(await reader.readWindow('file://x.jpg', g)).toEqual(unmeasurable);
});

test('wrong-length result is unmeasurable', async () => {
  const reader = createOpenCvReader(async () => [0.5]);
  expect(await reader.readWindow('file://x.jpg', g)).toEqual(unmeasurable);
});

test('default measure without native module falls back safely', async () => {
  expect(await createOpenCvReader().readWindow('file://x.jpg', g)).toEqual(unmeasurable);
});
