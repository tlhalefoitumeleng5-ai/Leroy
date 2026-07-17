import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/constants/app_routes.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';
import 'package:leroy_ai/shared/providers/app_config_provider.dart';
import 'package:leroy_ai/shared/providers/theme_provider.dart';
import 'package:url_launcher/url_launcher.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  Future<void> _open(String url) async {
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final enabled = ref.watch(notificationsEnabledProvider);
    final language = ref.watch(languageCodeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const _Label('Appearance'),
          RadioListTile<ThemeMode>(
            title: const Text('System'),
            value: ThemeMode.system,
            groupValue: themeMode,
            onChanged: (v) =>
                ref.read(themeModeProvider.notifier).setMode(v!),
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Light'),
            value: ThemeMode.light,
            groupValue: themeMode,
            onChanged: (v) =>
                ref.read(themeModeProvider.notifier).setMode(v!),
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Dark'),
            value: ThemeMode.dark,
            groupValue: themeMode,
            onChanged: (v) =>
                ref.read(themeModeProvider.notifier).setMode(v!),
          ),
          const Divider(),
          const _Label('Notifications'),
          SwitchListTile(
            title: const Text('Push notifications'),
            value: enabled,
            activeThumbColor: AppColors.teal,
            onChanged: (v) async {
              await ref
                  .read(notificationsEnabledProvider.notifier)
                  .setEnabled(v);
              if (context.mounted) {
                AppSnackBar.success(
                  context,
                  v ? 'Notifications enabled' : 'Notifications disabled',
                );
              }
            },
          ),
          const Divider(),
          const _Label('Language'),
          ListTile(
            title: const Text('App language'),
            subtitle: Text(language == 'en' ? 'English' : language),
            trailing: DropdownButton<String>(
              value: language,
              items: const [
                DropdownMenuItem(value: 'en', child: Text('English')),
                DropdownMenuItem(value: 'fr', child: Text('Français')),
                DropdownMenuItem(value: 'es', child: Text('Español')),
              ],
              onChanged: (v) {
                if (v != null) {
                  ref.read(languageCodeProvider.notifier).setLanguage(v);
                }
              },
            ),
          ),
          const Divider(),
          const _Label('Legal'),
          ListTile(
            title: const Text('Privacy Policy'),
            trailing: const Icon(Icons.open_in_new),
            onTap: () => _open(AppConstants.privacyPolicyUrl),
          ),
          ListTile(
            title: const Text('Terms of Service'),
            trailing: const Icon(Icons.open_in_new),
            onTap: () => _open(AppConstants.termsOfServiceUrl),
          ),
          const Divider(),
          const _Label('Account'),
          ListTile(
            title: const Text('Profile'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go(AppRoutes.profile),
          ),
          ListTile(
            title: const Text('Sign out'),
            onTap: () async {
              await ref.read(authProvider.notifier).signOut();
              if (context.mounted) context.go(AppRoutes.login);
            },
          ),
          const Divider(),
          const _Label('About'),
          ListTile(
            title: Text(AppConstants.appName),
            subtitle: Text(
              '${AppConstants.companyName}\n'
              'Founder: ${AppConstants.founderName}\n'
              'v${AppConstants.appVersion}',
            ),
          ),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        text.toUpperCase(),
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: AppColors.teal,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}
