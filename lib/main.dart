import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/app.dart';
import 'package:leroy_ai/firebase_options.dart';
import 'package:leroy_ai/shared/providers/app_config_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  final prefs = await SharedPreferences.getInstance();

  var demoMode = true;
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    // Real Firebase project configured → prefer live services.
    final apiKey = DefaultFirebaseOptions.currentPlatform.apiKey;
    demoMode = apiKey.startsWith('REPLACE_');
  } catch (_) {
    // Keep demo mode when Firebase is not configured.
    demoMode = true;
  }

  runApp(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
        isDemoModeProvider.overrideWith((ref) => demoMode),
      ],
      child: const LeroyApp(),
    ),
  );
}
