import 'package:flutter/material.dart';

import '../../../../core/extensions/string_extensions.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/domain/entities/user_entity.dart';

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({super.key, required this.user});

  final UserEntity user;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      children: [
        Container(
          width: 96,
          height: 96,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.brandMark,
            boxShadow: [
              BoxShadow(
                color: AppColors.brandAqua.withValues(alpha: 0.25),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Center(
            child: Text(
              user.displayName.initials,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(user.displayName, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 4),
        Text(
          user.isGuest ? 'Guest account' : user.email,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: (isDark ? AppColors.brandAqua : AppColors.brandTeal).withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            user.isPro ? 'Pro plan' : 'Free plan',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: isDark ? AppColors.brandAqua : AppColors.brandTeal,
                ),
          ),
        ),
      ],
    );
  }
}
