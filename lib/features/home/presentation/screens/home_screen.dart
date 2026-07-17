import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/constants/app_routes.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';
import 'package:leroy_ai/shared/widgets/feature_widgets.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final theme = Theme.of(context);
    final name = user?.displayName.split(' ').first ?? 'Creator';

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Leroy AI',
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: AppColors.teal,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Good to see you, $name',
                            style: theme.textTheme.headlineSmall,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => context.push(AppRoutes.profile),
                      icon: CircleAvatar(
                        backgroundColor: AppColors.teal.withValues(alpha: 0.15),
                        child: Text(
                          (user?.displayName.isNotEmpty == true)
                              ? user!.displayName[0].toUpperCase()
                              : 'L',
                          style: const TextStyle(
                            color: AppColors.teal,
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
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: AppColors.brandGradient,
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'What will you create today?',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Start a conversation or generate a new image.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          FilledButton.tonal(
                            style: FilledButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppColors.tealDark,
                            ),
                            onPressed: () => context.push(AppRoutes.chat),
                            child: const Text('New chat'),
                          ),
                          OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: const BorderSide(color: Colors.white70),
                            ),
                            onPressed: () =>
                                context.push(AppRoutes.imageGenerator),
                            child: const Text('Generate image'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 450.ms).slideY(begin: 0.08, end: 0),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
                child: SectionHeader(
                  title: 'Workspace',
                  subtitle: 'Your core creative tools',
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverGrid.count(
                crossAxisCount: 2,
                mainAxisSpacing: 14,
                crossAxisSpacing: 14,
                childAspectRatio: 1.05,
                children: [
                  FeatureTile(
                    title: 'AI Chat',
                    subtitle: 'Think and write with Leroy',
                    icon: Icons.forum_outlined,
                    onTap: () => context.push(AppRoutes.chat),
                  ),
                  FeatureTile(
                    title: 'Image Studio',
                    subtitle: 'Prompt-to-image creation',
                    icon: Icons.palette_outlined,
                    accent: AppColors.coral,
                    onTap: () => context.push(AppRoutes.imageGenerator),
                  ),
                  FeatureTile(
                    title: 'Prompt Library',
                    subtitle: 'Reusable creative briefs',
                    icon: Icons.menu_book_outlined,
                    accent: AppColors.amber,
                    onTap: () => context.push(AppRoutes.promptLibrary),
                  ),
                  FeatureTile(
                    title: 'Services',
                    subtitle: 'Apps, websites & AI in Rands',
                    icon: Icons.handshake_outlined,
                    accent: AppColors.coral,
                    onTap: () => context.push(AppRoutes.services),
                  ),
                ]
                    .animate(interval: 80.ms)
                    .fadeIn(duration: 350.ms)
                    .slideY(begin: 0.1, end: 0),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 32),
                child: Column(
                  children: [
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.workspace_premium_outlined),
                      title: const Text('Subscription plans'),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => context.push(AppRoutes.subscription),
                    ),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.settings_outlined),
                      title: const Text('Settings'),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => context.push(AppRoutes.settings),
                    ),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.person_outline_rounded),
                      title: const Text('Profile'),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => context.push(AppRoutes.profile),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
