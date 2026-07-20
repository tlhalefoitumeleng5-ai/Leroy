# Agent notes

## Cursor Cloud specific instructions

This is a **Flutter** Android app (`leroy_ai`), not React Native.

- Bootstrap: `.cursor/install.sh` (via `.cursor/environment.json`) installs Flutter + Android SDK and runs `flutter pub get`.
- Ignore stray root `package.json` / `node_modules` if present — they are not the app.
- Useful commands:
  - `flutter pub get`
  - `flutter analyze`
  - `flutter test`
  - `flutter build apk --debug` (smoke build)
  - `flutter build apk --release` (release APK)
- Demo mode works without real Firebase keys (see README).
