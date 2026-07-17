# Leroy AI v1.1.0

Production Android AI app by **Leroy AI Solutions**  
Founder: **Tlhalefo Leroy John Itumeleng**

## Stack

Flutter · Clean Architecture · Riverpod · Firebase Auth · Firestore · Storage · Cloud Functions · FCM · Stripe · PayFast · Material 3

## Features

- Firebase Authentication (sign up, sign in, forgot password, email verification, password change, logout)
- Home dashboard (Image, Video, Chat, Assistant, Templates, Prompts, History, Settings)
- AI Chat with voice input/output, copy, regenerate, swipe-to-delete
- AI Image Generator with style/size, gallery save, share, history
- AI Video Generator (fal.ai via Cloud Functions) with duration/quality/voice/music
- Templates & Prompt Library from Firestore (per-user favorites)
- History with search, download, delete
- Subscriptions: Free / Starter / Pro / Business with Stripe + PayFast + webhooks
- Push notifications with FCM token persistence
- Dark / light / system theme, language, privacy, terms, about

There is **no demo mode**. The app requires a configured Firebase project.

## Configure Firebase

1. Create a Firebase project (Auth Email/Password, Firestore, Storage, Functions, Messaging)
2. Replace `android/app/google-services.json`
3. Run `flutterfire configure` to refresh `lib/firebase_options.dart`
4. Update `.firebaserc` with your project id
5. Deploy:

```bash
cd functions && npm install
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set FAL_KEY
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set PAYFAST_MERCHANT_ID
firebase functions:secrets:set PAYFAST_MERCHANT_KEY
firebase functions:secrets:set PAYFAST_PASSPHRASE
firebase deploy
```

6. From a signed-in client (or Firebase console), call `leroySeedCatalog` once to seed plans, prompts, and templates.

7. Point Stripe webhook to `leroyStripeWebhook` and PayFast ITN to `leroyPayfastItn`.

## Run & build

```bash
flutter pub get
flutter analyze
flutter test
flutter build apk --release
```

## Architecture

```
lib/
├── main.dart / app.dart
├── core/          # theme, router, services, utils
├── shared/        # DI providers, shell
└── features/      # auth, chat, image, video, history, …
functions/         # AI + billing Cloud Functions
```

## License

Proprietary — Leroy AI.
