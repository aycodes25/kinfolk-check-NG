import type { BloodGroupResult, Genotype, GenotypeResult, Lang, MalariaResult } from './types';

type Bi = Record<Lang, string>;

const GENOTYPE: Record<Genotype, Bi> = {
  AA: {
    en: 'You are AA. You do not carry the sickle cell gene.',
    pcm: 'You be AA. You no carry sickle cell gene.',
  },
  AS: {
    en: 'You are AS, a carrier. You are healthy, but you can pass the sickle cell gene to your children.',
    pcm: 'You be AS. You healthy, but you fit pass am give your pikin dem.',
  },
  SS: {
    en: 'You are SS. This points to sickle cell disease. Please confirm at a lab and see a doctor.',
    pcm: 'You be SS. Dis one dey point to sickle cell disease. Abeg confirm am for lab and see doctor.',
  },
  AC: {
    en: 'You are AC, a carrier of the haemoglobin C gene. You are healthy, but you can pass it on.',
    pcm: 'You be AC. You healthy, but you fit pass di C gene give your pikin dem.',
  },
  SC: {
    en: 'You are SC. This can cause a form of sickle cell disease. Please confirm at a lab and see a doctor.',
    pcm: 'You be SC. Dis one fit cause sickle cell disease. Abeg confirm am for lab and see doctor.',
  },
};

const MALARIA: Record<MalariaResult, Bi> = {
  negative: {
    en: 'Malaria test: negative. No malaria was detected by this test. If you feel unwell, still see a doctor.',
    pcm: 'Malaria test: negative. Di test no see malaria. If your body no dey fine, still go see doctor.',
  },
  positive: {
    en: 'Malaria test: positive. Malaria was detected. Please see a doctor or confirm at a lab for treatment.',
    pcm: 'Malaria test: positive. Di test see malaria. Abeg go see doctor or confirm for lab make dem treat you.',
  },
  invalid: {
    en: 'Malaria test: invalid. The test did not work properly. Repeat with a new kit or test at a lab.',
    pcm: 'Malaria test: invalid. Di test no work well. Do am again with new kit or go lab.',
  },
};

export const UNCLEAR_LABEL: Bi = {
  en: 'Unclear — retake or go to lab',
  pcm: 'E no clear — do am again or go lab',
};

export const formatBloodGroup = (b: BloodGroupResult) => (b === 'unclear' ? 'Unclear' : `${b.abo}${b.rh}`);
export const formatGenotype = (g: GenotypeResult) => (g === 'unclear' ? 'Unclear' : g);

const UNCLEAR_GENOTYPE: Bi = {
  en: 'This genotype test could not be read clearly, so no result is given. Retake it with a new kit in good light, or go to a lab. Do not make any decision from this.',
  pcm: 'We no fit read dis genotype test well, so no result dey. Do am again with new kit for good light, or go lab. No use am decide anything.',
};
const UNCLEAR_BLOOD: Bi = {
  en: 'This blood group test could not be read clearly, so no result is given. Retake it with a new kit in good light, or go to a lab. Do not use this for any transfusion or medical decision.',
  pcm: 'We no fit read dis blood group test well, so no result dey. Do am again with new kit for good light, or go lab. No use am for blood transfusion or any medical matter.',
};

export function explainGenotype(g: GenotypeResult, lang: Lang): string {
  return g === 'unclear' ? UNCLEAR_GENOTYPE[lang] : GENOTYPE[g][lang];
}

export function explainMalaria(m: MalariaResult, lang: Lang): string {
  return MALARIA[m][lang];
}

export function explainBloodGroup(b: BloodGroupResult, lang: Lang): string {
  if (b === 'unclear') return UNCLEAR_BLOOD[lang];
  const label = formatBloodGroup(b);
  return lang === 'en'
    ? `Your blood group is ${label}. Keep this in your health records.`
    : `Your blood group na ${label}. Keep am for your health records.`;
}

export function explainCouple(level: 'clear' | 'lower' | 'elevated', rh: 'match' | 'mismatch', lang: Lang): string {
  const genotypePart: Bi =
    level === 'clear'
      ? {
          en: 'Both of you are AA, so your children would not inherit the sickle cell gene from you.',
          pcm: 'Una two na AA, so una pikin no go inherit sickle cell gene from una.',
        }
      : level === 'lower'
        ? {
            en: 'Lower risk — still confirm. This pairing cannot give a child sickle cell disease, but at least one of you carries a gene (S or C) that can be passed on. Please confirm both genotypes at a lab and speak to a counsellor.',
            pcm: 'Lower risk — still confirm. Dis pairing no fit give pikin sickle cell disease, but at least one of una carry gene (S or C) wey fit pass go. Abeg confirm both genotype for lab and talk to counsellor.',
          }
        : {
            en: 'Your genotype pairing carries a chance of a child with sickle cell disease. Please speak to a genetic counsellor or doctor before making decisions.',
            pcm: 'Your genotype pairing get chance to born pikin wey get sickle cell disease. Abeg talk to genetic counsellor or doctor before una decide.',
          };
  const rhPart: Bi =
    rh === 'match'
      ? { en: '', pcm: '' }
      : {
          en: ' Your Rh factors differ. If the woman is Rh-negative, she should get antenatal care early.',
          pcm: ' Your Rh no match. If di woman na Rh-negative, make she start antenatal early.',
        };
  return genotypePart[lang] + rhPart[lang];
}

export const SCREENING_NOTE: Bi = {
  en: 'This is a screening, not a diagnosis.',
  pcm: 'Dis one na screening, no be diagnosis.',
};

export const COUNSELLOR_NOTE: Bi = {
  en: 'Please speak to a genetic counsellor or doctor.',
  pcm: 'Abeg talk to genetic counsellor or doctor.',
};

/** Explains the CC row in the per-child risk list. Empty when a CC child is not possible. */
export function childRiskNote(risk: Partial<Record<string, number>>, lang: Lang): string {
  if (!(risk.CC && risk.CC > 0)) return '';
  return lang === 'en'
    ? 'CC means haemoglobin C disease, usually milder than sickle cell disease but still needing medical follow-up.'
    : 'CC na haemoglobin C disease. E dey usually mild pass sickle cell disease, but doctor go still need to follow am.';
}
