import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/constants/app_routes.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/shared/providers/app_config_provider.dart';
import 'package:leroy_ai/shared/providers/theme_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final demoMode = ref.watch(isDemoModeProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          _SectionLabel(label: 'Appearance'),
          RadioListTile<ThemeMode>(
            title: const Text('System'),
            value: ThemeMode.system,
            groupValue: themeMode,
            activeColor: AppColors.teal,
            onChanged: (v) {
              if (v != null) {
                ref.read(themeModeProvider.notifier).setMode(v);
              }
            },
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Light'),
            value: ThemeMode.light,
            groupValue: themeMode,
            activeColor: AppColors.teal,
            onChanged: (v) {
              if (v != null) {
                ref.read(themeModeProvider.notifier).setMode(v);
              }
            },
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Dark'),
            value: ThemeMode.dark,
            groupValue: themeMode,
            activeColor: AppColors.teal,
            onChanged: (v) {
              if (v != null) {
                ref.read(themeModeProvider.notifier).setMode(v);
              }
            },
          ),
          const Divider(),
          _SectionLabel(label: 'Data & backend'),
          SwitchListTile(
            title: const Text('Demo mode'),
            subtitle: const Text(
              'Use local mock services without Firebase credentials',
            ),
            value: demoMode,
            activeColor: AppColors.teal,
            onChanged: (v) {
              ref.read(isDemoModeProvider.notifier).state = v;
            },
          ),
          ListTile(
            title: const Text('Reset onboarding'),
            subtitle: const Text('Show the intro flow again on next launch'),
            trailing: const Icon(Icons.restart_alt_rounded),
            onTap: () async {
              await ref.read(onboardingCompleteProvider.notifier).reset();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Onboarding reset')),
                );
              }
            },
          ),
          const Divider(),
          _SectionLabel(label: 'Account'),
          ListTile(
            leading: const Icon(Icons.person_outline_rounded),
            title: const Text('Profile'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push(AppRoutes.profile),
          ),
          ListTile(
            leading: const Icon(Icons.workspace_premium_outlined),
            title: const Text('Subscription'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push(AppRoutes.subscription),
          ),
          const Divider(),
          _SectionLabel(label: 'About'),
          ListTile(
            title: const Text('App'),
            subtitle: Text('${AppConstants.appName} v${AppConstants.appVersion}'),
          ),
          ListTile(
            title: const Text('Architecture'),
            subtitle: Text(
              'Clean Architecture · Riverpod · Firebase · Material 3',
              style: theme.textTheme.bodySmall,
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
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        label.toUpperCase(),
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: AppColors.teal,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
            ),
      ),
    );
  }
}
