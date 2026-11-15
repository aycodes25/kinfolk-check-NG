# Kinfolk Check NG: Project Context

Summary of the earlier Claude workspace (`C:\Users\Hp`), written 2026-11-15 so the transcripts can be deleted safely.

## What it is
An Android app (React Native, Expo SDK 58, TypeScript, expo-router) that goes with a home kit testing **genotype, blood group and malaria** in one go. It explains results in plain language and lets couples check compatibility.

Market gap: Eloheh covers genotype only, SYNLAB needs a nurse and costs more, and Instagram labs work by hand. Nobody combines all three at home.

## Decisions
- **Name:** Kinfolk Check NG (avoids clashing with Kinfolk magazine/Kinfolk Tech).
- **Reading:** OpenCV only *suggests*; the user always confirms. UI label is "Assisted reading", never "AI result" or "Automatic result".
- **Kit:** three separate test definitions (genotype, blood group, malaria) in `KitProfile`, with three-photo capture by default. Band positions and thresholds are untuned placeholders.
- **Data:** on-device only. Android backup is off and the app asks for no microphone permission.
- **Language:** English / Pidgin toggle. Medical terms stay in English.
- **Timer:** 10 minutes, to be confirmed against the real kit instructions. "Skip wait" exists only in dev builds (`__DEV__`, 5 taps on the version number).
- **Palette:** teal `#0F766E` and coral `#F97362`.

## Safety rules
- Every result is labelled screening, not diagnosis.
- SS, SC, positive malaria, invalid and "Unclear" results need the "confirm at a lab" tick. The tick resets whenever the result changes.
- "Unclear — retake or go to lab" is a valid result for genotype and blood group. It never produces a QR code or a couple comparison.
- The QR carries only genotype, blood group and Rh. No name, phone, photo or date of birth.
- Couple banner colours:
  - Green: AA+AA only.
  - Amber: "Lower risk — still confirm", with no chance of an SS or SC child.
  - Red: a chance of an SS or SC child.
- Delete-all removes photos first, then records, behind a second confirmation. It also clears the camera cache.
- Screenshots are blocked on Home, Results, History, QR and the couple summary. Android shows a black screen. iOS can only block recording.
- Photos are shrunk to 1200px wide right after capture.
- Before any public release, NAFDAC or medical-device clearance is needed.

## Status
- All 15 plan tasks are built, plus the review fix rounds. **150 tests pass**, `tsc` is clean and the Android export builds.
- Last known commits (in the old `C:\Users\Hp\KinfolkCheck\.git`): `7d73236`, `d297d50`, `47f87b1`.
- **Not yet run on a phone with OpenCV.** Expo Go lacks the native module (`FastOpencv`), so the app skips OpenCV there and you pick results by hand. OpenCV needs a dev build, which needs Android Studio, the Android SDK and the JDK, then `npx expo prebuild` and a run on a device.
- A calibration function is built. Given measured numbers and the true result for each photo, it computes thresholds. It refuses to report ok on overlap, on a gap under 0.15, or on wrong read-backs. It never edits the kit profile.

## Next steps
1. Buy HemoTypeSC, EldonCard and a malaria RDT.
2. Send 3 full-size photos (not WhatsApp-compressed) with a coin for scale, plus the kit model and the true result for each. Include one clear positive, one clear negative and one blurry or poorly lit photo. If possible, include a malaria cassette with no control line.
3. Add the kit profile, place the band positions, run calibration, then mark the profile tuned.
4. Install the Android toolchain, make a dev build and test OpenCV on a device.
5. Check on a phone that delete-all clears the camera cache.

## Where things are
- Spec: `docs/superpowers/specs/2026-11-15-kinfolk-check-design.md`
- Plan: `docs/superpowers/plans/2026-11-15-kinfolk-check-ng.md`
- Per-task reports: `.superpowers/sdd/`
- Run steps: `npm install`, `npm test`, `npx expo start` (add `--tunnel` if the phone can't connect), then scan the QR in Expo Go.
