import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/constants/app_routes.dart';
import 'package:leroy_ai/features/assistant/presentation/screens/assistant_screen.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';
import 'package:leroy_ai/features/auth/presentation/screens/change_password_screen.dart';
import 'package:leroy_ai/features/auth/presentation/screens/forgot_password_screen.dart';
import 'package:leroy_ai/features/auth/presentation/screens/login_screen.dart';
import 'package:leroy_ai/features/auth/presentation/screens/register_screen.dart';
import 'package:leroy_ai/features/auth/presentation/screens/verify_email_screen.dart';
import 'package:leroy_ai/features/chat/presentation/screens/chat_detail_screen.dart';
import 'package:leroy_ai/features/chat/presentation/screens/chat_list_screen.dart';
import 'package:leroy_ai/features/history/presentation/screens/history_screen.dart';
import 'package:leroy_ai/features/home/presentation/screens/home_screen.dart';
import 'package:leroy_ai/features/image_generator/presentation/screens/image_generator_screen.dart';
import 'package:leroy_ai/features/onboarding/presentation/screens/onboarding_screen.dart';
import 'package:leroy_ai/features/profile/presentation/screens/edit_profile_screen.dart';
import 'package:leroy_ai/features/profile/presentation/screens/profile_screen.dart';
import 'package:leroy_ai/features/settings/presentation/screens/settings_screen.dart';
import 'package:leroy_ai/features/splash/presentation/screens/splash_screen.dart';
import 'package:leroy_ai/features/subscription/presentation/screens/subscription_screen.dart';
import 'package:leroy_ai/features/templates/presentation/screens/templates_screen.dart';
import 'package:leroy_ai/features/video_generator/presentation/screens/video_generator_screen.dart';
import 'package:leroy_ai/shared/providers/app_config_provider.dart';
import 'package:leroy_ai/shared/widgets/main_shell.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);
  final onboardingDone = ref.watch(onboardingCompleteProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    refreshListenable: _AuthRefresh(ref),
    redirect: (context, state) {
      final loc = state.matchedLocation;
      final isSplash = loc == AppRoutes.splash;
      final isOnboarding = loc == AppRoutes.onboarding;
      final isAuthRoute = loc == AppRoutes.login ||
          loc == AppRoutes.register ||
          loc == AppRoutes.forgotPassword;

      if (isSplash) return null;
      if (!onboardingDone && !isOnboarding) return AppRoutes.onboarding;
      if (onboardingDone && isOnboarding) {
        return auth.isAuthenticated ? AppRoutes.home : AppRoutes.login;
      }
      if (!auth.isAuthenticated && !isAuthRoute && onboardingDone) {
        return AppRoutes.login;
      }
      if (auth.isAuthenticated && isAuthRoute) return AppRoutes.home;
      return null;
    },
    routes: [
      GoRoute(path: AppRoutes.splash, builder: (_, __) => const SplashScreen()),
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (_, __) => const OnboardingScreen(),
      ),
      GoRoute(path: AppRoutes.login, builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        builder: (_, __) => const ForgotPasswordScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.home,
              builder: (_, __) => const HomeScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.chat,
              builder: (_, __) => const ChatListScreen(),
              routes: [
                GoRoute(
                  path: ':chatId',
                  parentNavigatorKey: _rootNavigatorKey,
                  builder: (_, state) => ChatDetailScreen(
                    chatId: state.pathParameters['chatId']!,
                    initialPrompt: state.uri.queryParameters['prompt'],
                  ),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.imageGenerator,
              builder: (_, __) => const ImageGeneratorScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.history,
              builder: (_, __) => const HistoryScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: AppRoutes.profile,
              builder: (_, __) => const ProfileScreen(),
            ),
          ]),
        ],
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.videoGenerator,
        builder: (_, __) => const VideoGeneratorScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.assistant,
        builder: (_, __) => const AssistantScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.templates,
        builder: (_, __) => const TemplatesScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.subscription,
        builder: (_, __) => const SubscriptionScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.settings,
        builder: (_, __) => const SettingsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.verifyEmail,
        builder: (_, __) => const VerifyEmailScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.changePassword,
        builder: (_, __) => const ChangePasswordScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.editProfile,
        builder: (_, __) => const EditProfileScreen(),
      ),
    ],
  );
});

class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(this._ref) {
    _ref.listen(authProvider, (_, __) => notifyListeners());
    _ref.listen(onboardingCompleteProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;
}
