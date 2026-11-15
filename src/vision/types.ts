import type { TestDefinition } from '../kit/profile';

export type ReadResult = {
  pattern: string | null;
  confidence: number;
  reason?: 'no-control' | 'low-confidence' | 'unmeasurable';
};

/** Darkness values in 0..1 (0 = white paper, 1 = fully dark line). */
export type Measurements = { control: number | null; bands: Record<string, number> };

export interface VisionReader {
  readWindow(photoUri: string, def: TestDefinition): Promise<ReadResult>;
}
