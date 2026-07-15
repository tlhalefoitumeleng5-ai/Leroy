import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/extensions/string_extensions.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/gradient_background.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../providers/home_provider.dart';
import '../widgets/feature_tile.dart';

class HomeDashboardScreen extends ConsumerWidget {
  const HomeDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final shortcuts = ref.watch(homeShortcutsProvider);
    final name = user?.displayName.split(' ').first ?? 'Creator';
    final isDark = context.isDark;

    return GradientBackground(
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppConstants.appName,
                            style: context.textTheme.titleMedium?.copyWith(
                              color: isDark ? AppColors.brandAqua : AppColors.brandTeal,
                              fontWeight: FontWeight.w700,
                            ),
                          ).animate().fadeIn(duration: 400.ms),
                          const SizedBox(height: 6),
                          Text(
                            'Good to see you, $name',
                            style: context.textTheme.headlineMedium,
                          ).animate().fadeIn(delay: 80.ms).slideY(begin: 0.1, end: 0),
                          const SizedBox(height: 4),
                          Text(
                            'What will you create today?',
                            style: context.textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => context.push('/settings'),
                      icon: const Icon(Icons.settings_outlined),
                    ),
                    GestureDetector(
                      onTap: () => context.go('/home/profile'),
                      child: CircleAvatar(
                        radius: 22,
                        backgroundColor: isDark
                            ? AppColors.brandTeal
                            : AppColors.brandTeal.withValues(alpha: 0.15),
                        child: Text(
                          (user?.displayName ?? 'U').initials,
                          style: TextStyle(
                            color: isDark ? AppColors.brandAqua : AppColors.brandTeal,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(22),
                    gradient: AppColors.brandMark,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Daily spark',
                        style: context.textTheme.labelLarge?.copyWith(color: Colors.white70),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Ship one idea before noon — a caption, a concept, or a canvas.',
                        style: context.textTheme.titleLarge?.copyWith(color: Colors.white),
                      ),
                      const SizedBox(height: 16),
                      FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppColors.brandInk,
                        ),
                        onPressed: () => context.go('/home/chat'),
                        child: const Text('Start chatting'),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 150.ms).slideY(begin: 0.08, end: 0),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.05,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = shortcuts[index];
                    return FeatureTile(
                      shortcut: item,
                      index: index,
                      onTap: () => context.go(item.route),
                    );
                  },
                  childCount: shortcuts.length,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
