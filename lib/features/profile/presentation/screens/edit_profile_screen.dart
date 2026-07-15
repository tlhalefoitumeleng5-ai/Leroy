import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:leroy_ai/core/constants/app_routes.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
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

  Future<void> _pickPhoto() async {
    final file = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      imageQuality: 85,
    );
    if (file == null) return;
    final ok = await ref.read(authProvider.notifier).uploadPhoto(file.path);
    if (!mounted) return;
    if (ok) {
      AppSnackBar.success(context, 'Profile photo updated');
    } else {
      AppSnackBar.show(
        context,
        ref.read(authProvider).error ?? 'Upload failed',
        isError: true,
      );
    }
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
    final user = ref.watch(currentUserProvider);
    final auth = ref.watch(authProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundColor: AppColors.teal.withValues(alpha: 0.15),
                  backgroundImage: user?.photoUrl != null
                      ? NetworkImage(user!.photoUrl!)
                      : null,
                  child: user?.photoUrl == null
                      ? const Icon(Icons.person,
                          size: 40, color: AppColors.teal)
                      : null,
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: IconButton.filled(
                    onPressed: auth.isLoading ? null : _pickPhoto,
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.teal,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.camera_alt_outlined, size: 18),
                  ),
                ),
              ],
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
            ),
          ),
          const SizedBox(height: 24),
          LeroyButton(
            label: 'Save changes',
            isLoading: auth.isLoading,
            onPressed: _save,
          ),
          const SizedBox(height: 12),
          LeroyButton(
            label: 'Change password',
            isOutlined: true,
            onPressed: () => context.push(AppRoutes.changePassword),
          ),
        ],
      ),
    );
  }
}
