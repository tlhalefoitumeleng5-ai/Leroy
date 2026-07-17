/// Application-wide constants for Leroy AI v1.1.
class AppConstants {
  AppConstants._();

  static const String appName = 'Leroy AI';
  static const String companyName = 'Leroy AI Solutions';
  static const String founderName = 'Tlhalefo Leroy John Itumeleng';
  static const String appTagline = 'Your intelligent creative companion';
  static const String appVersion = '1.1.0';

  static const String keyOnboardingComplete = 'onboarding_complete';
  static const String keyThemeMode = 'theme_mode';
  static const String keyNotificationsEnabled = 'notifications_enabled';
  static const String keyLanguageCode = 'language_code';

  static const String usersCollection = 'users';
  static const String chatsCollection = 'chats';
  static const String messagesCollection = 'messages';
  static const String imagesCollection = 'generated_images';
  static const String videosCollection = 'generated_videos';
  static const String templatesCollection = 'templates';
  static const String promptsCollection = 'prompts';
  static const String historyCollection = 'history';
  static const String subscriptionsCollection = 'subscriptions';
  static const String plansCollection = 'plans';

  static const String fnSeedCatalog = 'leroySeedCatalog';

  static const String privacyPolicyUrl =
      'https://leroyai.solutions/privacy';
  static const String termsOfServiceUrl =
      'https://leroyai.solutions/terms';
  static const String supportEmail = 'support@leroyai.solutions';

  /// Cloud Function names (deploy with /functions).
  static const String fnChat = 'leroyChat';
  static const String fnImage = 'leroyGenerateImage';
  static const String fnVideo = 'leroyGenerateVideo';
  static const String fnCheckout = 'leroyCreateCheckout';

  static const int maxMessageLength = 4000;
  static const int maxPromptLength = 2000;

  static const Duration splashDuration = Duration(milliseconds: 2000);
}
