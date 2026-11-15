# Kinfolk Check NG

Kinfolk Check NG is an Android-focused Expo / React Native app that helps people in Nigeria use an at-home test kit to learn their sickle-cell genotype, blood group and Rh factor, and to check malaria. It also lets two partners compare results for a couple compatibility check. It is a screening aid, not a diagnosis. The app offers an assisted reading of the photographed kit, and the user always reviews and confirms the result before it is saved. Results can be shown in English or Pidgin.

## Features

- Guided test flow: prepare kit, wait timer, photograph kit, review and confirm results.
- Assisted strip reading (OpenCV) with manual selection as the fallback.
- Result screens in English and Pidgin, with a safety acknowledgement and a "Find a lab near me" list for results that need confirmation.
- Couple compatibility check by QR share and scan.
- History of past tests.
- "Delete my data" (two-step) in Settings.

## Privacy

- Everything stays on the device. There is no account and no server.
- The couple QR code carries only genotype, blood group, Rh and a version number.
- Delete-all removes saved records, saved photos and the camera cache.

## Running it

```
npm install
npm test
npx expo start
```

The OpenCV strip reader (`react-native-fast-opencv`) needs a custom dev build, which needs an Android SDK and a JDK:

```
npx expo prebuild
npx expo run:android
```

Without a dev build, the app falls back to manual selection. The Expo Go app works for everything except automatic strip suggestions.

## KitProfile tuning

`src/kit/profile.ts` holds the band rectangles and thresholds. They are untuned placeholders, and the wait time is 10 minutes until the real kit is confirmed. The OpenCV channel order and EXIF orientation assumptions in `src/vision/` must be verified on a device.

## Developer mode

Tap the version text on the Settings screen 5 times. This only works in dev builds (`__DEV__`), and it shows a "Skip wait (developer)" button on the timer screen. It is never available in release builds.

## Project structure

```
app/          expo-router screens (home, test/*, couple/*, result/[id], history, settings, labs, delete-all, onboarding)
src/domain/   genotype, couple, safety rules, explanations, labs
src/kit/      KitProfile and wait timer
src/vision/   image measurement and strip interpretation (OpenCV + stub)
src/storage/  records and photo storage
src/couple/   QR payload
src/i18n/     strings (English, Pidgin) and settings
src/wizard/   test-flow state and safety gate
src/dev/      developer mode
src/ui/       theme and shared components
docs/         specs and plans
```

## Manual acceptance checklist (needs a device)

- [ ] Onboarding completes and is not shown again.
- [ ] Pidgin toggle switches the screens.
- [ ] Run a test with an SS result: the lab acknowledgement is required and "Find a lab near me" works.
- [ ] The result reads correctly in both languages.
- [ ] QR share and scan between two devices: AS + AS shows 25% chance of SS.
- [ ] Camera permission, photo capture and OpenCV suggestions work on a real kit.
- [ ] Delete-all (two screens): history is empty and photos are gone.
- [ ] Developer mode is not available in a release build.

## Open items before any public release

- Real kit photos to tune `KitProfile`.
- Confirm the exact wait time and three-photo vs one-photo mode.
- Native-speaker review of the Pidgin copy.
- NAFDAC / medical-device regulatory review.
- Trademark check on "Kinfolk Check NG".
- Device testing of the camera, QR scan and OpenCV.
- Wording review of the couple-check "no chance" green banner.
