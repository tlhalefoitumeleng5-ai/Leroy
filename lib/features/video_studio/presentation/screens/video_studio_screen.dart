import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/video_studio/data/scripts/leroy_video_scripts.dart';
import 'package:leroy_ai/features/video_studio/domain/entities/generated_video_entity.dart';
import 'package:leroy_ai/features/video_studio/presentation/providers/video_studio_provider.dart';
import 'package:leroy_ai/features/video_studio/presentation/screens/video_preview_screen.dart';

class VideoStudioScreen extends ConsumerWidget {
  const VideoStudioScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(videoStudioProvider);
    final notifier = ref.read(videoStudioProvider.notifier);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Video Studio'),
        actions: [
          IconButton(
            tooltip: 'Refresh library',
            onPressed: state.isRendering ? null : notifier.loadLibrary,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Generate 50 professional Leroy AI short videos with AI voice-over, captions, music, and HD export.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 14),
                LeroyButton(
                  label: state.isBatch && state.isRendering
                      ? 'Generating All…'
                      : 'Generate All 50 Videos',
                  icon: Icons.library_books_rounded,
                  isLoading: state.isBatch && state.isRendering,
                  onPressed: state.isRendering
                      ? null
                      : () async {
                          final ok = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Generate all 50 videos?'),
                              content: const Text(
                                'This will render every script into an HD MP4 with voice-over, music, captions, and effects. You can cancel between videos.',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, false),
                                  child: const Text('Cancel'),
                                ),
                                FilledButton(
                                  onPressed: () => Navigator.pop(ctx, true),
                                  child: const Text('Start'),
                                ),
                              ],
                            ),
                          );
                          if (ok == true) {
                            await notifier.renderAll();
                            if (context.mounted &&
                                ref.read(videoStudioProvider).error != null) {
                              AppSnackBar.show(
                                context,
                                ref.read(videoStudioProvider).error!,
                                isError: true,
                              );
                            }
                          }
                        },
                ),
                if (state.isRendering) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          state.stage,
                          style: theme.textTheme.bodySmall,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (state.isBatch)
                        TextButton(
                          onPressed: notifier.cancelBatch,
                          child: const Text('Cancel'),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(99),
                    child: LinearProgressIndicator(
                      value: state.progress.clamp(0, 1),
                      minHeight: 10,
                      backgroundColor:
                          theme.colorScheme.surfaceContainerHighest,
                      color: AppColors.teal,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${(state.progress * 100).clamp(0, 100).toStringAsFixed(0)}%'
                    '${state.isBatch ? '  •  ${state.batchCurrent}/${state.batchTotal}' : ''}',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: AppColors.tealDark,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                Text(
                  '${state.library.length} saved in library',
                  style: theme.textTheme.labelLarge,
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                    itemCount: notifier.scripts.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final script = notifier.scripts[index];
                      final existing = state.videoForScript(script.number);
                      return _ScriptCard(
                        script: script,
                        existing: existing,
                        busy: state.isRendering,
                        onGenerate: () async {
                          final video = await notifier.renderOne(script);
                          if (!context.mounted) return;
                          final err = ref.read(videoStudioProvider).error;
                          if (err != null) {
                            AppSnackBar.show(context, err, isError: true);
                            return;
                          }
                          if (video != null) {
                            AppSnackBar.show(
                              context,
                              'Video ${script.number} ready — preview it now.',
                            );
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) =>
                                    VideoPreviewScreen(video: video),
                              ),
                            );
                          }
                        },
                        onPreview: existing == null
                            ? null
                            : () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        VideoPreviewScreen(video: existing),
                                  ),
                                );
                              },
                        onDelete: existing == null
                            ? null
                            : () => notifier.deleteVideo(existing),
                      ).animate().fadeIn(duration: 250.ms);
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _ScriptCard extends StatelessWidget {
  const _ScriptCard({
    required this.script,
    required this.existing,
    required this.busy,
    required this.onGenerate,
    required this.onPreview,
    required this.onDelete,
  });

  final VideoScript script;
  final GeneratedVideoEntity? existing;
  final bool busy;
  final VoidCallback onGenerate;
  final VoidCallback? onPreview;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ready = existing != null;

    return Material(
      color: theme.colorScheme.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 64,
                height: 96,
                child: _Thumb(scriptNumber: script.number, video: existing),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    script.title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    script.hook,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilledButton.tonal(
                        onPressed: busy ? null : onGenerate,
                        child: Text(ready ? 'Regenerate' : 'Generate'),
                      ),
                      if (onPreview != null)
                        OutlinedButton(
                          onPressed: busy ? null : onPreview,
                          child: const Text('Preview'),
                        ),
                      if (onDelete != null)
                        IconButton(
                          onPressed: busy ? null : onDelete,
                          icon: const Icon(Icons.delete_outline),
                          tooltip: 'Delete saved video',
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
}

class _Thumb extends StatelessWidget {
  const _Thumb({required this.scriptNumber, required this.video});

  final int scriptNumber;
  final GeneratedVideoEntity? video;

  @override
  Widget build(BuildContext context) {
    final thumb = video?.thumbnailPath;
    if (thumb != null && File(thumb).existsSync()) {
      return Image.file(File(thumb), fit: BoxFit.cover);
    }
    return Container(
      color: AppColors.teal.withValues(alpha: 0.12),
      alignment: Alignment.center,
      child: Text(
        '#$scriptNumber',
        style: const TextStyle(
          color: AppColors.tealDark,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}
