/// Application-wide constants for Leroy AI.
class AppConstants {
  AppConstants._();

  static const String appName = 'Leroy AI';
  static const String appTagline = 'Your intelligent creative companion';
  static const String appVersion = '1.0.0';

  // Storage keys
  static const String keyOnboardingComplete = 'onboarding_complete';
  static const String keyThemeMode = 'theme_mode';
  static const String keyDemoMode = 'demo_mode';

  // Firestore collections
  static const String usersCollection = 'users';
  static const String chatsCollection = 'chats';
  static const String messagesCollection = 'messages';
  static const String imagesCollection = 'generated_images';
  static const String promptsCollection = 'prompts';
  static const String subscriptionsCollection = 'subscriptions';

  // Limits
  static const int freeChatMessagesPerDay = 20;
  static const int freeImagesPerDay = 3;
  static const int maxMessageLength = 4000;
  static const int maxPromptLength = 1000;

  // Animation
  static const Duration splashDuration = Duration(milliseconds: 2200);
  static const Duration pageTransition = Duration(milliseconds: 320);
  static const Duration shortAnimation = Duration(milliseconds: 200);
}
