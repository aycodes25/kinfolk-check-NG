export type Genotype = 'AA' | 'AS' | 'SS' | 'AC' | 'SC';
export type ABO = 'A' | 'B' | 'AB' | 'O';
export type Rh = '+' | '-';
export type BloodGroup = { abo: ABO; rh: Rh };
/** The reading could not be made safely. Never guessed, never shared by QR. */
export type Unclear = 'unclear';
export type GenotypeResult = Genotype | Unclear;
export type BloodGroupResult = BloodGroup | Unclear;
export type MalariaResult = 'negative' | 'positive' | 'invalid';
export type TestKind = 'genotype' | 'bloodGroup' | 'malaria';
export type Lang = 'en' | 'pcm';

export interface TestRecord {
  id: string;
  createdAt: number;
  genotype: GenotypeResult;
  bloodGroup: BloodGroupResult;
  malaria: MalariaResult;
  /** local file paths of kit photos, per test */
  photos: Partial<Record<TestKind, string>>;
}
