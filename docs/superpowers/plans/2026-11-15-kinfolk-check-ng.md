# Kinfolk Check NG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Kinfolk Check NG, an on-device React Native (Expo) app that guides a home genotype + blood group + malaria kit test, offers OpenCV-assisted reading the user must confirm, explains results in English/Pidgin, and checks couple compatibility via QR.

**Architecture:** Pure TypeScript domain logic (genotype risk, Rh, explanations, lab-confirm rules, QR payload, vision interpretation) is built and unit-tested first. Screens (Expo Router) sit on top, using AsyncStorage + file storage on-device. Vision is behind a `VisionReader` interface: a stub (manual fallback) ships first, then an OpenCV adapter replaces it.

**Tech Stack:** Expo SDK 54, React Native, TypeScript, Expo Router, expo-camera, react-native-qrcode-svg + react-native-svg, @react-native-async-storage/async-storage, expo-file-system (legacy API), react-native-fast-opencv, jest-expo.

## Global Constraints

- Product name is **Kinfolk Check NG** everywhere (app title, `app.json` name, UI copy, docs). Never "Kinfolk Check" alone.
- Project folder is `C:\Users\Hp\KinfolkCheck`, separate from OrderProcessingSystem.
- Reading is called **"Assisted reading"** in the UI. Never "AI result" or "Automatic result".
- Nothing is saved as final without user confirmation. SS, SC, positive malaria and invalid results also require the "confirm at a lab" acknowledgement before saving.
- KitProfile defines **three separate test definitions** (`genotype`, `bloodGroup`, `malaria`), each with its own bands, control, thresholds, wait time. Default capture mode is **three-photo**; `single-photo` is a supported setting.
- Timer default is 10 minutes, taken from the KitProfile, with the note "Timer is per kit instructions — we will confirm exact wait time once we have the real kit."
- QR payload contains ONLY genotype + blood group + Rh + version. No name, phone, photo, date of birth.
- Delete-all removes AsyncStorage data AND photos in file storage, behind a second "Are you sure?" screen, then verifies nothing remains.
- Every result shows "screening, not diagnosis". SS, SC, positive malaria, invalid show "See a doctor / confirm at a lab" and a "Find a lab near me" button (static Abuja/Lagos text list in v1).
- Language toggle English / Pidgin for result explanations and onboarding; medical terms stay in English.
- Palette: primary teal `#0F766E`, accent coral `#F97362`, background `#F7FAF9`, ink `#12312E`; green/amber/red only for result status; dark mode follows system.
- No accounts, backend, cloud sync, payments or kit ordering in v1.
- Relative imports only (no path aliases) in `src/` and `app/`.

## File Structure

```
KinfolkCheck/
  app.json, package.json, jest.config.js, tsconfig.json
  app/
    _layout.tsx            providers + gate to onboarding
    onboarding.tsx
    index.tsx              home
    labs.tsx               static "Find a lab near me"
    history.tsx
    settings.tsx
    delete-all.tsx         second "Are you sure?" screen
    test/prepare.tsx  test/timer.tsx  test/capture.tsx  test/review.tsx
    result/[id].tsx
    couple/index.tsx  couple/scan.tsx  couple/summary.tsx
  src/
    domain/types.ts genotype.ts couple.ts explanations.ts safety.ts labs.ts
    kit/profile.ts timer.ts
    vision/types.ts interpret.ts stub.ts opencv.ts measure.ts index.ts
    couple/payload.ts
    storage/records.ts photos.ts
    i18n/strings.ts settings.tsx
    wizard/WizardContext.tsx
    ui/theme.ts components.tsx
  src/**/__tests__/*.test.ts
```

---

### Task 1: Scaffold project, tooling and theme

