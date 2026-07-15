import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class GradientBackground extends StatelessWidget {
  const GradientBackground({
    super.key,
    required this.child,
    this.overlay,
  });

  final Widget child;
  final Widget? overlay;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Stack(
      fit: StackFit.expand,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: isDark ? AppColors.heroDark : AppColors.heroLight,
          ),
        ),
        Positioned(
          top: -80,
          right: -60,
          child: _Blob(
            size: 220,
            color: AppColors.brandAqua.withValues(alpha: isDark ? 0.12 : 0.18),
          ),
        ),
        Positioned(
          bottom: 80,
          left: -40,
          child: _Blob(
            size: 180,
            color: AppColors.brandTeal.withValues(alpha: isDark ? 0.35 : 0.08),
          ),
        ),
        if (overlay != null) overlay!,
        child,
      ],
    );
  }
}

class _Blob extends StatelessWidget {
  const _Blob({required this.size, required this.color});
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
      ),
    );
  }
}
