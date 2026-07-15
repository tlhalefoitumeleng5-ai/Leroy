import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/utils/validators.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
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
      context.pop();
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
    final auth = ref.watch(authProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Update how your name appears across Leroy.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),
          Form(
            key: _formKey,
            child: LeroyTextField(
              controller: _name,
              label: 'Display name',
              validator: Validators.name,
              prefixIcon: Icons.person_outline_rounded,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _save(),
            ),
          ),
          const SizedBox(height: 24),
          LeroyButton(
            label: 'Save changes',
            isLoading: auth.isLoading,
            onPressed: _save,
          ),
        ],
      ),
    );
  }
}
