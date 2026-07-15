# Leroy AI

Premium Flutter Android app for AI chat, image generation, and prompt workflows.

**Version:** 1.0.0  
**Architecture:** Clean Architecture + Riverpod + Material 3  
**Backend:** Firebase Auth + Cloud Firestore (demo mode enabled by default)

## Features (v1.0)

1. Splash Screen  
2. Onboarding  
3. Login  
4. Registration  
5. Forgot Password  
6. Home Dashboard  
7. AI Chat  
8. AI Image Generator  
9. Prompt Library  
10. User Profile  
11. Subscription Plans  
12. Settings (Light / Dark / System)

## Project structure

```
lib/
  main.dart
  app.dart
  firebase_options.dart
  core/           # theme, routing, errors, widgets, DI
  features/       # feature-first Clean Architecture
    auth/
    splash/
    onboarding/
    home/
    chat/
    image_generator/
    prompt_library/
    profile/
    subscription/
    settings/
    shell/
  shared/
```

Each feature follows:

```
feature/
  data/       # datasources, models, repository implementations
  domain/     # entities, repository contracts, use cases
  presentation/  # Riverpod providers, screens, widgets
```

## Getting started

### Prerequisites

- Flutter 3.32+ / Dart 3.8+
- Android Studio / Android SDK (API 23+)
- (Optional) Firebase project for production auth & Firestore

### Install & run

```bash
flutter pub get
flutter run
```

Demo mode is **on** by default (`AppConstants.useDemoBackend = true`).  
You can sign in with any email + password (6+ chars), register, or continue as guest — no Firebase keys required.

### Enable Firebase (production)

1. Create a Firebase project and enable **Email/Password** auth + **Cloud Firestore**.
2. Install FlutterFire CLI and configure:

```bash
dart pub global activate flutterfire_cli
flutterfire configure
```

3. Add `google-services.json` under `android/app/`.
4. Deploy rules:

```bash
firebase deploy --only firestore:rules
```

5. Set `AppConstants.useDemoBackend` to `false` in  
   `lib/core/constants/app_constants.dart`.

6. Wire your AI provider (OpenAI / Vertex / Cloud Functions) into:
   - `lib/features/chat/data/datasources/chat_remote_datasource.dart`
   - `lib/features/image_generator/` production datasource
   - `lib/core/network/api_client.dart`

## Design system

- **Brand:** deep teal + luminous aqua  
- **Type:** Syne (display) + Outfit (body) via Google Fonts  
- **UI:** Material 3, light & dark themes, motion via `flutter_animate`

## State management

Riverpod providers live next to each feature.  
Global DI overrides (e.g. `SharedPreferences`) are applied in `main.dart`.

## Testing

```bash
flutter test
flutter analyze
```

## License

Proprietary — Leroy AI.
