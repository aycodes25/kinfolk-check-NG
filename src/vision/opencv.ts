import type { Rect, TestDefinition } from '../kit/profile';
import { interpretMeasurements } from './interpret';
import { measureRegions } from './measure';
import type { ReadResult, VisionReader } from './types';

export type MeasureRegionsFn = (photoUri: string, rects: Rect[]) => Promise<number[]>;

export function createOpenCvReader(measure: MeasureRegionsFn = measureRegions): VisionReader {
  return {
    async readWindow(photoUri: string, def: TestDefinition): Promise<ReadResult> {
      try {
        const rects: Rect[] = [...(def.control ? [def.control] : []), ...def.bands.map((b) => b.rect)];
        const values = await measure(photoUri, rects);
        if (values.length !== rects.length) throw new Error('measurement length mismatch');
        const control = def.control ? values[0] : null;
        const offset = def.control ? 1 : 0;
        const bands: Record<string, number> = {};
        def.bands.forEach((b, i) => {
          bands[b.id] = values[offset + i];
        });
        return interpretMeasurements(def, { control, bands });
      } catch {
        return { pattern: null, confidence: 0, reason: 'unmeasurable' };
      }
    },
  };
}
