import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/constants/app_routes.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';
import 'package:leroy_ai/features/chat/presentation/providers/chat_provider.dart';
import 'package:leroy_ai/shared/widgets/feature_widgets.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _startChat(BuildContext context, WidgetRef ref) async {
    final session = await ref.read(chatListProvider.notifier).createSession();
    if (session != null && context.mounted) {
      context.push('/chat/${session.id}');
    } else if (context.mounted) {
      context.go(AppRoutes.chat);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final theme = Theme.of(context);
    final name = user?.displayName.split(' ').first ?? 'Creator';
    final plan = (user?.plan ?? 'free').toUpperCase();

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 12, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppConstants.appName,
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
                      tooltip: 'Settings',
                      onPressed: () => context.push(AppRoutes.settings),
                      icon: const Icon(Icons.settings_outlined),
                    ),
                    IconButton(
                      tooltip: 'Profile',
                      onPressed: () => context.go(AppRoutes.profile),
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
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
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
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'What will you create today?',
                              style: theme.textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              plan,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Chat, generate images, or reuse winning prompts.',
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
                            onPressed: () => _startChat(context, ref),
                            child: const Text('New chat'),
                          ),
                          OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: const BorderSide(color: Colors.white70),
                            ),
                            onPressed: () =>
                                context.go(AppRoutes.imageGenerator),
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
                  actionLabel: 'Plans',
                  onAction: () => context.push(AppRoutes.subscription),
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
                    onTap: () => context.go(AppRoutes.chat),
                  ),
                  FeatureTile(
                    title: 'Image Studio',
                    subtitle: 'Prompt-to-image creation',
                    icon: Icons.palette_outlined,
                    accent: AppColors.coral,
                    onTap: () => context.go(AppRoutes.imageGenerator),
                  ),
                  FeatureTile(
                    title: 'Prompt Library',
                    subtitle: 'Reusable creative briefs',
                    icon: Icons.menu_book_outlined,
                    accent: AppColors.amber,
                    onTap: () => context.go(AppRoutes.promptLibrary),
                  ),
                  FeatureTile(
                    title: 'Upgrade',
                    subtitle: 'Unlock Pro & Studio',
                    icon: Icons.workspace_premium_outlined,
                    accent: const Color(0xFF6366F1),
                    onTap: () => context.push(AppRoutes.subscription),
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
                    _QuickLink(
                      icon: Icons.settings_outlined,
                      title: 'Settings',
                      onTap: () => context.push(AppRoutes.settings),
                    ),
                    _QuickLink(
                      icon: Icons.person_outline_rounded,
                      title: 'Profile',
                      onTap: () => context.go(AppRoutes.profile),
                    ),
                    _QuickLink(
                      icon: Icons.workspace_premium_outlined,
                      title: 'Subscription',
                      onTap: () => context.push(AppRoutes.subscription),
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

class _QuickLink extends StatelessWidget {
  const _QuickLink({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right_rounded),
      onTap: onTap,
    );
  }
}
