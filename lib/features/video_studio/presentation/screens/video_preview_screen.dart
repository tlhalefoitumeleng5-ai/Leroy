import 'dart:io';

import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:gal/gal.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/video_studio/domain/entities/generated_video_entity.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';

class VideoPreviewScreen extends StatefulWidget {
  const VideoPreviewScreen({super.key, required this.video});

  final GeneratedVideoEntity video;

  @override
  State<VideoPreviewScreen> createState() => _VideoPreviewScreenState();
}

class _VideoPreviewScreenState extends State<VideoPreviewScreen> {
  VideoPlayerController? _videoController;
  ChewieController? _chewie;
  String? _error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      final file = File(widget.video.filePath);
      if (!await file.exists()) {
        setState(() => _error = 'Video file not found on disk.');
        return;
      }
      final controller = VideoPlayerController.file(file);
      await controller.initialize();
      final chewie = ChewieController(
        videoPlayerController: controller,
        autoPlay: true,
        looping: false,
        allowFullScreen: true,
        materialProgressColors: ChewieProgressColors(
          playedColor: AppColors.teal,
          handleColor: AppColors.tealLight,
          bufferedColor: AppColors.teal.withValues(alpha: 0.3),
          backgroundColor: Colors.white24,
        ),
      );
      if (!mounted) return;
      setState(() {
        _videoController = controller;
        _chewie = chewie;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Could not open preview: $e');
    }
  }

  @override
  void dispose() {
    _chewie?.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _share() async {
    await Share.shareXFiles(
      [XFile(widget.video.filePath)],
      text: '${widget.video.title}\n#LeroyAI',
    );
  }

  Future<void> _download() async {
    try {
      final hasAccess = await Gal.hasAccess();
      if (!hasAccess) {
        final granted = await Gal.requestAccess();
        if (!granted) {
          if (mounted) {
            AppSnackBar.show(
              context,
              'Gallery permission is required to save videos.',
              isError: true,
            );
          }
          return;
        }
      }
      await Gal.putVideo(widget.video.filePath, album: 'Leroy AI');
      if (mounted) {
        AppSnackBar.show(context, 'Saved to gallery (Leroy AI album).');
      }
    } catch (e) {
      // Fallback: copy into Downloads-like app documents path already exists.
      if (mounted) {
        AppSnackBar.show(
          context,
          'Video is saved in-app at:\n${widget.video.filePath}',
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.video.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AspectRatio(
            aspectRatio: 9 / 16,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(22),
              child: ColoredBox(
                color: Colors.black,
                child: _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text(
                            _error!,
                            style: const TextStyle(color: Colors.white),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      )
                    : _chewie == null
                        ? const Center(
                            child: CircularProgressIndicator(
                              color: AppColors.teal,
                            ),
                          )
                        : Chewie(controller: _chewie!),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text(widget.video.topic, style: theme.textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(
            '${widget.video.durationSeconds.toStringAsFixed(0)}s  •  HD 1080p  •  MP4',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            widget.video.filePath,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 22),
          LeroyButton(
            label: 'Download / Save',
            icon: Icons.download_rounded,
            onPressed: _download,
          ),
          const SizedBox(height: 12),
          LeroyButton(
            label: 'Share',
            icon: Icons.ios_share_rounded,
            isOutlined: true,
            onPressed: _share,
          ),
        ],
      ),
    );
  }
}
