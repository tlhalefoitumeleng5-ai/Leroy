import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/utils/validators.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/image_generator/presentation/providers/image_provider.dart';

class ImageGeneratorScreen extends ConsumerStatefulWidget {
  const ImageGeneratorScreen({super.key});

  @override
  ConsumerState<ImageGeneratorScreen> createState() =>
      _ImageGeneratorScreenState();
}

class _ImageGeneratorScreenState extends ConsumerState<ImageGeneratorScreen> {
  final _prompt = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  static const styles = ['cinematic', 'illustration', 'photoreal', 'minimal'];
  static const ratios = ['1:1', '16:9', '9:16', '4:3'];

  @override
  void dispose() {
    _prompt.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    await ref.read(imageGenProvider.notifier).generate(_prompt.text.trim());
    final error = ref.read(imageGenProvider).error;
    if (error != null && mounted) {
      AppSnackBar.show(context, error, isError: true);
    } else if (mounted) {
      AppSnackBar.success(context, 'Image generated');
    }
  }

  void _showImage(String url, String prompt) {
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        insetPadding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: CachedNetworkImage(imageUrl: url, fit: BoxFit.cover),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(prompt, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            _prompt.text = prompt;
                            Navigator.pop(ctx);
                          },
                          child: const Text('Reuse prompt'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () async {
                            await Clipboard.setData(ClipboardData(text: url));
                            if (ctx.mounted) Navigator.pop(ctx);
                            if (mounted) {
                              AppSnackBar.success(context, 'Image URL copied');
                            }
                          },
                          child: const Text('Copy URL'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(imageGenProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Image Studio'),
        actions: [
          IconButton(
            tooltip: 'Refresh history',
            onPressed: () => ref.read(imageGenProvider.notifier).loadHistory(),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Describe the image you want to create.',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _prompt,
              maxLines: 4,
              validator: Validators.prompt,
              decoration: const InputDecoration(
                hintText:
                    'A misty coastal lighthouse at dusk, cinematic lighting…',
              ),
            ),
            const SizedBox(height: 18),
            Text('Style', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: styles.map((s) {
                final selected = state.style == s;
                return ChoiceChip(
                  label: Text(s),
                  selected: selected,
                  onSelected: (_) =>
                      ref.read(imageGenProvider.notifier).setStyle(s),
                );
              }).toList(),
            ),
            const SizedBox(height: 14),
            Text('Aspect ratio', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: ratios.map((r) {
                final selected = state.aspectRatio == r;
                return ChoiceChip(
                  label: Text(r),
                  selected: selected,
                  onSelected: (_) =>
                      ref.read(imageGenProvider.notifier).setAspect(r),
                );
              }).toList(),
            ),
            const SizedBox(height: 22),
            LeroyButton(
              label: 'Generate',
              icon: Icons.auto_awesome,
              isLoading: state.isGenerating,
              onPressed: _generate,
            ),
            const SizedBox(height: 28),
            if (state.latest != null) ...[
              Text('Latest result', style: theme.textTheme.titleLarge),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: () => _showImage(
                  state.latest!.imageUrl,
                  state.latest!.prompt,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(22),
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: CachedNetworkImage(
                      imageUrl: state.latest!.imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        color: theme.colorScheme.surfaceContainerHighest,
                        child: const Center(
                          child:
                              CircularProgressIndicator(color: AppColors.teal),
                        ),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        color: theme.colorScheme.surfaceContainerHighest,
                        child: const Icon(Icons.broken_image_outlined),
                      ),
                    ),
                  ),
                ).animate().fadeIn().scale(begin: const Offset(0.97, 0.97)),
              ),
              const SizedBox(height: 8),
              Text(state.latest!.prompt, style: theme.textTheme.bodySmall),
              const SizedBox(height: 28),
            ],
            if (state.history.isNotEmpty) ...[
              const SectionHeader(title: 'History'),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: state.history.length.clamp(0, 12),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                ),
                itemBuilder: (context, index) {
                  final item = state.history[index];
                  return GestureDetector(
                    onTap: () => _showImage(item.imageUrl, item.prompt),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: CachedNetworkImage(
                        imageUrl: item.imageUrl,
                        fit: BoxFit.cover,
                      ),
                    ),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
