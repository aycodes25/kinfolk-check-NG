import { createOpenCvReader } from './opencv';
import type { VisionReader } from './types';

export const visionReader: VisionReader = createOpenCvReader();
export type { ReadResult, VisionReader } from './types';
