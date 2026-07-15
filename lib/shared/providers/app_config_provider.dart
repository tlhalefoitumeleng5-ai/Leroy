import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/services/notification_service.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('SharedPreferences must be overridden in main()');
});

final notificationServiceProvider = Provider<NotificationService>((ref) {
  throw UnimplementedError('NotificationService must be overridden in main()');
});

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

final languageCodeProvider =
    StateNotifierProvider<LanguageNotifier, String>((ref) {
  return LanguageNotifier(ref.watch(sharedPreferencesProvider));
});

class LanguageNotifier extends StateNotifier<String> {
  LanguageNotifier(this._prefs)
      : super(_prefs.getString(AppConstants.keyLanguageCode) ?? 'en');

  final SharedPreferences _prefs;

  Future<void> setLanguage(String code) async {
    await _prefs.setString(AppConstants.keyLanguageCode, code);
    state = code;
  }
}

final notificationsEnabledProvider =
    StateNotifierProvider<NotificationsEnabledNotifier, bool>((ref) {
  return NotificationsEnabledNotifier(
    ref.watch(sharedPreferencesProvider),
    ref.watch(notificationServiceProvider),
  );
});

class NotificationsEnabledNotifier extends StateNotifier<bool> {
  NotificationsEnabledNotifier(SharedPreferences prefs, this._service)
      : super(prefs.getBool(AppConstants.keyNotificationsEnabled) ?? true);

  final NotificationService _service;

  Future<void> setEnabled(bool enabled) async {
    await _service.setNotificationsEnabled(enabled);
    state = enabled;
  }
}
