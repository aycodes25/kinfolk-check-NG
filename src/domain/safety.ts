import type { BloodGroupResult, GenotypeResult, MalariaResult } from './types';

/** SS, SC, positive/invalid malaria, and any unclear genotype/blood group must be confirmed at a lab. */
export function needsLabConfirmation(r: {
  genotype: GenotypeResult;
  bloodGroup?: BloodGroupResult;
  malaria: MalariaResult;
}): boolean {
  return (
    r.genotype === 'SS' ||
    r.genotype === 'SC' ||
    r.genotype === 'unclear' ||
    r.bloodGroup === 'unclear' ||
    r.malaria === 'positive' ||
    r.malaria === 'invalid'
  );
}