**Files:**
- Create: whole project in `C:\Users\Hp\KinfolkCheck` (merged with existing `docs/`)
- Create: `jest.config.js`, `src/ui/theme.ts`, `src/domain/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: `useTheme(): Theme` and `type Theme` from `src/ui/theme.ts`.

- [ ] **Step 1: Scaffold in a temp folder, then merge**

```bash
cd /c/Users/Hp
npx create-expo-app@latest KinfolkCheck-tmp --template default
cd KinfolkCheck-tmp && npm run reset-project
rm -rf app-example
cd ..
cp -r KinfolkCheck-tmp/. KinfolkCheck/
rm -rf KinfolkCheck-tmp
cd KinfolkCheck && git init
```
Expected: `KinfolkCheck` contains `package.json`, `app/`, and still contains `docs/`.

- [ ] **Step 2: Install dependencies**

```bash
cd /c/Users/Hp/KinfolkCheck
npx expo install expo-camera expo-file-system react-native-svg @react-native-async-storage/async-storage expo-image-manipulator
npm install react-native-qrcode-svg
npx expo install jest-expo jest @types/jest --dev
```

- [ ] **Step 3: Set app name and jest config**

In `app.json`, set `"name": "Kinfolk Check NG"`, `"slug": "kinfolk-check-ng"`, `"scheme": "kinfolkcheckng"`, and add `"android": { "package": "ng.kinfolkcheck.app", "permissions": ["CAMERA"] }` and the `expo-camera` plugin with `cameraPermission` text "Kinfolk Check NG uses the camera to photograph your test kit and scan your partner's QR code."

Create `jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  setupFiles: ['@react-native-async-storage/async-storage/jest/async-storage-mock'],
};
```

In `package.json` scripts add `"test": "jest"`.

- [ ] **Step 4: Write smoke test**

`src/domain/__tests__/smoke.test.ts`:

```ts
test('jest runs', () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 5: Run test**

Run: `npm test`
Expected: 1 test PASS.

- [ ] **Step 6: Create theme**

`src/ui/theme.ts`:

```ts
import { useColorScheme } from 'react-native';

export const palette = {
  teal: '#0F766E',
  coral: '#F97362',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B91C1C',
};

const light = {
  bg: '#F7FAF9',
  card: '#FFFFFF',
  ink: '#12312E',
  muted: '#5B7370',
  border: '#D5E3E0',
  primary: palette.teal,
  accent: palette.coral,
  onPrimary: '#FFFFFF',
};

const dark: typeof light = {
  bg: '#0B1B19',
  card: '#13302D',
  ink: '#E6F2F0',
  muted: '#9DB8B4',
  border: '#24473F',
  primary: '#2DB5A8',
  accent: palette.coral,
  onPrimary: '#052321',
};

export type Theme = typeof light & { status: typeof palette; radius: number; space: (n: number) => number };

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? dark : light;
  return { ...base, status: palette, radius: 16, space: (n: number) => n * 8 };
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Kinfolk Check NG with jest and theme"
```

---

### Task 2: Domain types, genotype risk and Rh logic

**Files:**
- Create: `src/domain/types.ts`, `src/domain/genotype.ts`, `src/domain/couple.ts`
- Test: `src/domain/__tests__/genotype.test.ts`, `src/domain/__tests__/couple.test.ts`

**Interfaces:**
- Produces:
  - `types.ts`: `Genotype`, `ABO`, `Rh`, `BloodGroup`, `MalariaResult`, `TestKind`, `Lang`, `TestRecord`
  - `genotype.ts`: `ChildGenotype`, `offspringRisk(a: Genotype, b: Genotype): Partial<Record<ChildGenotype, number>>`, `sickleDiseaseChance(risk): number`
  - `couple.ts`: `CouplePerson`, `coupleSummary(a: CouplePerson, b: CouplePerson): CoupleSummary`

- [ ] **Step 1: Write types**

`src/domain/types.ts`:

```ts
export type Genotype = 'AA' | 'AS' | 'SS' | 'AC' | 'SC';
export type ABO = 'A' | 'B' | 'AB' | 'O';
export type Rh = '+' | '-';
export type BloodGroup = { abo: ABO; rh: Rh };
export type MalariaResult = 'negative' | 'positive' | 'invalid';
export type TestKind = 'genotype' | 'bloodGroup' | 'malaria';
export type Lang = 'en' | 'pcm';

export interface TestRecord {
  id: string;
  createdAt: number;
  genotype: Genotype;
  bloodGroup: BloodGroup;
  malaria: MalariaResult;
  /** local file paths of kit photos, per test */
  photos: Partial<Record<TestKind, string>>;
}
```

- [ ] **Step 2: Write failing genotype tests**

`src/domain/__tests__/genotype.test.ts`:

```ts
import { offspringRisk, sickleDiseaseChance } from '../genotype';

test('AA x AA gives only AA', () => {
  expect(offspringRisk('AA', 'AA')).toEqual({ AA: 1 });
});

test('AS x AS gives 25% AA, 50% AS, 25% SS', () => {
  expect(offspringRisk('AS', 'AS')).toEqual({ AA: 0.25, AS: 0.5, SS: 0.25 });
  expect(sickleDiseaseChance(offspringRisk('AS', 'AS'))).toBe(0.25);
});

test('AS x AA has no sickle disease chance', () => {
  expect(offspringRisk('AS', 'AA')).toEqual({ AA: 0.5, AS: 0.5 });
  expect(sickleDiseaseChance(offspringRisk('AS', 'AA'))).toBe(0);
});

test('AS x SC gives AS, AC, SS, SC at 25% each', () => {
  expect(offspringRisk('AS', 'SC')).toEqual({ AS: 0.25, AC: 0.25, SS: 0.25, SC: 0.25 });
  expect(sickleDiseaseChance(offspringRisk('AS', 'SC'))).toBe(0.5);
});

test('SS x SS gives only SS', () => {
  expect(offspringRisk('SS', 'SS')).toEqual({ SS: 1 });
});

test('AC x AC includes CC', () => {
  expect(offspringRisk('AC', 'AC')).toEqual({ AA: 0.25, AC: 0.5, CC: 0.25 });
});

test('order of parents does not matter', () => {
  expect(offspringRisk('AS', 'SC')).toEqual(offspringRisk('SC', 'AS'));
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx jest src/domain/__tests__/genotype.test.ts`
Expected: FAIL, cannot find module `../genotype`.

- [ ] **Step 4: Implement genotype**

`src/domain/genotype.ts`:

```ts
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
```

- [ ] **Step 5: Run to verify pass**

Run: `npx jest src/domain/__tests__/genotype.test.ts`
Expected: 7 PASS.

- [ ] **Step 6: Write failing couple tests**

`src/domain/__tests__/couple.test.ts`:

```ts
import { coupleSummary } from '../couple';

const p = (g: any, abo: any, rh: any) => ({ genotype: g, bloodGroup: { abo, rh } });

test('AS + AS is elevated', () => {
  const s = coupleSummary(p('AS', 'O', '+'), p('AS', 'A', '+'));
  expect(s.level).toBe('elevated');
  expect(s.sickleChance).toBe(0.25);
  expect(s.rh).toBe('match');
});

test('AA + AS is low', () => {
  expect(coupleSummary(p('AA', 'O', '+'), p('AS', 'O', '+')).level).toBe('low');
});

test('Rh mismatch is flagged', () => {
  expect(coupleSummary(p('AA', 'O', '-'), p('AA', 'O', '+')).rh).toBe('mismatch');
});
```

- [ ] **Step 7: Run to verify failure**

Run: `npx jest src/domain/__tests__/couple.test.ts`
Expected: FAIL, cannot find module `../couple`.

- [ ] **Step 8: Implement couple**

`src/domain/couple.ts`:

```ts
import { offspringRisk, sickleDiseaseChance, type ChildGenotype } from './genotype';
import type { BloodGroup, Genotype } from './types';

export interface CouplePerson {
  genotype: Genotype;
  bloodGroup: BloodGroup;
}

export interface CoupleSummary {
  risk: Partial<Record<ChildGenotype, number>>;
  sickleChance: number;
  level: 'low' | 'elevated';
  rh: 'match' | 'mismatch';
}

export function coupleSummary(a: CouplePerson, b: CouplePerson): CoupleSummary {
  const risk = offspringRisk(a.genotype, b.genotype);
  const sickleChance = sickleDiseaseChance(risk);
  return {
    risk,
    sickleChance,
    level: sickleChance > 0 ? 'elevated' : 'low',
    rh: a.bloodGroup.rh === b.bloodGroup.rh ? 'match' : 'mismatch',
  };
}
```

- [ ] **Step 9: Run all tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat(domain): genotype offspring risk and couple summary"
```

---

### Task 3: Explanations (English + Pidgin) and safety rules

**Files:**
- Create: `src/domain/explanations.ts`, `src/domain/safety.ts`, `src/domain/labs.ts`
- Test: `src/domain/__tests__/explanations.test.ts`, `src/domain/__tests__/safety.test.ts`

**Interfaces:**
- Consumes: `Genotype`, `BloodGroup`, `MalariaResult`, `Lang` from `types.ts`.
- Produces: `explainGenotype(g, lang)`, `explainBloodGroup(b, lang)`, `explainMalaria(m, lang)`, `explainCouple(level, rh, lang)` returning `string`; `needsLabConfirmation(r: {genotype; malaria}): boolean`; `labGuidance: { city: string; places: string[] }[]`.

- [ ] **Step 1: Write failing tests**

`src/domain/__tests__/explanations.test.ts`:

```ts
import { explainGenotype, explainBloodGroup, explainMalaria, explainCouple } from '../explanations';
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
  for (const level of ['low', 'elevated'] as const) {
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
```

`src/domain/__tests__/safety.test.ts`:

```ts
import { needsLabConfirmation } from '../safety';

const r = (genotype: any, malaria: any) => ({ genotype, malaria });

test.each([
  ['SS', 'negative'],
  ['SC', 'negative'],
  ['AA', 'positive'],
  ['AA', 'invalid'],
])('%s / %s needs lab confirmation', (g, m) => {
  expect(needsLabConfirmation(r(g, m))).toBe(true);
});

test.each([
  ['AA', 'negative'],
  ['AS', 'negative'],
  ['AC', 'negative'],
])('%s / %s does not', (g, m) => {
  expect(needsLabConfirmation(r(g, m))).toBe(false);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/domain/__tests__/explanations.test.ts src/domain/__tests__/safety.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement explanations**

`src/domain/explanations.ts`:

```ts
import type { BloodGroup, Genotype, Lang, MalariaResult } from './types';

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

export const formatBloodGroup = (b: BloodGroup) => `${b.abo}${b.rh}`;

export function explainGenotype(g: Genotype, lang: Lang): string {
  return GENOTYPE[g][lang];
}

export function explainMalaria(m: MalariaResult, lang: Lang): string {
  return MALARIA[m][lang];
}

export function explainBloodGroup(b: BloodGroup, lang: Lang): string {
  const label = formatBloodGroup(b);
  return lang === 'en'
    ? `Your blood group is ${label}. Keep this in your health records.`
    : `Your blood group na ${label}. Keep am for your health records.`;
}

export function explainCouple(level: 'low' | 'elevated', rh: 'match' | 'mismatch', lang: Lang): string {
  const genotypePart: Bi =
    level === 'low'
      ? {
          en: 'Your genotype pairing carries no chance of a child with sickle cell disease.',
          pcm: 'Your genotype pairing no get chance to born pikin wey get sickle cell disease.',
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
```

- [ ] **Step 4: Implement safety and labs**

`src/domain/safety.ts`:

```ts
import type { Genotype, MalariaResult } from './types';

export function needsLabConfirmation(r: { genotype: Genotype; malaria: MalariaResult }): boolean {
  return r.genotype === 'SS' || r.genotype === 'SC' || r.malaria === 'positive' || r.malaria === 'invalid';
}
```

`src/domain/labs.ts`:

```ts
export const labGuidance: { city: string; places: string[] }[] = [
  {
    city: 'Abuja',
    places: [
      'National Hospital Abuja (haematology / genetics unit)',
      'Any federal medical centre or accredited medical laboratory near you',
    ],
  },
  {
    city: 'Lagos',
    places: [
      'Lagos University Teaching Hospital (LUTH), Idi-Araba',
      'Any accredited medical laboratory near you',
    ],
  },
];

export const labAdvice =
  'Call ahead to confirm they offer haemoglobin electrophoresis (genotype) and malaria testing, and bring your kit result.';
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(domain): English/Pidgin explanations, lab-confirm rules, lab guidance"
```

---

### Task 4: KitProfile (three test definitions) and timer helper

**Files:**
- Create: `src/kit/profile.ts`, `src/kit/timer.ts`
- Test: `src/kit/__tests__/profile.test.ts`, `src/kit/__tests__/timer.test.ts`

**Interfaces:**
- Consumes: `TestKind` from `domain/types`.
- Produces:
  - `Rect = { x: number; y: number; w: number; h: number }` (normalised 0..1)
  - `TestDefinition { kind; label; waitMinutes; captureHint; bands: {id: string; rect: Rect}[]; control?: Rect; patterns: Record<string, string[]>; invalidOnNoControl?: boolean; thresholds: { controlMin: number; lineMin: number; minConfidence: number } }`
  - `KitProfile { name; captureMode: 'three-photo' | 'single-photo'; tests: Record<TestKind, TestDefinition> }`
  - `defaultKitProfile: KitProfile`, `TEST_ORDER: TestKind[]`
  - `formatMmSs(totalSeconds: number): string`, `secondsLeft(endAt: number, now: number): number`

- [ ] **Step 1: Write failing tests**

`src/kit/__tests__/profile.test.ts`:

```ts
import { defaultKitProfile, TEST_ORDER } from '../profile';

test('three separate test definitions exist', () => {
  expect(Object.keys(defaultKitProfile.tests).sort()).toEqual(['bloodGroup', 'genotype', 'malaria']);
  expect(TEST_ORDER).toEqual(['genotype', 'bloodGroup', 'malaria']);
});

test('default capture mode is three-photo', () => {
  expect(defaultKitProfile.captureMode).toBe('three-photo');
});

test('each test lists the patterns the app accepts', () => {
  expect(Object.keys(defaultKitProfile.tests.genotype.patterns).sort()).toEqual(['AA', 'AC', 'AS', 'SC', 'SS']);
  expect(Object.keys(defaultKitProfile.tests.bloodGroup.patterns)).toHaveLength(8);
  expect(Object.keys(defaultKitProfile.tests.malaria.patterns).sort()).toEqual(['negative', 'positive']);
});

test('every pattern only references defined bands', () => {
  for (const t of Object.values(defaultKitProfile.tests)) {
    const ids = t.bands.map((b) => b.id);
    for (const used of Object.values(t.patterns).flat()) expect(ids).toContain(used);
  }
});

test('wait times come from the profile (10 minutes by default)', () => {
  for (const t of Object.values(defaultKitProfile.tests)) expect(t.waitMinutes).toBe(10);
});
```

`src/kit/__tests__/timer.test.ts`:

```ts
import { formatMmSs, secondsLeft } from '../timer';

test('formats mm:ss', () => {
  expect(formatMmSs(600)).toBe('10:00');
  expect(formatMmSs(65)).toBe('01:05');
  expect(formatMmSs(0)).toBe('00:00');
  expect(formatMmSs(-5)).toBe('00:00');
});

test('secondsLeft rounds up and never goes negative', () => {
  expect(secondsLeft(10_000, 4_500)).toBe(6);
  expect(secondsLeft(10_000, 12_000)).toBe(0);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/kit`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement profile**

`src/kit/profile.ts`:

```ts
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
```

`src/kit/timer.ts`:

```ts
export function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/** Seconds remaining until `endAt` (ms epoch), rounded up, never negative. */
export function secondsLeft(endAt: number, now: number): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(kit): three-window KitProfile and timer helpers"
```

---

### Task 5: Vision interface, interpretation logic and stub reader

**Files:**
- Create: `src/vision/types.ts`, `src/vision/interpret.ts`, `src/vision/stub.ts`, `src/vision/index.ts`
- Test: `src/vision/__tests__/interpret.test.ts`

**Interfaces:**
- Consumes: `TestDefinition` from `kit/profile`.
- Produces:
  - `ReadResult = { pattern: string | null; confidence: number; reason?: 'no-control' | 'low-confidence' | 'unmeasurable' }`
  - `Measurements = { control: number | null; bands: Record<string, number> }` (darkness 0..1)
  - `VisionReader { readWindow(photoUri: string, def: TestDefinition): Promise<ReadResult> }`
  - `interpretMeasurements(def: TestDefinition, m: Measurements): ReadResult`
  - `visionReader: VisionReader` exported from `src/vision/index.ts`

- [ ] **Step 1: Write failing tests**

`src/vision/__tests__/interpret.test.ts`:

```ts
import { interpretMeasurements } from '../interpret';
import { defaultKitProfile } from '../../kit/profile';

const g = defaultKitProfile.tests.genotype;
const m = defaultKitProfile.tests.malaria;
const bg = defaultKitProfile.tests.bloodGroup;

test('genotype AS: A and S bands dark, C light', () => {
  const r = interpretMeasurements(g, { control: 0.8, bands: { A: 0.8, S: 0.8, C: 0.02 } });
  expect(r.pattern).toBe('AS');
  expect(r.confidence).toBeGreaterThanOrEqual(g.thresholds.minConfidence);
});

test('genotype with missing control gives no pattern', () => {
  const r = interpretMeasurements(g, { control: 0.05, bands: { A: 0.8, S: 0.02, C: 0.02 } });
  expect(r.pattern).toBeNull();
  expect(r.reason).toBe('no-control');
});

test('ambiguous bands near the threshold have low confidence', () => {
  const r = interpretMeasurements(g, { control: 0.8, bands: { A: 0.8, S: 0.27, C: 0.02 } });
  expect(r.confidence).toBeLessThan(g.thresholds.minConfidence);
});

test('impossible genotype pattern yields null', () => {
  const r = interpretMeasurements(g, { control: 0.8, bands: { A: 0.02, S: 0.02, C: 0.02 } });
  expect(r.pattern).toBeNull();
  expect(r.reason).toBe('low-confidence');
});

test('malaria positive and negative', () => {
  expect(interpretMeasurements(m, { control: 0.8, bands: { T: 0.9 } }).pattern).toBe('positive');
  expect(interpretMeasurements(m, { control: 0.8, bands: { T: 0.01 } }).pattern).toBe('negative');
});

test('malaria without control is invalid', () => {
  const r = interpretMeasurements(m, { control: 0.0, bands: { T: 0.01 } });
  expect(r.pattern).toBe('invalid');
});

test('blood group O- when nothing is dark, A+ when A and D dark', () => {
  expect(interpretMeasurements(bg, { control: null, bands: { A: 0, B: 0, D: 0 } }).pattern).toBe('O-');
  expect(interpretMeasurements(bg, { control: null, bands: { A: 0.9, B: 0, D: 0.9 } }).pattern).toBe('A+');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/vision`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement types and interpretation**

`src/vision/types.ts`:

```ts
import type { TestDefinition } from '../kit/profile';

export type ReadResult = {
  pattern: string | null;
  confidence: number;
  reason?: 'no-control' | 'low-confidence' | 'unmeasurable';
};

/** Darkness values in 0..1 (0 = white paper, 1 = fully dark line). */
export type Measurements = { control: number | null; bands: Record<string, number> };

export interface VisionReader {
  readWindow(photoUri: string, def: TestDefinition): Promise<ReadResult>;
}
```

`src/vision/interpret.ts`:

```ts
import type { TestDefinition } from '../kit/profile';
import type { Measurements, ReadResult } from './types';

export function interpretMeasurements(def: TestDefinition, m: Measurements): ReadResult {
  const { controlMin, lineMin, minConfidence } = def.thresholds;

  if (def.control && (m.control ?? 0) < controlMin) {
    return def.invalidOnNoControl
      ? { pattern: 'invalid', confidence: 0.9, reason: 'no-control' }
      : { pattern: null, confidence: 0, reason: 'no-control' };
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
  const confidence = Math.min(1, margin / 0.2);
  if (confidence < minConfidence) {
    return { pattern: match[0], confidence, reason: 'low-confidence' };
  }
  return { pattern: match[0], confidence };
}
```

`src/vision/stub.ts`:

```ts
import type { VisionReader } from './types';

/** Always defers to manual selection. Used until the OpenCV reader is wired in. */
export const stubReader: VisionReader = {
  async readWindow() {
    return { pattern: null, confidence: 0, reason: 'unmeasurable' };
  },
};
```

`src/vision/index.ts`:

```ts
import { stubReader } from './stub';
import type { VisionReader } from './types';

export const visionReader: VisionReader = stubReader;
export type { ReadResult, VisionReader } from './types';
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all PASS. If the "ambiguous" test fails, check that `S: 0.27` vs `lineMin: 0.25` gives margin 0.02, confidence 0.1.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(vision): reader interface, measurement interpretation, stub reader"
```

---

### Task 6: Couple QR payload

**Files:**
- Create: `src/couple/payload.ts`
- Test: `src/couple/__tests__/payload.test.ts`

**Interfaces:**
- Consumes: `CouplePerson` from `domain/couple`.
- Produces: `encodePayload(p: CouplePerson): string`, `decodePayload(text: string): CouplePerson | null`.

- [ ] **Step 1: Write failing tests**

`src/couple/__tests__/payload.test.ts`:

```ts
import { encodePayload, decodePayload } from '../payload';

const person = { genotype: 'AS', bloodGroup: { abo: 'O', rh: '+' } } as const;

test('round trip', () => {
  expect(decodePayload(encodePayload(person))).toEqual(person);
});

test('payload contains only version, genotype, blood group and Rh', () => {
  const obj = JSON.parse(encodePayload(person));
  expect(Object.keys(obj).sort()).toEqual(['b', 'g', 'r', 'v']);
});

test('rejects extra fields (e.g. a name)', () => {
  expect(decodePayload(JSON.stringify({ v: 1, g: 'AS', b: 'O', r: '+', name: 'Ada' }))).toBeNull();
});

test('rejects bad values and bad versions and garbage', () => {
  expect(decodePayload(JSON.stringify({ v: 2, g: 'AS', b: 'O', r: '+' }))).toBeNull();
  expect(decodePayload(JSON.stringify({ v: 1, g: 'ZZ', b: 'O', r: '+' }))).toBeNull();
  expect(decodePayload(JSON.stringify({ v: 1, g: 'AS', b: 'X', r: '+' }))).toBeNull();
  expect(decodePayload('not json')).toBeNull();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/couple`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`src/couple/payload.ts`:

```ts
import type { CouplePerson } from '../domain/couple';

const GENOTYPES = ['AA', 'AS', 'SS', 'AC', 'SC'];
const ABOS = ['A', 'B', 'AB', 'O'];
const RHS = ['+', '-'];
const VERSION = 1;

export function encodePayload(p: CouplePerson): string {
  return JSON.stringify({ v: VERSION, g: p.genotype, b: p.bloodGroup.abo, r: p.bloodGroup.rh });
}

export function decodePayload(text: string): CouplePerson | null {
  try {
    const o = JSON.parse(text);
    if (!o || typeof o !== 'object') return null;
    const keys = Object.keys(o).sort().join(',');
    if (keys !== 'b,g,r,v') return null;
    if (o.v !== VERSION) return null;
    if (!GENOTYPES.includes(o.g) || !ABOS.includes(o.b) || !RHS.includes(o.r)) return null;
    return { genotype: o.g, bloodGroup: { abo: o.b, rh: o.r } };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(couple): minimal versioned QR payload"
```

---

### Task 7: Storage (records, photos, verified delete-all)

**Files:**
- Create: `src/storage/photos.ts`, `src/storage/records.ts`
- Test: `src/storage/__tests__/records.test.ts`

**Interfaces:**
- Consumes: `TestRecord` from `domain/types`.
- Produces:
  - `PhotoStore { save(uri: string): Promise<string>; deleteAll(): Promise<void>; count(): Promise<number> }`, `photoStore: PhotoStore`
  - `listRecords(): Promise<TestRecord[]>` (newest first), `saveRecord(r: TestRecord): Promise<void>`, `getRecord(id: string): Promise<TestRecord | undefined>`, `deleteAllData(photos: PhotoStore): Promise<{ recordsLeft: number; photosLeft: number }>`

- [ ] **Step 1: Write failing tests**

`src/storage/__tests__/records.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listRecords, saveRecord, getRecord, deleteAllData, type PhotoStoreLike } from '../records';
import type { TestRecord } from '../../domain/types';

const rec = (id: string, createdAt: number): TestRecord => ({
  id,
  createdAt,
  genotype: 'AS',
  bloodGroup: { abo: 'O', rh: '+' },
  malaria: 'negative',
  photos: { genotype: `file://${id}.jpg` },
});

function fakePhotos(initial: string[]): PhotoStoreLike & { files: string[] } {
  const store = {
    files: [...initial],
    async save(uri: string) {
      store.files.push(uri);
      return uri;
    },
    async deleteAll() {
      store.files = [];
    },
    async count() {
      return store.files.length;
    },
  };
  return store;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('saves and lists newest first', async () => {
  await saveRecord(rec('a', 1));
  await saveRecord(rec('b', 2));
  expect((await listRecords()).map((r) => r.id)).toEqual(['b', 'a']);
  expect((await getRecord('a'))?.id).toBe('a');
});

test('deleteAllData removes records AND photos and verifies', async () => {
  await saveRecord(rec('a', 1));
  const photos = fakePhotos(['x.jpg', 'y.jpg']);
  const result = await deleteAllData(photos);
  expect(result).toEqual({ recordsLeft: 0, photosLeft: 0 });
  expect(await listRecords()).toEqual([]);
  expect(photos.files).toEqual([]);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/storage`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement records**

`src/storage/records.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TestRecord } from '../domain/types';

const KEY = 'kc:records';

export interface PhotoStoreLike {
  save(uri: string): Promise<string>;
  deleteAll(): Promise<void>;
  count(): Promise<number>;
}

export async function listRecords(): Promise<TestRecord[]> {
  const raw = await AsyncStorage.getItem(KEY);
  const all: TestRecord[] = raw ? JSON.parse(raw) : [];
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveRecord(r: TestRecord): Promise<void> {
  const all = await listRecords();
  await AsyncStorage.setItem(KEY, JSON.stringify([...all.filter((x) => x.id !== r.id), r]));
}

export async function getRecord(id: string): Promise<TestRecord | undefined> {
  return (await listRecords()).find((r) => r.id === id);
}

/** Deletes every record, setting and photo, then verifies nothing remains. */
export async function deleteAllData(
  photos: PhotoStoreLike,
): Promise<{ recordsLeft: number; photosLeft: number }> {
  await AsyncStorage.clear();
  await photos.deleteAll();
  return { recordsLeft: (await listRecords()).length, photosLeft: await photos.count() };
}
```

- [ ] **Step 4: Implement photo store**

`src/storage/photos.ts`:

```ts
import * as FS from 'expo-file-system/legacy';
import type { PhotoStoreLike } from './records';

const DIR = (FS.documentDirectory ?? '') + 'kc-photos/';

export type PhotoStore = PhotoStoreLike;

export const photoStore: PhotoStore = {
  async save(uri) {
    await FS.makeDirectoryAsync(DIR, { intermediates: true });
    const dest = `${DIR}${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    await FS.copyAsync({ from: uri, to: dest });
    return dest;
  },
  async deleteAll() {
    await FS.deleteAsync(DIR, { idempotent: true });
  },
  async count() {
    const info = await FS.getInfoAsync(DIR);
    if (!info.exists) return 0;
    return (await FS.readDirectoryAsync(DIR)).length;
  },
};
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(storage): on-device records, photo store and verified delete-all"
```

---

### Task 8: i18n strings, settings provider, UI components

**Files:**
- Create: `src/i18n/strings.ts`, `src/i18n/settings.tsx`, `src/ui/components.tsx`
- Test: `src/i18n/__tests__/strings.test.ts`

**Interfaces:**
- Consumes: `Lang` from `domain/types`; `useTheme` from `ui/theme`.
- Produces:
  - `strings: Record<Lang, Record<StringKey, string>>`, `type StringKey`
  - `SettingsProvider`, `useSettings(): { lang: Lang; setLang(l: Lang): void; accepted: boolean; accept(): void; loaded: boolean }`
  - `Screen`, `H1`, `Body`, `Muted`, `PrimaryButton`, `SecondaryButton`, `Card`, `Chip`, `Banner` components

- [ ] **Step 1: Write failing test**

`src/i18n/__tests__/strings.test.ts`:

```ts
import { strings } from '../strings';

test('every key exists in both languages and is non-empty', () => {
  const en = Object.keys(strings.en).sort();
  const pcm = Object.keys(strings.pcm).sort();
  expect(pcm).toEqual(en);
  for (const k of en) {
    expect((strings.en as any)[k].length).toBeGreaterThan(0);
    expect((strings.pcm as any)[k].length).toBeGreaterThan(0);
  }
});

test('product name appears in full, never as plain "Kinfolk Check" alone', () => {
  const text = JSON.stringify(strings);
  const bad = text.match(/Kinfolk Check(?! NG)/g);
  expect(bad).toBeNull();
});

test('strings never call the reading AI or automatic', () => {
  expect(JSON.stringify(strings)).not.toMatch(/\bAI result\b|Automatic result/i);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx jest src/i18n`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement strings**

`src/i18n/strings.ts`:

```ts
import type { Lang } from '../domain/types';

const en = {
  appName: 'Kinfolk Check NG',
  ob1Title: 'One kit. Three results.',
  ob1Body: 'Test your genotype, blood group and malaria at home in about 10 minutes.',
  ob2Title: 'Your data stays on your phone',
  ob2Body: 'No account. Nothing is uploaded. You can delete everything any time.',
  ob3Title: 'A screening, not a diagnosis',
  ob3Body:
    'Kinfolk Check NG helps you screen at home. It does not replace a doctor or laboratory. Serious results must be confirmed at a lab.',
  accept: 'I understand, continue',
  next: 'Next',
  startTest: 'Start a test',
  checkCompat: 'Check compatibility',
  history: 'History',
  settings: 'Settings',
  assisted: 'Assisted reading',
  assistedNote: 'The app suggests what it sees. You confirm what is on your kit.',
  timerNote: 'Timer is per kit instructions — we will confirm exact wait time once we have the real kit.',
  findLab: 'Find a lab near me',
  seeDoctor: 'See a doctor / confirm at a lab',
  ackLab: 'I understand I must confirm this result at a lab.',
  language: 'Language',
  deleteAll: 'Delete all my data',
  areYouSure: 'Are you sure?',
  deleteWarn: 'This permanently deletes all your results and kit photos from this phone. This cannot be undone.',
  yesDelete: 'Yes, delete everything',
  cancel: 'Cancel',
  noResults: 'No results yet.',
} as const;

export type StringKey = keyof typeof en;

const pcm: Record<StringKey, string> = {
  appName: 'Kinfolk Check NG',
  ob1Title: 'One kit. Three results.',
  ob1Body: 'Test your genotype, blood group and malaria for house for like 10 minutes.',
  ob2Title: 'Your data dey stay for your phone',
  ob2Body: 'No account. We no dey upload anything. You fit delete everything anytime.',
  ob3Title: 'Na screening, no be diagnosis',
  ob3Body:
    'Kinfolk Check NG dey help you screen for house. E no replace doctor or lab. Serious result must go lab for confirmation.',
  accept: 'I don understand, continue',
  next: 'Next',
  startTest: 'Start test',
  checkCompat: 'Check compatibility',
  history: 'History',
  settings: 'Settings',
  assisted: 'Assisted reading',
  assistedNote: 'Di app go suggest wetin e see. You go confirm wetin dey your kit.',
  timerNote: 'Timer na per kit instructions — we go confirm di exact wait time when we get di real kit.',
  findLab: 'Find lab near me',
  seeDoctor: 'See doctor / confirm for lab',
  ackLab: 'I understand say I must confirm dis result for lab.',
  language: 'Language',
  deleteAll: 'Delete all my data',
  areYouSure: 'You sure?',
  deleteWarn: 'Dis one go delete all your results and kit photos for dis phone forever. E no fit come back.',
  yesDelete: 'Yes, delete everything',
  cancel: 'Cancel',
  noResults: 'No result yet.',
};

export const strings: Record<Lang, Record<StringKey, string>> = { en, pcm };
```

- [ ] **Step 4: Implement settings provider**

`src/i18n/settings.tsx`:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Lang } from '../domain/types';
import { strings, type StringKey } from './strings';

const KEY = 'kc:settings';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  accepted: boolean;
  accept: () => void;
  loaded: boolean;
  t: (k: StringKey) => string;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [accepted, setAccepted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const s = JSON.parse(raw);
          if (s.lang === 'en' || s.lang === 'pcm') setLangState(s.lang);
          setAccepted(!!s.accepted);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = (next: { lang: Lang; accepted: boolean }) =>
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});

  const value: Ctx = {
    lang,
    accepted,
    loaded,
    setLang: (l) => {
      setLangState(l);
      persist({ lang: l, accepted });
    },
    accept: () => {
      setAccepted(true);
      persist({ lang, accepted: true });
    },
    t: (k) => strings[lang][k],
  };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const c = useContext(SettingsContext);
  if (!c) throw new Error('useSettings must be used inside SettingsProvider');
  return c;
}
```

- [ ] **Step 5: Implement UI components**

`src/ui/components.tsx`:

```tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './theme';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const t = useTheme();
  const inner = <View style={{ padding: t.space(2.5), gap: t.space(2) }}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {scroll ? <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

export const H1 = ({ children }: { children: React.ReactNode }) => {
  const t = useTheme();
  return <Text style={{ color: t.ink, fontSize: 28, fontWeight: '800' }}>{children}</Text>;
};

export const Body = ({ children, style }: { children: React.ReactNode; style?: object }) => {
  const t = useTheme();
  return <Text style={[{ color: t.ink, fontSize: 17, lineHeight: 25 }, style]}>{children}</Text>;
};

export const Muted = ({ children }: { children: React.ReactNode }) => {
  const t = useTheme();
  return <Text style={{ color: t.muted, fontSize: 14, lineHeight: 20 }}>{children}</Text>;
};

type BtnProps = { label: string; onPress: () => void; disabled?: boolean; style?: ViewStyle };

export function PrimaryButton({ label, onPress, disabled, style }: BtnProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.btn,
        { backgroundColor: disabled ? t.border : t.accent, borderRadius: t.radius },
        style,
      ]}
    >
      <Text style={{ color: '#2A0F0B', fontSize: 17, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, style }: BtnProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.btn, { borderColor: t.primary, borderWidth: 2, borderRadius: t.radius }, style]}
    >
      <Text style={{ color: t.primary, fontSize: 17, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.card, borderRadius: t.radius, padding: t.space(2), borderWidth: 1, borderColor: t.border, gap: t.space(1) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        minWidth: 56,
        alignItems: 'center',
        borderRadius: 999,
        borderWidth: 2,
        borderColor: selected ? t.primary : t.border,
        backgroundColor: selected ? t.primary : t.card,
      }}
    >
      <Text style={{ color: selected ? t.onPrimary : t.ink, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Banner({ tone, children }: { tone: 'warning' | 'danger' | 'success'; children: React.ReactNode }) {
  const t = useTheme();
  const color = t.status[tone];
  return (
    <View style={{ borderLeftWidth: 6, borderLeftColor: color, backgroundColor: t.card, padding: t.space(2), borderRadius: 12, gap: 4 }}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
});
```

Install the safe-area dependency if missing: `npx expo install react-native-safe-area-context`.

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: tests PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(ui): i18n strings, settings provider, shared components"
```

---

### Task 9: Root layout, onboarding and home

**Files:**
- Create: `src/wizard/WizardContext.tsx`
- Modify (replace): `app/_layout.tsx`, `app/index.tsx`
- Create: `app/onboarding.tsx`

**Interfaces:**
- Consumes: `SettingsProvider/useSettings`, `PrimaryButton`, `Card`, `listRecords`, `explain*`.
- Produces: `WizardProvider`, `useWizard(): { photos; suggestions; confirmed; setPhoto(kind, uri); setSuggestion(kind, r); setConfirmed(kind, v); reset() }`.

- [ ] **Step 1: Wizard context**

`src/wizard/WizardContext.tsx`:

```tsx
import React, { createContext, useContext, useState } from 'react';
import type { TestKind } from '../domain/types';
import type { ReadResult } from '../vision/types';

type Ctx = {
  photos: Partial<Record<TestKind, string>>;
  suggestions: Partial<Record<TestKind, ReadResult>>;
  confirmed: Partial<Record<TestKind, string>>;
  setPhoto: (k: TestKind, uri: string) => void;
  setSuggestion: (k: TestKind, r: ReadResult) => void;
  setConfirmed: (k: TestKind, v: string) => void;
  reset: () => void;
};

const WizardContext = createContext<Ctx | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<Ctx['photos']>({});
  const [suggestions, setSuggestions] = useState<Ctx['suggestions']>({});
  const [confirmed, setConfirmedState] = useState<Ctx['confirmed']>({});
  const value: Ctx = {
    photos,
    suggestions,
    confirmed,
    setPhoto: (k, uri) => setPhotos((p) => ({ ...p, [k]: uri })),
    setSuggestion: (k, r) => setSuggestions((p) => ({ ...p, [k]: r })),
    setConfirmed: (k, v) => setConfirmedState((p) => ({ ...p, [k]: v })),
    reset: () => {
      setPhotos({});
      setSuggestions({});
      setConfirmedState({});
    },
  };
  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): Ctx {
  const c = useContext(WizardContext);
  if (!c) throw new Error('useWizard must be used inside WizardProvider');
  return c;
}
```

- [ ] **Step 2: Root layout with onboarding gate**

`app/_layout.tsx`:

```tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SettingsProvider, useSettings } from '../src/i18n/settings';
import { WizardProvider } from '../src/wizard/WizardContext';
import { useTheme } from '../src/ui/theme';

function Gate({ children }: { children: React.ReactNode }) {
  const { loaded, accepted } = useSettings();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (!loaded) return;
    const onOnboarding = segments[0] === 'onboarding';
    if (!accepted && !onOnboarding) router.replace('/onboarding');
    if (accepted && onOnboarding) router.replace('/');
  }, [loaded, accepted, segments]);
  return <>{children}</>;
}

export default function RootLayout() {
  const t = useTheme();
  return (
    <SettingsProvider>
      <WizardProvider>
        <Gate>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: t.bg },
              headerTintColor: t.primary,
              headerTitleStyle: { color: t.ink },
              contentStyle: { backgroundColor: t.bg },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Kinfolk Check NG' }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack>
        </Gate>
      </WizardProvider>
    </SettingsProvider>
  );
}
```

- [ ] **Step 3: Onboarding**

`app/onboarding.tsx`:

```tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { useSettings } from '../src/i18n/settings';
import { Body, H1, Muted, PrimaryButton, Screen, SecondaryButton } from '../src/ui/components';
import type { StringKey } from '../src/i18n/strings';

const SLIDES: { title: StringKey; body: StringKey }[] = [
  { title: 'ob1Title', body: 'ob1Body' },
  { title: 'ob2Title', body: 'ob2Body' },
  { title: 'ob3Title', body: 'ob3Body' },
];

export default function Onboarding() {
  const { t, accept, lang, setLang } = useSettings();
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  return (
    <Screen>
      <View style={{ gap: 16, marginTop: 48 }}>
        <Muted>{`${i + 1} / ${SLIDES.length}`}</Muted>
        <H1>{t(SLIDES[i].title)}</H1>
        <Body>{t(SLIDES[i].body)}</Body>
      </View>
      <View style={{ gap: 12, marginTop: 32 }}>
        <PrimaryButton label={last ? t('accept') : t('next')} onPress={() => (last ? accept() : setI(i + 1))} />
        <SecondaryButton label={lang === 'en' ? 'Pidgin' : 'English'} onPress={() => setLang(lang === 'en' ? 'pcm' : 'en')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 4: Home**

`app/index.tsx`:

```tsx
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { formatBloodGroup } from '../src/domain/explanations';
import type { TestRecord } from '../src/domain/types';
import { useSettings } from '../src/i18n/settings';
import { listRecords } from '../src/storage/records';
import { Body, Card, H1, Muted, PrimaryButton, Screen, SecondaryButton } from '../src/ui/components';
import { useWizard } from '../src/wizard/WizardContext';

export default function Home() {
  const router = useRouter();
  const { t } = useSettings();
  const wizard = useWizard();
  const [latest, setLatest] = useState<TestRecord | undefined>();

  useFocusEffect(
    useCallback(() => {
      listRecords().then((r) => setLatest(r[0]));
    }, []),
  );

  return (
    <Screen>
      <H1>{t('appName')}</H1>
      <PrimaryButton
        label={t('startTest')}
        onPress={() => {
          wizard.reset();
          router.push('/test/prepare');
        }}
      />
      {latest ? (
        <Card>
          <Muted>{new Date(latest.createdAt).toDateString()}</Muted>
          <Body>{`Genotype: ${latest.genotype}`}</Body>
          <Body>{`Blood group: ${formatBloodGroup(latest.bloodGroup)}`}</Body>
          <Body>{`Malaria: ${latest.malaria}`}</Body>
          <SecondaryButton label="View" onPress={() => router.push(`/result/${latest.id}`)} />
        </Card>
      ) : (
        <Card>
          <Muted>{t('noResults')}</Muted>
        </Card>
      )}
      <View style={{ gap: 12 }}>
        <SecondaryButton label={t('checkCompat')} onPress={() => router.push('/couple')} />
        <SecondaryButton label={t('history')} onPress={() => router.push('/history')} />
        <SecondaryButton label={t('settings')} onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` — expected: no errors (screens for other routes don't exist yet; `router.push` with string paths may need `as any` if typed routes are enabled. If TypeScript complains, set `"typedRoutes": false` under `experiments` in `app.json`).
Run: `npx expo start` and open in Expo Go for now. Expected: onboarding appears, three slides, "I understand, continue" lands on Home.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(app): root layout, onboarding gate and home screen"
```

---

### Task 10: Test wizard (prepare, timer, capture, review)

**Files:**
- Create: `app/test/prepare.tsx`, `app/test/timer.tsx`, `app/test/capture.tsx`, `app/test/review.tsx`

**Interfaces:**
- Consumes: `useWizard`, `defaultKitProfile`, `TEST_ORDER`, `formatMmSs`, `secondsLeft`, `visionReader`, `photoStore`, `saveRecord`, `needsLabConfirmation`, `useSettings`.
- Produces: route `/test/review` saves a `TestRecord` and navigates to `/result/<id>`.

- [ ] **Step 1: Prepare**

`app/test/prepare.tsx`:

```tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Card, H1, PrimaryButton, Screen } from '../../src/ui/components';
import { useTheme } from '../../src/ui/theme';

const ITEMS = [
  'Wash and dry your hands.',
  'Open the kit: lancet, alcohol swab, test strip, blood group card, malaria cassette, buffer.',
  'Clean your fingertip with the swab and let it dry.',
  'Prick the side of your fingertip with the lancet.',
  'Follow the kit leaflet to apply blood to each test. Start the timer straight after.',
];

export default function Prepare() {
  const router = useRouter();
  const t = useTheme();
  const [done, setDone] = useState<boolean[]>(ITEMS.map(() => false));
  const all = done.every(Boolean);
  return (
    <Screen>
      <H1>Prepare your kit</H1>
      {ITEMS.map((text, i) => (
        <Pressable
          key={i}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done[i] }}
          onPress={() => setDone(done.map((d, j) => (j === i ? !d : d)))}
        >
          <Card>
            <Text style={{ color: t.ink, fontSize: 17 }}>{`${done[i] ? '☑' : '☐'}  ${text}`}</Text>
          </Card>
        </Pressable>
      ))}
      <PrimaryButton label="Blood applied — start timer" disabled={!all} onPress={() => router.push('/test/timer')} />
    </Screen>
  );
}
```

- [ ] **Step 2: Timer**

`app/test/timer.tsx`:

```tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { useSettings } from '../../src/i18n/settings';
import { defaultKitProfile } from '../../src/kit/profile';
import { formatMmSs, secondsLeft } from '../../src/kit/timer';
import { Body, Card, H1, Muted, PrimaryButton, Screen, SecondaryButton } from '../../src/ui/components';
import { useTheme } from '../../src/ui/theme';

const WAIT_MINUTES = Math.max(...Object.values(defaultKitProfile.tests).map((t) => t.waitMinutes));

export default function Timer() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useSettings();
  const endAt = useRef(Date.now() + WAIT_MINUTES * 60_000).current;
  const [left, setLeft] = useState(WAIT_MINUTES * 60);

  useEffect(() => {
    const id = setInterval(() => setLeft(secondsLeft(endAt, Date.now())), 500);
    return () => clearInterval(id);
  }, [endAt]);

  return (
    <Screen>
      <H1>Wait for results</H1>
      <Card style={{ alignItems: 'center' }}>
        <Text style={{ color: theme.primary, fontSize: 64, fontWeight: '800' }}>{formatMmSs(left)}</Text>
        <Body>Do not read the kit before the timer ends.</Body>
      </Card>
      <Muted>{t('timerNote')}</Muted>
      <PrimaryButton label="Photograph my kit" disabled={left > 0} onPress={() => router.replace('/test/capture')} />
      <SecondaryButton label="Skip wait (kit already developed)" onPress={() => router.replace('/test/capture')} />
    </Screen>
  );
}
```

- [ ] **Step 3: Capture**

`app/test/capture.tsx`:

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import type { TestKind } from '../../src/domain/types';
import { defaultKitProfile, TEST_ORDER } from '../../src/kit/profile';
import { photoStore } from '../../src/storage/photos';
import { Body, H1, Muted, PrimaryButton, Screen } from '../../src/ui/components';
import { visionReader } from '../../src/vision';
import { useWizard } from '../../src/wizard/WizardContext';

export default function Capture() {
  const router = useRouter();
  const wizard = useWizard();
  const camera = useRef<CameraView>(null);
  const [perm, requestPerm] = useCameraPermissions();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const single = defaultKitProfile.captureMode === 'single-photo';
  const kinds: TestKind[] = single ? ['genotype'] : TEST_ORDER;
  const kind = kinds[index];
  const def = defaultKitProfile.tests[kind];

  if (!perm) return <Screen><Muted>Checking camera…</Muted></Screen>;
  if (!perm.granted) {
    return (
      <Screen>
        <H1>Camera needed</H1>
        <Body>Kinfolk Check NG needs the camera to photograph your kit.</Body>
        <PrimaryButton label="Allow camera" onPress={() => requestPerm()} />
        <PrimaryButton label="Skip photos, enter by hand" onPress={() => router.replace('/test/review')} />
      </Screen>
    );
  }

  async function snap() {
    if (!camera.current || busy) return;
    setBusy(true);
    try {
      const shot = await camera.current.takePictureAsync({ quality: 0.8 });
      const saved = await photoStore.save(shot.uri);
      const targets: TestKind[] = single ? TEST_ORDER : [kind];
      for (const k of targets) {
        wizard.setPhoto(k, saved);
        wizard.setSuggestion(k, await visionReader.readWindow(saved, defaultKitProfile.tests[k]));
      }
      if (index + 1 < kinds.length) setIndex(index + 1);
      else router.replace('/test/review');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll={false}>
      <H1>{`${single ? 'Your kit' : def.label} (${index + 1}/${kinds.length})`}</H1>
      <Muted>{def.captureHint}</Muted>
      <View style={{ height: 380, borderRadius: 16, overflow: 'hidden' }}>
        <CameraView ref={camera} style={{ flex: 1 }} facing="back" />
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: '10%', right: '10%', top: '20%', bottom: '20%', borderWidth: 3, borderColor: '#FFFFFF', borderRadius: 12 }}
        />
      </View>
      <PrimaryButton label={busy ? 'Reading…' : 'Take photo'} disabled={busy} onPress={snap} />
      <PrimaryButton label="Skip photo, enter by hand" onPress={() => router.replace('/test/review')} />
    </Screen>
  );
}
```

- [ ] **Step 4: Review (assisted reading, confirm, lab acknowledgement, save)**

`app/test/review.tsx`:

```tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { needsLabConfirmation } from '../../src/domain/safety';
import type { ABO, BloodGroup, Genotype, MalariaResult, TestRecord } from '../../src/domain/types';
import { useSettings } from '../../src/i18n/settings';
import { defaultKitProfile, TEST_ORDER } from '../../src/kit/profile';
import { saveRecord } from '../../src/storage/records';
import { Banner, Body, Card, Chip, H1, Muted, PrimaryButton, Screen } from '../../src/ui/components';
import { useTheme } from '../../src/ui/theme';
import { useWizard } from '../../src/wizard/WizardContext';

function parseBloodGroup(v: string): BloodGroup {
  return { abo: v.slice(0, -1) as ABO, rh: v.slice(-1) as '+' | '-' };
}

export default function Review() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useSettings();
  const w = useWizard();
  const [ack, setAck] = useState(false);

  // Pre-select the suggestion, but only when confidence is high enough. The user still confirms.
  useEffect(() => {
    for (const k of TEST_ORDER) {
      const s = w.suggestions[k];
      const min = defaultKitProfile.tests[k].thresholds.minConfidence;
      if (s?.pattern && s.confidence >= min && !w.confirmed[k]) w.setConfirmed(k, s.pattern);
    }
  }, []);

  const complete = TEST_ORDER.every((k) => !!w.confirmed[k]);
  const draft =
    complete
      ? {
          genotype: w.confirmed.genotype as Genotype,
          malaria: w.confirmed.malaria as MalariaResult,
        }
      : null;
  const serious = draft ? needsLabConfirmation(draft) : false;

  async function save() {
    if (!complete || (serious && !ack)) return;
    const record: TestRecord = {
      id: `${Date.now()}`,
      createdAt: Date.now(),
      genotype: w.confirmed.genotype as Genotype,
      bloodGroup: parseBloodGroup(w.confirmed.bloodGroup as string),
      malaria: w.confirmed.malaria as MalariaResult,
      photos: w.photos,
    };
    await saveRecord(record);
    router.replace(`/result/${record.id}`);
  }

  return (
    <Screen>
      <H1>Confirm your results</H1>
      <Muted>{t('assistedNote')}</Muted>
      {TEST_ORDER.map((k) => {
        const def = defaultKitProfile.tests[k];
        const s = w.suggestions[k];
        const suggested = s?.pattern && s.confidence >= def.thresholds.minConfidence ? s.pattern : null;
        const options = k === 'malaria' ? ['negative', 'positive', 'invalid'] : Object.keys(def.patterns);
        return (
          <Card key={k}>
            <Body style={{ fontWeight: '700' }}>{def.label}</Body>
            {suggested ? (
              <Muted>{`${t('assisted')}: ${suggested} — please check it matches your kit.`}</Muted>
            ) : (
              <Muted>Could not read this clearly. Please choose what you see on your kit.</Muted>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {options.map((o) => (
                <Chip key={o} label={o} selected={w.confirmed[k] === o} onPress={() => w.setConfirmed(k, o)} />
              ))}
            </View>
          </Card>
        );
      })}

      {serious && (
        <Banner tone="danger">
          <Body style={{ fontWeight: '700' }}>{t('seeDoctor')}</Body>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: ack }} onPress={() => setAck(!ack)}>
            <Text style={{ color: theme.ink, fontSize: 16 }}>{`${ack ? '☑' : '☐'}  ${t('ackLab')}`}</Text>
          </Pressable>
        </Banner>
      )}

      <PrimaryButton label="Confirm and save" disabled={!complete || (serious && !ack)} onPress={save} />
    </Screen>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no errors. Manually: Start test → complete checklist → timer (use skip) → capture (or skip) → pick values → serious values require the checkbox before the button enables.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(wizard): prepare, timer, capture, assisted review with lab acknowledgement"
```

---

### Task 11: Result screen and "Find a lab near me"

**Files:**
- Create: `app/result/[id].tsx`, `app/labs.tsx`

**Interfaces:**
- Consumes: `getRecord`, `explain*`, `SCREENING_NOTE`, `needsLabConfirmation`, `labGuidance`, `labAdvice`.

- [ ] **Step 1: Result screen**

`app/result/[id].tsx`:

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { explainBloodGroup, explainGenotype, explainMalaria, formatBloodGroup, SCREENING_NOTE } from '../../src/domain/explanations';
import { needsLabConfirmation } from '../../src/domain/safety';
import type { TestRecord } from '../../src/domain/types';
import { useSettings } from '../../src/i18n/settings';
import { getRecord } from '../../src/storage/records';
import { Banner, Body, Card, H1, Muted, PrimaryButton, Screen, SecondaryButton } from '../../src/ui/components';

export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { lang, setLang, t } = useSettings();
  const [rec, setRec] = useState<TestRecord | undefined | null>(null);

  useEffect(() => {
    getRecord(id).then(setRec);
  }, [id]);

  if (rec === null) return <Screen><Muted>Loading…</Muted></Screen>;
  if (!rec) return <Screen><Body>Result not found.</Body></Screen>;

  const serious = needsLabConfirmation(rec);
  return (
    <Screen>
      <H1>Your results</H1>
      <Muted>{`${t('assisted')} · ${SCREENING_NOTE[lang]}`}</Muted>
      {serious && (
        <Banner tone="danger">
          <Body style={{ fontWeight: '700' }}>{t('seeDoctor')}</Body>
          <PrimaryButton label={t('findLab')} onPress={() => router.push('/labs')} />
        </Banner>
      )}
      <Card>
        <Body style={{ fontWeight: '700' }}>{`Genotype: ${rec.genotype}`}</Body>
        <Body>{explainGenotype(rec.genotype, lang)}</Body>
      </Card>
      <Card>
        <Body style={{ fontWeight: '700' }}>{`Blood group: ${formatBloodGroup(rec.bloodGroup)}`}</Body>
        <Body>{explainBloodGroup(rec.bloodGroup, lang)}</Body>
      </Card>
      <Card>
        <Body style={{ fontWeight: '700' }}>{`Malaria: ${rec.malaria}`}</Body>
        <Body>{explainMalaria(rec.malaria, lang)}</Body>
      </Card>
      <SecondaryButton label={lang === 'en' ? 'Read in Pidgin' : 'Read in English'} onPress={() => setLang(lang === 'en' ? 'pcm' : 'en')} />
      <PrimaryButton label={t('checkCompat')} onPress={() => router.push('/couple')} />
    </Screen>
  );
}
```

- [ ] **Step 2: Labs screen**

`app/labs.tsx`:

```tsx
import React from 'react';
import { labAdvice, labGuidance } from '../src/domain/labs';
import { useSettings } from '../src/i18n/settings';
import { Body, Card, H1, Muted, Screen } from '../src/ui/components';

export default function Labs() {
  const { t } = useSettings();
  return (
    <Screen>
      <H1>{t('findLab')}</H1>
      <Muted>{labAdvice}</Muted>
      {labGuidance.map((c) => (
        <Card key={c.city}>
          <Body style={{ fontWeight: '700' }}>{c.city}</Body>
          {c.places.map((p) => (
            <Body key={p}>{`• ${p}`}</Body>
          ))}
        </Card>
      ))}
    </Screen>
  );
}
```

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add -A && git commit -m "feat(results): result screen with Pidgin toggle and lab guidance"
```

---

### Task 12: Couple check (show QR, scan, summary)

**Files:**
- Create: `app/couple/index.tsx`, `app/couple/scan.tsx`, `app/couple/summary.tsx`

**Interfaces:**
- Consumes: `listRecords`, `encodePayload`, `decodePayload`, `coupleSummary`, `explainCouple`, `offspringRisk` output.
- Produces: route `/couple/summary?data=<encoded payload>` shown after a successful scan.

- [ ] **Step 1: My QR**

`app/couple/index.tsx`:

```tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { encodePayload } from '../../src/couple/payload';
import type { TestRecord } from '../../src/domain/types';
import { useSettings } from '../../src/i18n/settings';
import { listRecords } from '../../src/storage/records';
import { Body, Card, H1, Muted, PrimaryButton, Screen } from '../../src/ui/components';

export default function CoupleHome() {
  const router = useRouter();
  const { t } = useSettings();
  const [rec, setRec] = useState<TestRecord | undefined | null>(null);

  useEffect(() => {
    listRecords().then((r) => setRec(r[0]));
  }, []);

  if (rec === null) return <Screen><Muted>Loading…</Muted></Screen>;
  if (!rec)
    return (
      <Screen>
        <H1>{t('checkCompat')}</H1>
        <Body>Complete your own test first, then you can share your QR with your partner.</Body>
        <PrimaryButton label={t('startTest')} onPress={() => router.push('/test/prepare')} />
      </Screen>
    );

  const value = encodePayload({ genotype: rec.genotype, bloodGroup: rec.bloodGroup });
  return (
    <Screen>
      <H1>{t('checkCompat')}</H1>
      <Muted>Your QR shares only your genotype and blood group. No name, phone or photo.</Muted>
      <Card style={{ alignItems: 'center' }}>
        <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12 }}>
          <QRCode value={value} size={220} />
        </View>
      </Card>
      <PrimaryButton label="Scan my partner's QR" onPress={() => router.push('/couple/scan')} />
    </Screen>
  );
}
```

- [ ] **Step 2: Scan**

`app/couple/scan.tsx`:

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { decodePayload } from '../../src/couple/payload';
import { Body, H1, Muted, PrimaryButton, Screen } from '../../src/ui/components';

export default function Scan() {
  const router = useRouter();
  const [perm, requestPerm] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  if (!perm) return <Screen><Muted>Checking camera…</Muted></Screen>;
  if (!perm.granted)
    return (
      <Screen>
        <H1>Camera needed</H1>
        <Body>Allow the camera to scan your partner's QR.</Body>
        <PrimaryButton label="Allow camera" onPress={() => requestPerm()} />
      </Screen>
    );

  return (
    <Screen scroll={false}>
      <H1>Scan partner's QR</H1>
      <View style={{ height: 380, borderRadius: 16, overflow: 'hidden' }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => {
            if (handled.current) return;
            if (decodePayload(data)) {
              handled.current = true;
              router.replace({ pathname: '/couple/summary', params: { data } });
            } else {
              setError('That QR is not from Kinfolk Check NG.');
            }
          }}
        />
      </View>
      {error && <Body>{error}</Body>}
    </Screen>
  );
}
```

- [ ] **Step 3: Summary**

`app/couple/summary.tsx`:

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { decodePayload } from '../../src/couple/payload';
import { coupleSummary } from '../../src/domain/couple';
import { explainCouple, formatBloodGroup } from '../../src/domain/explanations';
import type { TestRecord } from '../../src/domain/types';
import { useSettings } from '../../src/i18n/settings';
import { listRecords } from '../../src/storage/records';
import { Banner, Body, Card, H1, Muted, PrimaryButton, Screen } from '../../src/ui/components';

export default function Summary() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();
  const { lang, t } = useSettings();
  const [mine, setMine] = useState<TestRecord | undefined | null>(null);

  useEffect(() => {
    listRecords().then((r) => setMine(r[0]));
  }, []);

  const partner = data ? decodePayload(data) : null;
  if (mine === null) return <Screen><Muted>Loading…</Muted></Screen>;
  if (!mine || !partner)
    return (
      <Screen>
        <Body>We could not compare. Make sure you have your own result and scanned a valid QR.</Body>
        <PrimaryButton label="Back" onPress={() => router.replace('/couple')} />
      </Screen>
    );

  const s = coupleSummary({ genotype: mine.genotype, bloodGroup: mine.bloodGroup }, partner);
  return (
    <Screen>
      <H1>{t('checkCompat')}</H1>
      <Card>
        <Body>{`You: ${mine.genotype}, ${formatBloodGroup(mine.bloodGroup)}`}</Body>
        <Body>{`Partner: ${partner.genotype}, ${formatBloodGroup(partner.bloodGroup)}`}</Body>
      </Card>
      <Banner tone={s.level === 'low' ? 'success' : 'warning'}>
        <Body>{explainCouple(s.level, s.rh, lang)}</Body>
      </Banner>
      <Card>
        <Body style={{ fontWeight: '700' }}>Chance for each child</Body>
        {Object.entries(s.risk).map(([g, p]) => (
          <Body key={g}>{`${g}: ${Math.round((p as number) * 100)}%`}</Body>
        ))}
      </Card>
      <Muted>This is a screening, not a diagnosis. Please speak to a genetic counsellor or doctor.</Muted>
    </Screen>
  );
}
```

- [ ] **Step 4: Verify and commit**

Run: `npx tsc --noEmit`
Expected: no errors. Manual (two phones or phone + screen): Show QR on one device, scan from the other, check the summary.

```bash
git add -A && git commit -m "feat(couple): QR share, scan and compatibility summary"
```

---

### Task 13: History, settings and two-step delete-all

**Files:**
- Create: `app/history.tsx`, `app/settings.tsx`, `app/delete-all.tsx`

**Interfaces:**
- Consumes: `listRecords`, `deleteAllData`, `photoStore`, `useSettings`.

- [ ] **Step 1: History**

`app/history.tsx`:

```tsx
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, Pressable } from 'react-native';
import { formatBloodGroup } from '../src/domain/explanations';
import type { TestRecord } from '../src/domain/types';
import { useSettings } from '../src/i18n/settings';
import { listRecords } from '../src/storage/records';
import { Body, Card, Muted, Screen } from '../src/ui/components';

export default function History() {
  const router = useRouter();
  const { t } = useSettings();
  const [items, setItems] = useState<TestRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      listRecords().then(setItems);
    }, []),
  );

  return (
    <Screen>
      {items.length === 0 && <Muted>{t('noResults')}</Muted>}
      {items.map((r) => (
        <Pressable key={r.id} onPress={() => router.push(`/result/${r.id}`)}>
          <Card>
            <Muted>{new Date(r.createdAt).toDateString()}</Muted>
            <Body>{`${r.genotype} · ${formatBloodGroup(r.bloodGroup)} · malaria ${r.malaria}`}</Body>
            {r.photos.genotype && (
              <Image source={{ uri: r.photos.genotype }} style={{ height: 120, borderRadius: 8 }} resizeMode="cover" />
            )}
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
```

- [ ] **Step 2: Settings**

`app/settings.tsx`:

```tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSettings } from '../src/i18n/settings';
import { Body, Card, Chip, H1, Muted, PrimaryButton, Screen } from '../src/ui/components';

export default function Settings() {
  const router = useRouter();
  const { lang, setLang, t } = useSettings();
  return (
    <Screen>
      <H1>{t('settings')}</H1>
      <Card>
        <Body style={{ fontWeight: '700' }}>{t('language')}</Body>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="English" selected={lang === 'en'} onPress={() => setLang('en')} />
          <Chip label="Pidgin" selected={lang === 'pcm'} onPress={() => setLang('pcm')} />
        </View>
        <Muted>Medical terms stay in English. Explanations change language.</Muted>
      </Card>
      <PrimaryButton label={t('deleteAll')} onPress={() => router.push('/delete-all')} />
    </Screen>
  );
}
```

- [ ] **Step 3: Delete-all confirmation (second screen)**

`app/delete-all.tsx`:

```tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useSettings } from '../src/i18n/settings';
import { photoStore } from '../src/storage/photos';
import { deleteAllData } from '../src/storage/records';
import { Banner, Body, H1, Muted, PrimaryButton, Screen, SecondaryButton } from '../src/ui/components';

export default function DeleteAll() {
  const router = useRouter();
  const { t } = useSettings();
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'failed'>('idle');

  async function run() {
    setStatus('working');
    try {
      const { recordsLeft, photosLeft } = await deleteAllData(photoStore);
      setStatus(recordsLeft === 0 && photosLeft === 0 ? 'done' : 'failed');
    } catch {
      setStatus('failed');
    }
  }

  if (status === 'done')
    return (
      <Screen>
        <H1>Deleted</H1>
        <Body>All results and kit photos were removed from this phone.</Body>
        <PrimaryButton label="Back to start" onPress={() => router.replace('/onboarding')} />
      </Screen>
    );

  return (
    <Screen>
      <H1>{t('areYouSure')}</H1>
      <Banner tone="danger">
        <Body>{t('deleteWarn')}</Body>
      </Banner>
      {status === 'failed' && <Muted>Something was not deleted. Please try again.</Muted>}
      <PrimaryButton label={t('yesDelete')} disabled={status === 'working'} onPress={run} />
      <SecondaryButton label={t('cancel')} onPress={() => router.back()} />
    </Screen>
  );
}
```

- [ ] **Step 4: Verify and commit**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; all tests PASS. Manual: save a result with photos, run delete-all, confirm History is empty and the app returns to onboarding.

```bash
git add -A && git commit -m "feat(app): history, settings and two-step verified delete-all"
```

---

### Task 14: OpenCV on-device reader (dev build)

**Files:**
- Create: `src/vision/measure.ts`, `src/vision/opencv.ts`
- Modify: `src/vision/index.ts`, `app.json` (plugins), `package.json`
- Test: `src/vision/__tests__/opencv.test.ts`

**Interfaces:**
- Consumes: `interpretMeasurements`, `TestDefinition`, `Rect`.
- Produces: `measureDarkness(photoUri: string, rect: Rect): Promise<number>` (0..1) in `measure.ts`; `createOpenCvReader(measure = measureDarkness): VisionReader` in `opencv.ts`.

- [ ] **Step 1: Install and configure (needs a dev build, not Expo Go)**

```bash
npm install react-native-fast-opencv react-native-worklets-core
npx expo install expo-dev-client
```
Follow the package README for the current required Expo config plugin and Babel plugin entries (worklets) and add them to `app.json` and `babel.config.js`. Then build: `npx expo prebuild` and `npx expo run:android`.
Expected: the app launches on a device/emulator as a dev build.

- [ ] **Step 2: Write failing test for the reader (measurement function injected)**

`src/vision/__tests__/opencv.test.ts`:

```ts
import { createOpenCvReader } from '../opencv';
import { defaultKitProfile } from '../../kit/profile';

const g = defaultKitProfile.tests.genotype;

test('maps injected darkness values to a pattern', async () => {
  const values: Record<string, number> = { A: 0.8, S: 0.8, C: 0.02 };
  const reader = createOpenCvReader(async (_uri, rect) => {
    if (g.control && rect === g.control) return 0.9;
    const band = g.bands.find((b) => b.rect === rect);
    return band ? values[band.id] : 0;
  });
  const r = await reader.readWindow('file://x.jpg', g);
  expect(r.pattern).toBe('AS');
});

test('measurement failure falls back to unmeasurable (manual entry)', async () => {
  const reader = createOpenCvReader(async () => {
    throw new Error('native module missing');
  });
  const r = await reader.readWindow('file://x.jpg', g);
  expect(r).toEqual({ pattern: null, confidence: 0, reason: 'unmeasurable' });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx jest src/vision/__tests__/opencv.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement the reader**

`src/vision/opencv.ts`:

```ts
import type { TestDefinition, Rect } from '../kit/profile';
import { interpretMeasurements } from './interpret';
import { measureDarkness } from './measure';
import type { ReadResult, VisionReader } from './types';

export type MeasureFn = (photoUri: string, rect: Rect) => Promise<number>;

export function createOpenCvReader(measure: MeasureFn = measureDarkness): VisionReader {
  return {
    async readWindow(photoUri: string, def: TestDefinition): Promise<ReadResult> {
      try {
        const control = def.control ? await measure(photoUri, def.control) : null;
        const bands: Record<string, number> = {};
        for (const b of def.bands) bands[b.id] = await measure(photoUri, b.rect);
        return interpretMeasurements(def, { control, bands });
      } catch {
        return { pattern: null, confidence: 0, reason: 'unmeasurable' };
      }
    },
  };
}
```

- [ ] **Step 5: Implement the native measurement (the only OpenCV-specific code)**

`src/vision/measure.ts`:

```ts
import * as FileSystem from 'expo-file-system/legacy';
import { ColorConversionCodes, DataTypes, ObjectType, OpenCV } from 'react-native-fast-opencv';
import type { Rect } from '../kit/profile';

/**
 * Mean darkness (0 = white, 1 = black) of a normalised rectangle in the photo.
 * Pipeline: decode -> grayscale -> crop rect -> mean intensity -> invert.
 */
export async function measureDarkness(photoUri: string, rect: Rect): Promise<number> {
  const base64 = await FileSystem.readAsStringAsync(photoUri, { encoding: 'base64' });
  const src = OpenCV.base64ToMat(base64);
  const info = OpenCV.toJSValue(src);
  const gray = OpenCV.createObject(ObjectType.Mat, info.rows, info.cols, DataTypes.CV_8U);
  OpenCV.invoke('cvtColor', src, gray, ColorConversionCodes.COLOR_BGR2GRAY);

  const roi = OpenCV.createObject(
    ObjectType.Rect,
    Math.round(rect.x * info.cols),
    Math.round(rect.y * info.rows),
    Math.max(1, Math.round(rect.w * info.cols)),
    Math.max(1, Math.round(rect.h * info.rows)),
  );
  const cropped = OpenCV.invoke('crop', gray, roi);
  const mean = OpenCV.invoke('mean', cropped);
  const value = OpenCV.toJSValue(mean) as { a?: number; vals?: number[] };
  const intensity = value.vals?.[0] ?? value.a ?? 255;

  OpenCV.clearBuffers();
  return Math.min(1, Math.max(0, 1 - intensity / 255));
}
```

Note for the implementer: the call names above follow `react-native-fast-opencv`'s documented `OpenCV.invoke` pattern. Check the installed version's typings in `node_modules/react-native-fast-opencv` (and its README) and adjust ONLY this file if a function name or shape differs (for example the exact crop/mean calls). `createOpenCvReader` and `interpretMeasurements` are covered by tests and must not change.

- [ ] **Step 6: Switch the app to the OpenCV reader**

`src/vision/index.ts`:

```ts
import { createOpenCvReader } from './opencv';
import type { VisionReader } from './types';

export const visionReader: VisionReader = createOpenCvReader();
export type { ReadResult, VisionReader } from './types';
```

Note: the jest tests do not import `index.ts`, so the native module is not loaded in tests.

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 8: Device check with a real or printed kit**

Run: `npx expo run:android`. In the wizard, photograph a kit (or a printed mock with dark bars in the band positions). Expected: Review screen shows "Assisted reading: <pattern>" when confident, otherwise "Could not read this clearly", and the user can always change the selection. If every reading is "Could not read", the band rectangles in `src/kit/profile.ts` do not match your kit: adjust them (and thresholds) using real photos. This tuning is expected work, not a bug.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(vision): on-device OpenCV assisted reader"
```

---

### Task 15: Final verification and release checklist

**Files:**
- Create: `README.md`

- [ ] **Step 1: Run the full automated checks**

Run: `npm test && npx tsc --noEmit`
Expected: all tests PASS, no type errors.

- [ ] **Step 2: Naming sweep**

Run: `grep -rnE "Kinfolk Check([^ ]| [^N]|$)" app src app.json README.md`
Expected: no matches (the name must always read "Kinfolk Check NG").

- [ ] **Step 3: Copy sweep**

Run: `grep -rniE "AI result|Automatic result|automatic reading" app src`
Expected: no matches.

- [ ] **Step 4: Write README**

`README.md` describing: what the app is, `npm install`, `npm test`, `npx expo run:android` (dev build required for OpenCV), the KitProfile tuning note, and the open items below.

- [ ] **Step 5: Manual acceptance on a device**

Walk through: onboarding → Pidgin toggle → test with an SS result (lab acknowledgement required, "Find a lab near me" works) → result in both languages → QR share/scan between two devices (summary correct for AS + AS = 25% SS) → delete-all (two screens, history empty, photos gone).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "docs: README and release checklist"
```

**Open items before any public release (from the spec):** real kit photos to tune `KitProfile` and confirm wait time and three-photo vs one-photo mode; native-speaker review of Pidgin copy; NAFDAC/medical-device review; trademark check on "Kinfolk Check NG".
