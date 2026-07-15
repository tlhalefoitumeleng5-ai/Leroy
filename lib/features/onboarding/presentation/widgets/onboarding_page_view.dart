import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../../core/theme/app_colors.dart';
import '../providers/onboarding_provider.dart';

class OnboardingPageView extends StatelessWidget {
  const OnboardingPageView({super.key, required this.page});

  final OnboardingPage page;

  IconData get _icon {
    return switch (page.icon) {
      'chat' => Icons.auto_awesome_rounded,
      'image' => Icons.palette_outlined,
      _ => Icons.menu_book_rounded,
    };
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 140,
            height: 140,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppColors.brandMark,
              boxShadow: [
                BoxShadow(
                  color: AppColors.brandAqua.withValues(alpha: isDark ? 0.2 : 0.25),
                  blurRadius: 40,
                  offset: const Offset(0, 16),
                ),
              ],
            ),
            child: Icon(_icon, size: 64, color: Colors.white),
          )
              .animate()
              .fadeIn(duration: 500.ms)
              .scale(begin: const Offset(0.9, 0.9)),
          const SizedBox(height: 48),
          Text(
            page.title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.displaySmall,
          ).animate().fadeIn(delay: 120.ms).slideY(begin: 0.15, end: 0),
          const SizedBox(height: 16),
          Text(
            page.description,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge,
          ).animate().fadeIn(delay: 220.ms),
        ],
      ),
    );
  }
}
