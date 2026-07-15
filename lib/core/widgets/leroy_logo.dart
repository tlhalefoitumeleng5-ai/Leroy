import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';

class LeroyLogo extends StatelessWidget {
  const LeroyLogo({
    super.key,
    this.size = 72,
    this.showWordmark = true,
    this.animate = false,
  });

  final double size;
  final bool showWordmark;
  final bool animate;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    Widget mark = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.28),
        gradient: AppColors.brandMark,
        boxShadow: [
          BoxShadow(
            color: AppColors.brandAqua.withValues(alpha: isDark ? 0.25 : 0.2),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Center(
        child: Text(
          'L',
          style: TextStyle(
            fontSize: size * 0.48,
            fontWeight: FontWeight.w700,
            color: Colors.white,
            height: 1,
          ),
        ),
      ),
    );

    if (animate) {
      mark = mark
          .animate()
          .fadeIn(duration: 600.ms)
          .scale(begin: const Offset(0.85, 0.85), curve: Curves.easeOutBack);
    }

    if (!showWordmark) return mark;

    Widget wordmark = Text(
      'Leroy AI',
      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.4,
          ),
    );
    if (animate) {
      wordmark = wordmark
          .animate()
          .fadeIn(delay: 200.ms, duration: 500.ms)
          .slideY(begin: 0.2, end: 0);
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        mark,
        SizedBox(height: size * 0.22),
        wordmark,
      ],
    );
  }
}
