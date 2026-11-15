import type { VisionReader } from './types';

/** Always defers to manual selection. Used until the OpenCV reader is wired in. */
export const stubReader: VisionReader = {
  async readWindow() {
    return { pattern: null, confidence: 0, reason: 'unmeasurable' };
  },
};
