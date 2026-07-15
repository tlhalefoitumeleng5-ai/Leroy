/// Global app constants for Leroy AI.
abstract final class AppConstants {
  static const String appName = 'Leroy AI';
  static const String appTagline = 'Think. Create. Elevate.';
  static const String appVersion = '1.0.0';

  static const String usersCollection = 'users';
  static const String chatsCollection = 'chats';
  static const String messagesCollection = 'messages';
  static const String imagesCollection = 'generated_images';
  static const String promptsCollection = 'prompts';
  static const String subscriptionsCollection = 'subscriptions';

  static const String prefOnboardingDone = 'onboarding_done';
  static const String prefThemeMode = 'theme_mode';
  static const String prefDemoMode = 'demo_mode';

  /// When true (default until Firebase is configured), auth & AI run locally.
  static const bool useDemoBackend = true;

  static const int freeDailyChatLimit = 20;
  static const int freeDailyImageLimit = 3;
  static const int proDailyChatLimit = 500;
  static const int proDailyImageLimit = 50;

  static const Duration splashDuration = Duration(milliseconds: 2200);
  static const Duration animationFast = Duration(milliseconds: 200);
  static const Duration animationNormal = Duration(milliseconds: 350);
  static const Duration animationSlow = Duration(milliseconds: 600);
}
