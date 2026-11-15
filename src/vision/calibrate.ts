import type { TestDefinition } from '../kit/profile';
import { interpretMeasurements } from './interpret';
import type { Measurements } from './types';

/** One real photo, measured, with the true result a human knows for that kit. */
export type LabelledSample = { truth: string; measurements: Measurements };

export type Calibration = {
  lineMin: number | null;
  controlMin: number | null;
  /** lightest present line minus darkest absent line; bigger is safer */
  gap: number;
  /** true only if thresholds were found, separation is not weak, and every sample reads back correctly */
  ok: boolean;
  warnings: string[];
  accuracy: { correct: number; total: number };
};

/** Below this gap lines and background are too close to trust a threshold. */
export const MIN_GAP = 0.15;

/**
 * Derives thresholds from labelled measurements. Never edits the kit profile itself: a person reads the
 * warnings, then updates the profile and sets `tuned: true`.
 */
export function calibrate(def: TestDefinition, samples: LabelledSample[]): Calibration {
  const warnings: string[] = [];
  const present: number[] = [];
  const absent: number[] = [];
  const goodControl: number[] = [];
  const badControl: number[] = [];

  if (samples.length === 0) warnings.push('No samples: need at least one labelled photo.');

  for (const s of samples) {
    const isInvalid = s.truth === 'invalid';
    const ids = def.patterns[s.truth];
    if (def.control && s.measurements.control !== null) {
      (isInvalid ? badControl : goodControl).push(s.measurements.control);
    }
    if (!ids) {
      if (!isInvalid) warnings.push(`Unknown truth "${s.truth}" ignored for line statistics.`);
      continue;
    }
    for (const b of def.bands) {
      const v = s.measurements.bands[b.id];
      if (v === undefined) continue;
      (ids.includes(b.id) ? present : absent).push(v);
    }
  }

  let lineMin: number | null = null;
  let gap = 0;
  if (present.length === 0 || absent.length === 0) {
    warnings.push('Need examples with lines present AND absent to set the line threshold.');
  } else {
    const maxAbsent = Math.max(...absent);
    const minPresent = Math.min(...present);
    gap = minPresent - maxAbsent;
    if (gap <= 0) {
      warnings.push(
        `Present and absent lines overlap (darkest absent ${maxAbsent.toFixed(2)} >= lightest present ${minPresent.toFixed(2)}): this kit cannot be read reliably from these photos.`,
      );
    } else {
      lineMin = (maxAbsent + minPresent) / 2;
      if (gap < MIN_GAP) {
        warnings.push(`Weak separation: gap ${gap.toFixed(2)} is below ${MIN_GAP}. Take better photos or do not auto-read this test.`);
      }
    }
  }

  let controlMin: number | null = null;
  if (def.control) {
    if (goodControl.length > 0 && badControl.length > 0) {
      const lo = Math.max(...badControl);
      const hi = Math.min(...goodControl);
      if (lo < hi) controlMin = (lo + hi) / 2;
      else warnings.push('Failed-control (invalid) and good-control photos overlap: cannot set controlMin.');
    } else if (goodControl.length > 0) {
      controlMin = Math.min(...goodControl) / 2;
      warnings.push('No invalid examples: controlMin is a conservative guess. Add a photo of a kit with no control line.');
    } else {
      warnings.push('No control-line measurements: cannot set controlMin.');
    }
  }

  const candidate: TestDefinition = {
    ...def,
    thresholds: {
      ...def.thresholds,
      lineMin: lineMin ?? def.thresholds.lineMin,
      controlMin: controlMin ?? def.thresholds.controlMin,
    },
  };
  let correct = 0;
  for (const s of samples) {
    const r = interpretMeasurements(candidate, s.measurements);
    if (r.pattern === s.truth && r.confidence >= candidate.thresholds.minConfidence) correct++;
  }
  const accuracy = { correct, total: samples.length };
  if (correct !== samples.length && lineMin !== null) {
    warnings.push(`Only ${correct}/${samples.length} samples read back correctly with confidence.`);
  }
  const ok =
    samples.length > 0 &&
    lineMin !== null &&
    gap >= MIN_GAP &&
    correct === samples.length &&
    (!def.control || controlMin !== null);

  return { lineMin, controlMin, gap, ok, warnings, accuracy };
}
