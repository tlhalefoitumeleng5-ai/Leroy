import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/router/app_router.dart';
import 'package:leroy_ai/core/theme/app_theme.dart';
import 'package:leroy_ai/shared/providers/app_config_provider.dart';
import 'package:leroy_ai/shared/providers/theme_provider.dart';

class LeroyApp extends ConsumerWidget {
  const LeroyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final languageCode = ref.watch(languageCodeProvider);

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      locale: Locale(languageCode),
      supportedLocales: const [
        Locale('en'),
        Locale('fr'),
        Locale('es'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
    );
  }
}
