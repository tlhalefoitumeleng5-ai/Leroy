import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/constants/app_routes.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';
import 'package:leroy_ai/shared/providers/app_config_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future<void>.delayed(AppConstants.splashDuration);
    if (!mounted) return;
    final onboardingDone = ref.read(onboardingCompleteProvider);
    final authed = ref.read(authProvider).isAuthenticated;
    if (!onboardingDone) {
      context.go(AppRoutes.onboarding);
    } else if (authed) {
      context.go(AppRoutes.home);
    } else {
      context.go(AppRoutes.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AtmosphereBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const LeroyLogo(size: 96)
                  .animate()
                  .fadeIn(duration: 600.ms)
                  .scale(
                    begin: const Offset(0.85, 0.85),
                    curve: Curves.easeOutBack,
                  ),
              const SizedBox(height: 12),
              Text(
                AppConstants.appTagline,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              )
                  .animate(delay: 300.ms)
                  .fadeIn(duration: 500.ms)
                  .slideY(begin: 0.2, end: 0),
              const SizedBox(height: 48),
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: AppColors.teal,
                ),
              ).animate(delay: 500.ms).fadeIn(),
            ],
          ),
        ),
      ),
    );
  }
}
