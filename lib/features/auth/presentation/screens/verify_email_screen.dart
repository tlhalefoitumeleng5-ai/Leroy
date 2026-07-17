import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/constants/app_routes.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';

class VerifyEmailScreen extends ConsumerWidget {
  const VerifyEmailScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Email verification')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              user?.emailVerified == true
                  ? 'Your email is verified.'
                  : 'We sent a verification link to ${user?.email ?? 'your email'}.',
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            LeroyButton(
              label: 'Resend verification email',
              isLoading: auth.isLoading,
              onPressed: () async {
                final ok =
                    await ref.read(authProvider.notifier).sendEmailVerification();
                if (!context.mounted) return;
                if (ok) {
                  AppSnackBar.success(context, 'Verification email sent');
                } else {
                  AppSnackBar.show(
                    context,
                    ref.read(authProvider).error ?? 'Failed to send',
                    isError: true,
                  );
                }
              },
            ),
            const SizedBox(height: 12),
            LeroyButton(
              label: 'I verified — refresh',
              isOutlined: true,
              onPressed: () async {
                await ref.read(authProvider.notifier).refreshUser();
                if (!context.mounted) return;
                if (ref.read(currentUserProvider)?.emailVerified == true) {
                  AppSnackBar.success(context, 'Email verified');
                  context.go(AppRoutes.home);
                } else {
                  AppSnackBar.show(
                    context,
                    'Email not verified yet. Check your inbox.',
                    isError: true,
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
