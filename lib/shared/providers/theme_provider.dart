import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/shared/providers/app_config_provider.dart';

final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier(ref.watch(sharedPreferencesProvider));
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier(this._prefs) : super(_read(_prefs));

  final dynamic _prefs;

  static ThemeMode _read(dynamic prefs) {
    final value = prefs.getString(AppConstants.keyThemeMode) as String?;
    switch (value) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  Future<void> setMode(ThemeMode mode) async {
    state = mode;
    final value = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    };
    await _prefs.setString(AppConstants.keyThemeMode, value);
  }

  Future<void> toggleLightDark() async {
    if (state == ThemeMode.dark) {
      await setMode(ThemeMode.light);
    } else {
      await setMode(ThemeMode.dark);
    }
  }
}
