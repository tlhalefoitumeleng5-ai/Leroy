import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';

/// Global app configuration flags.
final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('SharedPreferences must be overridden in main()');
});

final isDemoModeProvider = StateProvider<bool>((ref) => true);

final onboardingCompleteProvider =
    StateNotifierProvider<OnboardingNotifier, bool>((ref) {
  return OnboardingNotifier(ref.watch(sharedPreferencesProvider));
});

class OnboardingNotifier extends StateNotifier<bool> {
  OnboardingNotifier(this._prefs)
      : super(_prefs.getBool(AppConstants.keyOnboardingComplete) ?? false);

  final SharedPreferences _prefs;

  Future<void> complete() async {
    await _prefs.setBool(AppConstants.keyOnboardingComplete, true);
    state = true;
  }

  Future<void> reset() async {
    await _prefs.setBool(AppConstants.keyOnboardingComplete, false);
    state = false;
  }
}
