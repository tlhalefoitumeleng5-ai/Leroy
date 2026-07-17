import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
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
                          Text('Welcome, $name',
                              style: theme.textTheme.headlineSmall),
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
                        backgroundImage: user?.photoUrl != null
                            ? NetworkImage(user!.photoUrl!)
                            : null,
                        child: user?.photoUrl == null
                            ? Text(
                                (user?.displayName.isNotEmpty == true)
                                    ? user!.displayName[0].toUpperCase()
                                    : 'L',
                                style: const TextStyle(
                                  color: AppColors.teal,
                                  fontWeight: FontWeight.w700,
                                ),
                              )
                            : null,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (user != null && !user.emailVerified)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Material(
                    color: AppColors.amber.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(16),
                    child: ListTile(
                      leading: const Icon(Icons.mark_email_unread_outlined,
                          color: AppColors.amber),
                      title: const Text('Verify your email'),
                      subtitle: const Text('Tap to resend verification'),
                      onTap: () => context.push(AppRoutes.verifyEmail),
                    ),
                  ),
                ),
              ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Container(
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
                              'Create with Leroy AI',
                              style: theme.textTheme.headlineSmall
                                  ?.copyWith(color: Colors.white),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
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
                        'Images, videos, chat, and assistants — powered by Firebase.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn().slideY(begin: 0.08, end: 0),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: SectionHeader(
                  title: 'Studio',
                  subtitle: 'Everything you need to create',
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
                    title: 'AI Image',
                    subtitle: 'Generate & save visuals',
                    icon: Icons.palette_outlined,
                    accent: AppColors.coral,
                    onTap: () => context.go(AppRoutes.imageGenerator),
                  ),
                  FeatureTile(
                    title: 'AI Video',
                    subtitle: 'Prompt to video',
                    icon: Icons.videocam_outlined,
                    accent: const Color(0xFF8B5CF6),
                    onTap: () => context.push(AppRoutes.videoGenerator),
                  ),
                  FeatureTile(
                    title: 'AI Chat',
                    subtitle: 'Conversations with memory',
                    icon: Icons.forum_outlined,
                    onTap: () => context.go(AppRoutes.chat),
                  ),
                  FeatureTile(
                    title: 'AI Assistant',
                    subtitle: 'Focused productivity help',
                    icon: Icons.smart_toy_outlined,
                    accent: AppColors.amber,
                    onTap: () => context.push(AppRoutes.assistant),
                  ),
                  FeatureTile(
                    title: 'Templates',
                    subtitle: 'Ready-to-use briefs',
                    icon: Icons.dashboard_customize_outlined,
                    onTap: () => context.push(AppRoutes.templates),
                  ),
                  FeatureTile(
                    title: 'History',
                    subtitle: 'Images, videos, chats',
                    icon: Icons.history_rounded,
                    accent: const Color(0xFF0EA5E9),
                    onTap: () => context.go(AppRoutes.history),
                  ),
                  FeatureTile(
                    title: 'Prompts',
                    subtitle: 'Creative prompt library',
                    icon: Icons.menu_book_outlined,
                    accent: const Color(0xFF14B8A6),
                    onTap: () => context.push(AppRoutes.promptLibrary),
                  ),
                  FeatureTile(
                    title: 'Subscription',
                    subtitle: 'Free to Business',
                    icon: Icons.workspace_premium_outlined,
                    accent: const Color(0xFF6366F1),
                    onTap: () => context.push(AppRoutes.subscription),
                  ),
                ]
                    .animate(interval: 60.ms)
                    .fadeIn(duration: 300.ms)
                    .slideY(begin: 0.08, end: 0),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 32)),
          ],
        ),
      ),
    );
  }
}
