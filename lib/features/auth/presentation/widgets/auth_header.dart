import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../../core/widgets/leroy_logo.dart';

class AuthHeader extends StatelessWidget {
  const AuthHeader({
    super.key,
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const LeroyLogo(size: 56, showWordmark: false, animate: true),
        const SizedBox(height: 28),
        Text(title, style: Theme.of(context).textTheme.displaySmall)
            .animate()
            .fadeIn(duration: 400.ms)
            .slideY(begin: 0.15, end: 0),
        const SizedBox(height: 8),
        Text(subtitle, style: Theme.of(context).textTheme.bodyLarge)
            .animate()
            .fadeIn(delay: 100.ms, duration: 400.ms),
      ],
    );
  }
}
