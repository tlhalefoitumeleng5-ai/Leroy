# Leroy AI

Premium Flutter Android app for AI chat, image generation, and prompt management.

**Version:** 1.0.0  
**Stack:** Flutter · Clean Architecture · Riverpod · Firebase Auth · Cloud Firestore · Material 3

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

## Architecture

```
lib/
├── main.dart / app.dart
├── firebase_options.dart
├── core/                 # theme, router, errors, constants, shared widgets
├── shared/providers/     # DI + theme + app config
└── features/
    ├── auth/
    ├── splash/
    ├── onboarding/
    ├── home/
    ├── chat/
    ├── image_generator/
    ├── prompt_library/
    ├── profile/
    ├── subscription/
    └── settings/
```

Each feature follows Clean Architecture:

- **domain** — entities, repository contracts, use cases  
- **data** — models, datasources (Firebase + demo), repository implementations  
- **presentation** — Riverpod providers, screens, widgets  

## Getting started

### Prerequisites

- Flutter 3.32+ (Dart 3.8+)
- Android Studio / SDK (minSdk 23)
- Optional: Firebase project for production auth & Firestore

### Install & run (demo mode)

Demo mode is enabled automatically when Firebase API keys are placeholders.

```bash
flutter pub get
flutter run
```

Demo credentials: any valid email + password (≥ 8 characters).

### Connect Firebase (production)

1. Create a Firebase project and enable **Email/Password** auth.  
2. Create a Firestore database.  
3. Add an Android app with package `com.leroyai.leroy_ai`.  
4. Replace `android/app/google-services.json`.  
5. Run:

```bash
dart pub global activate flutterfire_cli
flutterfire configure
```

6. Toggle **Demo mode** off in Settings (or remove the `REPLACE_` API key).

### Suggested Firestore rules (dev)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Design system

- Material 3 with teal brand accent (`#0D9488`)
- Typography: **Syne** (display) + **DM Sans** (body) via Google Fonts
- Light & dark themes with atmospheric gradients
- Motion via `flutter_animate` on splash, onboarding, and dashboard

## Scripts

```bash
flutter analyze
flutter test
flutter build apk --release
```

## License

Proprietary — Leroy AI.
