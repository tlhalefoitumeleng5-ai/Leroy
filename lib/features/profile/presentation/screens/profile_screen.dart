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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
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
                  backgroundImage: user?.photoUrl != null
                      ? NetworkImage(user!.photoUrl!)
                      : null,
                  child: user?.photoUrl == null
                      ? Text(
                          (user?.displayName.isNotEmpty == true)
                              ? user!.displayName[0].toUpperCase()
                              : 'L',
                          style: theme.textTheme.headlineLarge
                              ?.copyWith(color: AppColors.teal),
                        )
                      : null,
                ),
                const SizedBox(height: 12),
                Text(user?.displayName ?? '',
                    style: theme.textTheme.headlineSmall),
                Text(user?.email ?? '', style: theme.textTheme.bodyMedium),
                const SizedBox(height: 8),
                Text(
                  '${(user?.plan ?? 'free').toUpperCase()} · '
                  '${user?.emailVerified == true ? 'Verified' : 'Unverified'}',
                  style: theme.textTheme.labelLarge
                      ?.copyWith(color: AppColors.teal),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              _stat(context, 'Images', user?.imagesGenerated ?? 0),
              _stat(context, 'Videos', user?.videosGenerated ?? 0),
              _stat(context, 'Chats', user?.chatsStarted ?? 0),
            ],
          ),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.edit_outlined),
            title: const Text('Edit profile'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(AppRoutes.editProfile),
          ),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Change password'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(AppRoutes.changePassword),
          ),
          ListTile(
            leading: const Icon(Icons.workspace_premium_outlined),
            title: const Text('Subscription'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(AppRoutes.subscription),
          ),
          ListTile(
            leading: const Icon(Icons.mark_email_unread_outlined),
            title: const Text('Email verification'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(AppRoutes.verifyEmail),
          ),
          const SizedBox(height: 12),
          LeroyButton(
            label: 'Sign out',
            isOutlined: true,
            onPressed: () async {
              await ref.read(authProvider.notifier).signOut();
              if (context.mounted) context.go(AppRoutes.login);
            },
          ),
          const SizedBox(height: 24),
          Text(
            AppConstants.companyName,
            textAlign: TextAlign.center,
            style: theme.textTheme.labelLarge?.copyWith(color: AppColors.teal),
          ),
          Text(
            'Founded by ${AppConstants.founderName}',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  Widget _stat(BuildContext context, String label, int value) {
    return Expanded(
      child: Column(
        children: [
          Text('$value', style: Theme.of(context).textTheme.headlineSmall),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
