import { offspringRisk, sickleDiseaseChance, type ChildGenotype } from './genotype';
import type { BloodGroup, BloodGroupResult, Genotype, GenotypeResult } from './types';

export interface CouplePerson {
  genotype: Genotype;
  bloodGroup: BloodGroup;
}

export interface CoupleSummary {
  risk: Partial<Record<ChildGenotype, number>>;
  sickleChance: number;
  /**
   * clear    = both AA (the only pairing that may be shown green)
   * lower    = no chance of SS/SC child, but a carrier gene (S or C) is present: still confirm
   * elevated = a chance of SS/SC child
   */
  level: 'clear' | 'lower' | 'elevated';
  rh: 'match' | 'mismatch';
}

export function coupleSummary(a: CouplePerson, b: CouplePerson): CoupleSummary {
  const risk = offspringRisk(a.genotype, b.genotype);
  const sickleChance = sickleDiseaseChance(risk);
  return {
    risk,
    sickleChance,
    level: sickleChance > 0 ? 'elevated' : a.genotype === 'AA' && b.genotype === 'AA' ? 'clear' : 'lower',
    rh: a.bloodGroup.rh === b.bloodGroup.rh ? 'match' : 'mismatch',
  };
}

/** The profile that may be put in a QR or compared. Null if either result is unclear. */
export function shareableProfile(r: { genotype: GenotypeResult; bloodGroup: BloodGroupResult }): CouplePerson | null {
  if (r.genotype === 'unclear' || r.bloodGroup === 'unclear') return null;
  return { genotype: r.genotype, bloodGroup: r.bloodGroup };
}
