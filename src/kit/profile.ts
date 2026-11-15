import type { TestKind } from '../domain/types';

export type Rect = { x: number; y: number; w: number; h: number };

export interface TestDefinition {
  kind: TestKind;
  label: string;
  waitMinutes: number;
  captureHint: string;
  bands: { id: string; rect: Rect }[];
  control?: Rect;
  /** pattern value -> ids of bands that must show a line/agglutination */
  patterns: Record<string, string[]>;
  /** if true, a missing control line means the result is 'invalid' */
  invalidOnNoControl?: boolean;
  thresholds: { controlMin: number; lineMin: number; minConfidence: number };
}

export interface KitProfile {
  name: string;
  /**
   * Must be set true ONLY after band rects/thresholds have been tuned on real kit photos.
   * While false, assisted readings are shown as text only and never pre-selected.
   */
  tuned: boolean;
  captureMode: 'three-photo' | 'single-photo';
  tests: Record<TestKind, TestDefinition>;
}

export const TEST_ORDER: TestKind[] = ['genotype', 'bloodGroup', 'malaria'];

const box = (x: number, y: number, w = 0.12, h = 0.3): Rect => ({ x, y, w, h });

/**
 * Initial values only. Window positions and thresholds MUST be tuned against
 * photos of the real kit; until then readings are "assisted" and always confirmed.
 */
export const defaultKitProfile: KitProfile = {
  name: 'Default (untuned) kit',
  tuned: false,
  captureMode: 'three-photo',
  tests: {
    genotype: {
      kind: 'genotype',
      label: 'Genotype',
      waitMinutes: 10,
      captureHint: 'Place the genotype strip flat inside the frame in good light.',
      bands: [
        { id: 'A', rect: box(0.2, 0.35) },
        { id: 'S', rect: box(0.45, 0.35) },
        { id: 'C', rect: box(0.7, 0.35) },
      ],
      control: box(0.45, 0.05, 0.12, 0.15),
      patterns: { AA: ['A'], AS: ['A', 'S'], SS: ['S'], AC: ['A', 'C'], SC: ['S', 'C'] },
      thresholds: { controlMin: 0.25, lineMin: 0.25, minConfidence: 0.5 },
    },
    bloodGroup: {
      kind: 'bloodGroup',
      label: 'Blood group',
      waitMinutes: 10,
      captureHint: 'Place the blood group card flat so the A, B and D circles are visible.',
      bands: [
        { id: 'A', rect: box(0.15, 0.4, 0.18, 0.3) },
        { id: 'B', rect: box(0.41, 0.4, 0.18, 0.3) },
        { id: 'D', rect: box(0.67, 0.4, 0.18, 0.3) },
      ],
      patterns: {
        'A+': ['A', 'D'],
        'A-': ['A'],
        'B+': ['B', 'D'],
        'B-': ['B'],
        'AB+': ['A', 'B', 'D'],
        'AB-': ['A', 'B'],
        'O+': ['D'],
        'O-': [],
      },
      thresholds: { controlMin: 0, lineMin: 0.25, minConfidence: 0.5 },
    },
    malaria: {
      kind: 'malaria',
      label: 'Malaria',
      waitMinutes: 10,
      captureHint: 'Place the malaria cassette flat with the result window in the frame.',
      bands: [{ id: 'T', rect: box(0.5, 0.55, 0.12, 0.2) }],
      control: box(0.5, 0.2, 0.12, 0.2),
      patterns: { negative: [], positive: ['T'] },
      invalidOnNoControl: true,
      thresholds: { controlMin: 0.25, lineMin: 0.25, minConfidence: 0.5 },
    },
  },
};
