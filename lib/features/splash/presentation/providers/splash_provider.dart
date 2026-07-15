import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/di/providers.dart';
import '../../../auth/presentation/providers/auth_providers.dart';

enum SplashDestination { onboarding, login, home }

final splashDestinationProvider = FutureProvider<SplashDestination>((ref) async {
  await Future<void>.delayed(AppConstants.splashDuration);
  final prefs = ref.read(sharedPreferencesProvider);
  final onboardingDone = prefs.getBool(AppConstants.prefOnboardingDone) ?? false;
  if (!onboardingDone) return SplashDestination.onboarding;

  final user = ref.read(authRepositoryProvider).currentUser;
  if (user != null) return SplashDestination.home;
  return SplashDestination.login;
});

Future<void> markOnboardingDone(SharedPreferences prefs) async {
  await prefs.setBool(AppConstants.prefOnboardingDone, true);
}
