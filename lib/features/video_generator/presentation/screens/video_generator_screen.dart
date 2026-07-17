import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:leroy_ai/core/utils/media_saver.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/utils/validators.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/video_generator/presentation/providers/video_provider.dart';

class VideoGeneratorScreen extends ConsumerStatefulWidget {
  const VideoGeneratorScreen({super.key});

  @override
  ConsumerState<VideoGeneratorScreen> createState() =>
      _VideoGeneratorScreenState();
}

class _VideoGeneratorScreenState extends ConsumerState<VideoGeneratorScreen> {
  final _prompt = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _prompt.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(videoGenProvider.notifier).generate(_prompt.text.trim());
    final error = ref.read(videoGenProvider).error;
    if (!mounted) return;
    if (error != null) {
      AppSnackBar.show(context, error, isError: true);
    } else {
      AppSnackBar.success(context, 'Video generated');
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(videoGenProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('AI Video Generator')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            TextFormField(
              controller: _prompt,
              maxLines: 4,
              validator: Validators.prompt,
              decoration: const InputDecoration(
                hintText: 'Describe the video you want to generate…',
              ),
            ),
            const SizedBox(height: 16),
            Text('Duration', style: theme.textTheme.titleSmall),
            Wrap(
              spacing: 8,
              children: [5, 10, 15].map((s) {
                return ChoiceChip(
                  label: Text('${s}s'),
                  selected: state.durationSeconds == s,
                  onSelected: (_) =>
                      ref.read(videoGenProvider.notifier).setDuration(s),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            Text('Quality', style: theme.textTheme.titleSmall),
            Wrap(
              spacing: 8,
              children: ['sd', 'hd', '4k'].map((q) {
                return ChoiceChip(
                  label: Text(q.toUpperCase()),
                  selected: state.quality == q,
                  onSelected: (_) =>
                      ref.read(videoGenProvider.notifier).setQuality(q),
                );
              }).toList(),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Voice narration'),
              value: state.voiceEnabled,
              onChanged: (v) => ref.read(videoGenProvider.notifier).setVoice(v),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Background music'),
              value: state.musicEnabled,
              onChanged: (v) => ref.read(videoGenProvider.notifier).setMusic(v),
            ),
            LeroyButton(
              label: 'Generate video',
              icon: Icons.videocam_outlined,
              isLoading: state.isGenerating,
              onPressed: _generate,
            ),
            if (state.latest != null) ...[
              const SizedBox(height: 24),
              Text('Latest video', style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(state.latest!.prompt, style: theme.textTheme.bodySmall),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        try {
                          await MediaSaver.saveVideoFromUrl(
                            state.latest!.videoUrl,
                          );
                          if (context.mounted) {
                            AppSnackBar.success(context, 'Saved to gallery');
                          }
                        } catch (e) {
                          if (context.mounted) {
                            AppSnackBar.show(
                              context,
                              e.toString(),
                              isError: true,
                            );
                          }
                        }
                      },
                      icon: const Icon(Icons.download_outlined),
                      label: const Text('Download'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => Share.share(state.latest!.videoUrl),
                      icon: const Icon(Icons.share_outlined),
                      label: const Text('Share'),
                    ),
                  ),
                ],
              ),
            ],
            if (state.history.isNotEmpty) ...[
              const SizedBox(height: 28),
              const SectionHeader(title: 'History'),
              ...state.history.take(10).map(
                    (v) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.movie_outlined),
                      title: Text(v.prompt,
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      subtitle: Text('${v.durationSeconds}s · ${v.quality}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.download_outlined),
                        onPressed: () async {
                          try {
                            await MediaSaver.saveVideoFromUrl(v.videoUrl);
                            if (context.mounted) {
                              AppSnackBar.success(context, 'Saved to gallery');
                            }
                          } catch (e) {
                            if (context.mounted) {
                              AppSnackBar.show(
                                context,
                                e.toString(),
                                isError: true,
                              );
                            }
                          }
                        },
                      ),
                    ),
                  ),
            ],
          ],
        ),
      ),
    );
  }
}
