import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/constants/app_routes.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final theme = Theme.of(context);
    final plan = (user?.plan ?? 'free').toUpperCase();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            tooltip: 'Settings',
            onPressed: () => context.push(AppRoutes.settings),
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundColor: AppColors.teal.withValues(alpha: 0.15),
                  child: Text(
                    (user?.displayName.isNotEmpty == true)
                        ? user!.displayName[0].toUpperCase()
                        : 'L',
                    style: theme.textTheme.headlineLarge?.copyWith(
                      color: AppColors.teal,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  user?.displayName ?? 'Leroy User',
                  style: theme.textTheme.headlineSmall,
                ),
                const SizedBox(height: 4),
                Text(user?.email ?? '', style: theme.textTheme.bodyMedium),
                const SizedBox(height: 10),
                InkWell(
                  onTap: () => context.push(AppRoutes.subscription),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.teal.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '$plan PLAN',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: AppColors.teal,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          _ProfileTile(
            icon: Icons.edit_outlined,
            title: 'Edit profile',
            subtitle: 'Update your display name',
            onTap: () => context.push(AppRoutes.editProfile),
          ),
          _ProfileTile(
            icon: Icons.workspace_premium_outlined,
            title: 'Subscription',
            subtitle: 'Manage Free, Pro, or Studio',
            onTap: () => context.push(AppRoutes.subscription),
          ),
          _ProfileTile(
            icon: Icons.settings_outlined,
            title: 'Settings',
            subtitle: 'Theme, demo mode, and more',
            onTap: () => context.push(AppRoutes.settings),
          ),
          _ProfileTile(
            icon: Icons.forum_outlined,
            title: 'AI Chat',
            subtitle: 'Continue a conversation',
            onTap: () => context.go(AppRoutes.chat),
          ),
          _ProfileTile(
            icon: Icons.auto_awesome_outlined,
            title: 'Image Studio',
            subtitle: 'Generate visuals',
            onTap: () => context.go(AppRoutes.imageGenerator),
          ),
          const SizedBox(height: 12),
          LeroyButton(
            label: 'Sign out',
            isOutlined: true,
            onPressed: () async {
              final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Sign out?'),
                      content: const Text(
                        'You can sign back in anytime.',
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('Cancel'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text('Sign out'),
                        ),
                      ],
                    ),
                  ) ??
                  false;
              if (!confirm) return;
              await ref.read(authProvider.notifier).signOut();
              if (context.mounted) context.go(AppRoutes.login);
            },
          ),
          const SizedBox(height: 28),
          Text(
            AppConstants.companyName,
            textAlign: TextAlign.center,
            style: theme.textTheme.labelLarge?.copyWith(color: AppColors.teal),
          ),
          const SizedBox(height: 4),
          Text(
            'Founded by ${AppConstants.founderName}',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 4),
          Text(
            'Version ${AppConstants.appVersion}',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: theme.colorScheme.outline.withValues(alpha: 0.4),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: AppColors.teal.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: AppColors.teal),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: theme.textTheme.titleMedium),
                      Text(subtitle, style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
