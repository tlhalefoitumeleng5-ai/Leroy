import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/theme/theme_provider.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../providers/settings_providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final notifications = ref.watch(notificationsEnabledProvider);
    final analytics = ref.watch(analyticsEnabledProvider);

    return Scaffold(
      appBar: AppBar(title: const Text(AppStrings.settings)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(8, 8, 8, 32),
        children: [
          _SectionLabel(label: 'Appearance'),
          RadioListTile<ThemeMode>(
            title: const Text('System'),
            value: ThemeMode.system,
            groupValue: themeMode,
            onChanged: (v) => ref.read(themeModeProvider.notifier).setThemeMode(v!),
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Light'),
            value: ThemeMode.light,
            groupValue: themeMode,
            onChanged: (v) => ref.read(themeModeProvider.notifier).setThemeMode(v!),
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Dark'),
            value: ThemeMode.dark,
            groupValue: themeMode,
            onChanged: (v) => ref.read(themeModeProvider.notifier).setThemeMode(v!),
          ),
          const Divider(height: 32),
          _SectionLabel(label: 'Preferences'),
          SwitchListTile(
            title: const Text('Push notifications'),
            subtitle: const Text('Product updates and reminders'),
            value: notifications,
            onChanged: (v) =>
                ref.read(notificationsEnabledProvider.notifier).state = v,
          ),
          SwitchListTile(
            title: const Text('Analytics'),
            subtitle: const Text('Help improve Leroy AI'),
            value: analytics,
            onChanged: (v) =>
                ref.read(analyticsEnabledProvider.notifier).state = v,
          ),
          const Divider(height: 32),
          _SectionLabel(label: 'Account'),
          ListTile(
            leading: const Icon(Icons.workspace_premium_outlined),
            title: const Text(AppStrings.subscription),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push('/subscription'),
          ),
          ListTile(
            leading: const Icon(Icons.logout_rounded),
            title: const Text(AppStrings.logout),
            onTap: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
          const Divider(height: 32),
          _SectionLabel(label: 'About'),
          ListTile(
            title: const Text(AppConstants.appName),
            subtitle: Text('Version ${AppConstants.appVersion}'),
          ),
          ListTile(
            title: const Text('Demo mode'),
            subtitle: Text(
              AppConstants.useDemoBackend
                  ? 'Local demo backend is active. Set useDemoBackend=false after Firebase setup.'
                  : 'Firebase backend is active.',
              style: context.textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Text(
        label.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              letterSpacing: 1.1,
            ),
      ),
    );
  }
}
