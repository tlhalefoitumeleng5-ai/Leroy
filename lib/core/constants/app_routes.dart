/// Route path constants used by go_router.
class AppRoutes {
  AppRoutes._();

  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';

  // Shell tabs
  static const String home = '/home';
  static const String chat = '/chat';
  static const String chatDetail = '/chat/:chatId';
  static const String imageGenerator = '/image-generator';
  static const String promptLibrary = '/prompts';
  static const String profile = '/profile';

  // Stacked routes
  static const String subscription = '/subscription';
  static const String settings = '/settings';
  static const String editProfile = '/profile/edit';
}
