import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../../core/theme/app_colors.dart';
import '../providers/home_provider.dart';

class FeatureTile extends StatelessWidget {
  const FeatureTile({
    super.key,
    required this.shortcut,
    required this.onTap,
    this.index = 0,
  });

  final HomeShortcut shortcut;
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: isDark ? AppColors.darkSurface : Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.3),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: AppColors.brandMark,
                ),
                child: Icon(shortcut.icon, color: Colors.white, size: 22),
              ),
              const Spacer(),
              Text(shortcut.title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text(shortcut.subtitle, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: (80 * index).ms, duration: 400.ms)
        .slideY(begin: 0.12, end: 0);
  }
}
