import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/utils/validators.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() =>
      _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await ref.read(authProvider.notifier).changePassword(
          currentPassword: _current.text,
          newPassword: _next.text,
        );
    if (!mounted) return;
    if (ok) {
      AppSnackBar.success(context, 'Password updated');
      context.pop();
    } else {
      AppSnackBar.show(
        context,
        ref.read(authProvider).error ?? 'Unable to change password',
        isError: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Change password')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            LeroyTextField(
              controller: _current,
              label: 'Current password',
              obscureText: _obscure,
              validator: Validators.password,
              prefixIcon: Icons.lock_outline,
            ),
            const SizedBox(height: 16),
            LeroyTextField(
              controller: _next,
              label: 'New password',
              obscureText: _obscure,
              validator: Validators.password,
              prefixIcon: Icons.lock_outline,
            ),
            const SizedBox(height: 16),
            LeroyTextField(
              controller: _confirm,
              label: 'Confirm new password',
              obscureText: _obscure,
              validator: (v) => Validators.confirmPassword(v, _next.text),
              prefixIcon: Icons.lock_outline,
              suffix: IconButton(
                onPressed: () => setState(() => _obscure = !_obscure),
                icon: Icon(
                  _obscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
              ),
            ),
            const SizedBox(height: 24),
            LeroyButton(
              label: 'Update password',
              isLoading: auth.isLoading,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}
