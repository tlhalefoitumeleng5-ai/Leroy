import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/constants/app_routes.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/utils/validators.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late final TextEditingController _name;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(
      text: ref.read(currentUserProvider)?.displayName ?? '',
    );
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await ref
        .read(authProvider.notifier)
        .updateProfile(displayName: _name.text.trim());
    if (!mounted) return;
    if (ok) {
      AppSnackBar.success(context, 'Profile updated');
    } else {
      AppSnackBar.show(
        context,
        ref.read(authProvider).error ?? 'Update failed',
        isError: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final auth = ref.watch(authProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 44,
                  backgroundColor: AppColors.teal.withValues(alpha: 0.15),
                  child: Text(
                    (user?.displayName.isNotEmpty == true)
                        ? user!.displayName[0].toUpperCase()
                        : 'L',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: AppColors.teal,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(user?.email ?? '', style: theme.textTheme.bodyMedium),
                const SizedBox(height: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.teal.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${user?.plan.toUpperCase() ?? 'FREE'} PLAN',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: AppColors.teal,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          Form(
            key: _formKey,
            child: LeroyTextField(
              controller: _name,
              label: 'Display name',
              validator: Validators.name,
              prefixIcon: Icons.person_outline_rounded,
            ),
          ),
          const SizedBox(height: 20),
          LeroyButton(
            label: 'Save changes',
            isLoading: auth.isLoading,
            onPressed: _save,
          ),
          const SizedBox(height: 12),
          LeroyButton(
            label: 'Manage subscription',
            isOutlined: true,
            onPressed: () => context.push(AppRoutes.subscription),
          ),
          const SizedBox(height: 24),
          LeroyButton(
            label: 'Sign out',
            isOutlined: true,
            onPressed: () async {
              await ref.read(authProvider.notifier).signOut();
              if (context.mounted) context.go(AppRoutes.login);
            },
          ),
        ],
      ),
    );
  }
}
