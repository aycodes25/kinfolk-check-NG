import {
  explainGenotype,
  explainBloodGroup,
  explainMalaria,
  explainCouple,
  formatBloodGroup,
  formatGenotype,
  COUNSELLOR_NOTE,
  UNCLEAR_LABEL,
  childRiskNote,
} from '../explanations';
import type { Genotype, MalariaResult } from '../types';

const genotypes: Genotype[] = ['AA', 'AS', 'SS', 'AC', 'SC'];
const malaria: MalariaResult[] = ['negative', 'positive', 'invalid'];

test.each(genotypes)('genotype %s has en and pcm text that differ', (g) => {
  const en = explainGenotype(g, 'en');
  const pcm = explainGenotype(g, 'pcm');
  expect(en.length).toBeGreaterThan(10);
  expect(pcm.length).toBeGreaterThan(10);
  expect(pcm).not.toBe(en);
  expect(en).toContain(g);
  expect(pcm).toContain(g);
});

test.each(malaria)('malaria %s has both languages', (m) => {
  expect(explainMalaria(m, 'en')).not.toBe(explainMalaria(m, 'pcm'));
});

test('blood group text includes the group', () => {
  expect(explainBloodGroup({ abo: 'AB', rh: '-' }, 'en')).toContain('AB-');
  expect(explainBloodGroup({ abo: 'O', rh: '+' }, 'pcm')).toContain('O+');
});

test('couple text exists in both languages', () => {
  for (const level of ['clear', 'lower', 'elevated'] as const) {
    for (const rh of ['match', 'mismatch'] as const) {
      expect(explainCouple(level, rh, 'en')).not.toBe(explainCouple(level, rh, 'pcm'));
    }
  }
});

test('no text calls the result diagnosis or AI', () => {
  const all = [
    ...genotypes.map((g) => explainGenotype(g, 'en')),
    ...malaria.map((m) => explainMalaria(m, 'en')),
  ].join(' ');
  expect(all).not.toMatch(/\bAI\b|automatic/i);
});

test('COUNSELLOR_NOTE has en and pcm that differ', () => {
  expect(COUNSELLOR_NOTE.en.length).toBeGreaterThan(10);
  expect(COUNSELLOR_NOTE.pcm.length).toBeGreaterThan(10);
  expect(COUNSELLOR_NOTE.pcm).not.toBe(COUNSELLOR_NOTE.en);
});

test('the lower-risk couple text says to still confirm and is not reassuring about "no risk"', () => {
  const en = explainCouple('lower', 'match', 'en');
  expect(en).toMatch(/confirm/i);
  expect(en).not.toMatch(/no chance of a child/i);
  expect(explainCouple('lower', 'match', 'pcm')).toMatch(/confirm/i);
});

test('couple level texts are all different', () => {
  const t = (['clear', 'lower', 'elevated'] as const).map((l) => explainCouple(l, 'match', 'en'));
  expect(new Set(t).size).toBe(3);
});

describe('unclear results', () => {
  test('label is the agreed wording', () => {
    expect(UNCLEAR_LABEL.en).toBe('Unclear — retake or go to lab');
    expect(UNCLEAR_LABEL.pcm.length).toBeGreaterThan(10);
  });
  test('genotype unclear: both languages, tells the user to retake or go to a lab, no guess', () => {
    for (const l of ['en', 'pcm'] as const) {
      expect(explainGenotype('unclear', l)).toMatch(/lab/i);
      expect(explainGenotype('unclear', l)).not.toMatch(/A[ASC]|SS|SC/);
    }
    expect(explainGenotype('unclear', 'en')).not.toBe(explainGenotype('unclear', 'pcm'));
  });
  test('blood group unclear: both languages, no guess', () => {
    for (const l of ['en', 'pcm'] as const) {
      expect(explainBloodGroup('unclear', l)).toMatch(/lab/i);
    }
    expect(explainBloodGroup('unclear', 'en')).not.toBe(explainBloodGroup('unclear', 'pcm'));
  });
  test('format helpers show the unclear label, never a group', () => {
    expect(formatGenotype('unclear')).toBe('Unclear');
    expect(formatBloodGroup('unclear')).toBe('Unclear');
    expect(formatGenotype('AS')).toBe('AS');
    expect(formatBloodGroup({ abo: 'O', rh: '-' })).toBe('O-');
  });
});

describe('childRiskNote (explains the CC row)', () => {
  test('explains CC in both languages when a child could be CC', () => {
    for (const l of ['en', 'pcm'] as const) {
      expect(childRiskNote({ CC: 0.25, AC: 0.5, AA: 0.25 }, l)).toMatch(/CC/);
    }
    expect(childRiskNote({ CC: 0.25 }, 'en')).not.toBe(childRiskNote({ CC: 0.25 }, 'pcm'));
  });
  test('nothing to say when CC is not possible', () => {
    expect(childRiskNote({ AA: 0.5, AS: 0.5 }, 'en')).toBe('');
  });
});
