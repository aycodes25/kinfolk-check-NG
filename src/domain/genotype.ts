import type { Genotype } from './types';

export type ChildGenotype = Genotype | 'CC';

const ALLELES: Record<Genotype, [string, string]> = {
  AA: ['A', 'A'],
  AS: ['A', 'S'],
  SS: ['S', 'S'],
  AC: ['A', 'C'],
  SC: ['S', 'C'],
};

const ORDER = ['A', 'S', 'C'];

function combine(x: string, y: string): ChildGenotype {
  const [p, q] = [x, y].sort((m, n) => ORDER.indexOf(m) - ORDER.indexOf(n));
  return (p + q) as ChildGenotype;
}

export function offspringRisk(a: Genotype, b: Genotype): Partial<Record<ChildGenotype, number>> {
  const out: Partial<Record<ChildGenotype, number>> = {};
  for (const x of ALLELES[a]) {
    for (const y of ALLELES[b]) {
      const g = combine(x, y);
      out[g] = (out[g] ?? 0) + 0.25;
    }
  }
  return out;
}

/** Chance a child has sickle cell disease (SS or SC). */
export function sickleDiseaseChance(risk: Partial<Record<ChildGenotype, number>>): number {
  return (risk.SS ?? 0) + (risk.SC ?? 0);
}
