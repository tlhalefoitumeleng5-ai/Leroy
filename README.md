# Leroy AI v1.1.0

Production Android AI app by **Leroy AI Solutions**  
Founder: **Tlhalefo Leroy John Itumeleng**

## Stack

Flutter · Clean Architecture · Riverpod · Firebase Auth · Firestore · Storage · Cloud Functions · FCM · Material 3

## Features

- Real Firebase Authentication (sign up, sign in, forgot password, email verification, password change, logout)
- Home dashboard (Image, Video, Chat, Assistant, Templates, History, Subscription, Settings)
- AI Chat with voice input/output, copy, regenerate (via `leroyChat` Cloud Function)
- AI Image Generator with Storage save/share/download history
- AI Video Generator (via `leroyGenerateVideo`)
- Templates & History from Firestore
- Subscriptions: Free / Starter / Pro / Business with Stripe + PayFast checkout
- Push notifications, dark/light mode, privacy/terms links

## Configure Firebase

1. Create a Firebase project
2. Enable Auth (Email/Password), Firestore, Storage, Functions, Messaging
3. Replace `android/app/google-services.json`
4. Run `flutterfire configure`
5. Deploy functions:

```bash
cd functions
npm install
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set PAYFAST_MERCHANT_ID
firebase functions:secrets:set PAYFAST_MERCHANT_KEY
npm run deploy
```

6. Seed `prompts` and `templates` collections in Firestore

## Run

```bash
flutter pub get
flutter run
flutter build apk --release
```

There is **no demo mode**. The app requires a configured Firebase project.
