# Kinfolk Check NG — Design Spec

Date: 2026-11-15

**Naming:** the product is **Kinfolk Check NG** everywhere: app title, Play Store name, code identifiers and UI copy. Never use "Kinfolk Check" alone, to avoid confusion with existing "Kinfolk" brands. The folder `C:\Users\Hp\KinfolkCheck` stays as is and separate from OrderProcessingSystem.

## 1. Purpose
A React Native (Expo, TypeScript) app that guides a person through a home screening kit that tests **genotype, blood group and malaria** in one go, explains the results in plain language, and lets couples check compatibility. Target users: couples, NYSC, pre-marital screening in Nigeria.

Differentiator vs. existing products (Eloheh = genotype only; SYNLAB = lab/nurse; Instagram labs = manual): one kit, three results, ~10 minutes, at home, with a couple check and Pidgin explanations.

## 2. Scope (v1)
In: onboarding + disclaimer, home, test wizard, camera capture, OpenCV-assisted reading with user confirmation, results with plain-language explanations (English / Pidgin toggle), couple check via QR, on-device history, delete-all-data.
Out: accounts, cloud sync, backend, payments, kit ordering, fully automatic (unconfirmed) results.

## 3. Screens and flow
1. **Onboarding (3 slides):** what the kit tests; privacy (data stays on phone); medical disclaimer (accept once).
2. **Home:** greeting, "Start a test" CTA, latest result cards (Genotype / Blood Group / Malaria), "Check compatibility" shortcut.
3. **Test wizard:** Prepare (checklist) → Test (10-minute timer, step instructions) → Capture (camera with framing guide, one capture step per test window) → Review (assisted suggestion; user confirms or corrects per test using illustrated pattern examples).
4. **Result:** plain-language explanation per test; always labelled "screening, not diagnosis".
5. **Couple check:** each partner shows a QR; the other scans. Shows offspring risk (e.g. AS+AS = 25% SS per child), Rh incompatibility flag, and a counselling nudge.
6. **History:** past tests with kit photos; delete everything (see §7).
7. **Settings:** language (English / Pidgin), delete all data, disclaimer.

**Timer note:** the timer is 10 minutes per the assumed kit instructions. The exact wait time will be confirmed once we have the real kit, so it lives in the KitProfile, not hard-coded. The UI shows: "Timer is per kit instructions."

## 4. Result reading: assisted, not automatic
- **Principle: OpenCV suggests, user confirms.** Nothing is saved as a final result without user confirmation. SS, SC, positive malaria and invalid results additionally require the "confirm at a lab" screen before saving.
- **Labelling:** everywhere in the UI this is called **"Assisted reading"**. The words "AI result" and "Automatic result" are never used.
- **OpenCV runs on-device** (`react-native-fast-opencv`) on the captured still photo; stills are captured with `expo-camera`. Requires an Expo **dev build** (not Expo Go).
- **Three windows, not one strip.** The kit has three physically different tests: a genotype strip, a blood group card (A/B/D circles) and a malaria cassette. The **KitProfile** therefore defines **three separate test definitions** (`genotype`, `bloodGroup`, `malaria`). Each has its own: capture mode, window positions, control line location, expected colours and thresholds, valid result patterns, and wait time.
- **Capture:** the wizard supports **three separate photos** (one per test) and a single-photo-with-three-windows mode. Which mode applies is a KitProfile setting; we do not assume one strip until we have the real kit photo. v1 ships with three-photo capture as the default.
- Pipeline per test: locate window → perspective-correct → crop → measure control and test-line/circle intensity → map to a pattern with a confidence score.
- Low confidence, missing control line, or glare → fall back to manual pattern selection or prompt a retake with lighting/framing tips.
- Until tuned on real kit photos, the reader is "assisted" and thresholds are placeholders.

Result patterns: Genotype AA/AS/SS/AC/SC; Blood group A/B/AB/O with Rh+/−; Malaria negative/positive/invalid.

## 5. Architecture (isolated units)
- `app/`: Expo Router screens.
- `src/domain/`: pure TS: genotype pairing + risk, Rh compatibility, result explanations (English + Pidgin). Unit tested; the part that must be correct.
- `src/vision/`: OpenCV pipeline behind `readWindow(photo, testDefinition) → {pattern, confidence}`; swappable and mockable.
- `src/kit/`: KitProfile types and the default profile data (three test definitions).
- `src/storage/`: AsyncStorage for records, file system for photos, `deleteAll()` removing both.
- `src/couple/`: QR encode/decode of the minimal payload (versioned).
- `src/i18n/`: English and Pidgin strings; medical terms stay in English.
- `src/ui/`: theme tokens and shared components.

## 6. Visual design
Teal `#0F766E` primary, coral `#F97362` accent/CTA, background `#F7FAF9`, ink `#12312E`; green/amber/red reserved for result status. Rounded cards, large touch targets, one idea per screen, dark mode follows system. Plain, warm language.

**Language:** English / Pidgin toggle for result explanations (and onboarding). Medical terms (genotype names, "carrier", "Rh") stay in English; the explanatory sentences are available in simple Pidgin, e.g. "You be AS. You healthy, but you fit pass am give pikin." Pidgin copy should be reviewed by a native speaker before release.

## 7. Safety and privacy
- Disclaimer on onboarding and every result. No diagnosis claims.
- **QR payload contains ONLY genotype + blood group + Rh** (plus a version number). No name, phone, photo or date of birth.
- **SS, SC, positive malaria and invalid results** show "See a doctor / confirm at a lab" and a **"Find a lab near me"** button. In v1 this opens a static screen listing text guidance and lab names for Abuja and Lagos; real directory/maps can come later.
- **Delete-all** deletes **both** the records in AsyncStorage **and** the photos in file storage, behind a second "Are you sure?" confirmation screen, then verifies nothing remains.
- All data stays on the device.

## 8. Testing
- Unit tests for `domain` (all genotype pairs, Rh cases, both languages present for every explanation key), QR payload round-trip and a check that the payload has no extra fields, and `deleteAll()` removing records and photos.
- Vision module tested against sample photo fixtures through the `readWindow` interface; UI tested with a mocked reader.
- Manual device test for camera, timer and QR scanning.

## 9. Open items
- Real kit photos and exact kit layout (three-photo vs. one-photo) to tune the KitProfile, thresholds and wait time.
- Native-speaker review of Pidgin copy.
- Legal/regulatory review (NAFDAC/medical-device status) before public release.
- Trademark check on "Kinfolk Check NG" before store launch.
