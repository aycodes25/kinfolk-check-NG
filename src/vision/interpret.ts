import type { TestDefinition } from '../kit/profile';
import type { Measurements, ReadResult } from './types';

/** Minimum max-min spread across all measured regions; below this the photo is blank/uniform/unreadable. */
export const MIN_CONTRAST = 0.08;
/** Margin (distance from lineMin) that maps to full confidence. */
const MARGIN_FULL_CONFIDENCE = 0.2;
/** Confidence reported for an 'invalid' (no control line) result. */
const INVALID_CONFIDENCE = 0.9;

export function interpretMeasurements(def: TestDefinition, m: Measurements): ReadResult {
  const { controlMin, lineMin, minConfidence } = def.thresholds;

  if (def.control && (m.control ?? 0) < controlMin) {
    return def.invalidOnNoControl
      ? { pattern: 'invalid', confidence: INVALID_CONFIDENCE, reason: 'no-control' }
      : { pattern: null, confidence: 0, reason: 'no-control' };
  }

  const measured = def.bands.map((b) => m.bands[b.id] ?? 0);
  if (def.control) measured.push(m.control ?? 0);
  // Only for tests WITHOUT a control line (e.g. blood group): there a blank or uniformly dark photo is
  // otherwise indistinguishable from a real pattern. With a control line, control + test lines are
  // legitimately similar in darkness (e.g. a positive malaria cassette), so spread must not be used.
  if (!def.control && measured.length >= 2 && Math.max(...measured) - Math.min(...measured) < MIN_CONTRAST) {
    return { pattern: null, confidence: 0, reason: 'low-confidence' };
  }

  const present = def.bands.filter((b) => (m.bands[b.id] ?? 0) >= lineMin).map((b) => b.id);
  const key = [...present].sort().join(',');

  const match = Object.entries(def.patterns).find(
    ([, ids]) => [...ids].sort().join(',') === key,
  );
  if (!match) return { pattern: null, confidence: 0, reason: 'low-confidence' };

  const margin = Math.min(
    ...def.bands.map((b) => Math.abs((m.bands[b.id] ?? 0) - lineMin)),
    1,
  );
  const confidence = Math.min(1, margin / MARGIN_FULL_CONFIDENCE);
  if (confidence < minConfidence) {
    return { pattern: match[0], confidence, reason: 'low-confidence' };
  }
  return { pattern: match[0], confidence };
}
