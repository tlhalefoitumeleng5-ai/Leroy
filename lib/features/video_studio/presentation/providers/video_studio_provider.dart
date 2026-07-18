import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/features/video_studio/data/scripts/leroy_video_scripts.dart';
import 'package:leroy_ai/features/video_studio/domain/entities/generated_video_entity.dart';
import 'package:leroy_ai/shared/providers/dependency_providers.dart';

class VideoStudioState {
  const VideoStudioState({
    this.library = const [],
    this.isLoading = false,
    this.isRendering = false,
    this.isBatch = false,
    this.progress = 0,
    this.batchCurrent = 0,
    this.batchTotal = 50,
    this.stage = '',
    this.error,
    this.latest,
    this.cancelRequested = false,
  });

  final List<GeneratedVideoEntity> library;
  final bool isLoading;
  final bool isRendering;
  final bool isBatch;
  final double progress;
  final int batchCurrent;
  final int batchTotal;
  final String stage;
  final String? error;
  final GeneratedVideoEntity? latest;
  final bool cancelRequested;

  VideoStudioState copyWith({
    List<GeneratedVideoEntity>? library,
    bool? isLoading,
    bool? isRendering,
    bool? isBatch,
    double? progress,
    int? batchCurrent,
    int? batchTotal,
    String? stage,
    String? error,
    GeneratedVideoEntity? latest,
    bool? cancelRequested,
    bool clearError = false,
  }) {
    return VideoStudioState(
      library: library ?? this.library,
      isLoading: isLoading ?? this.isLoading,
      isRendering: isRendering ?? this.isRendering,
      isBatch: isBatch ?? this.isBatch,
      progress: progress ?? this.progress,
      batchCurrent: batchCurrent ?? this.batchCurrent,
      batchTotal: batchTotal ?? this.batchTotal,
      stage: stage ?? this.stage,
      error: clearError ? null : (error ?? this.error),
      latest: latest ?? this.latest,
      cancelRequested: cancelRequested ?? this.cancelRequested,
    );
  }

  GeneratedVideoEntity? videoForScript(int number) {
    for (final v in library) {
      if (v.scriptNumber == number) return v;
    }
    return null;
  }
}

class VideoStudioNotifier extends StateNotifier<VideoStudioState> {
  VideoStudioNotifier(this._ref) : super(const VideoStudioState()) {
    loadLibrary();
  }

  final Ref _ref;

  List<VideoScript> get scripts => LeroyVideoScripts.all;

  Future<void> loadLibrary() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final result = await _ref.read(loadVideoLibraryUseCaseProvider).call();
    result.fold(
      (f) => state = state.copyWith(isLoading: false, error: f.message),
      (lib) => state = state.copyWith(library: lib, isLoading: false),
    );
  }

  Future<GeneratedVideoEntity?> renderOne(VideoScript script) async {
    if (state.isRendering) return null;
    state = state.copyWith(
      isRendering: true,
      isBatch: false,
      progress: 0,
      stage: 'Starting…',
      clearError: true,
      cancelRequested: false,
    );
    final result = await _ref.read(renderVideoUseCaseProvider).call(
          script: script,
          onProgress: (p, stage) {
            state = state.copyWith(progress: p, stage: stage);
          },
        );
    return result.fold(
      (f) {
        state = state.copyWith(
          isRendering: false,
          error: f.message,
          stage: 'Failed',
        );
        return null;
      },
      (video) {
        final next = [
          video,
          ...state.library.where((v) => v.scriptNumber != video.scriptNumber),
        ];
        state = state.copyWith(
          isRendering: false,
          library: next,
          latest: video,
          progress: 1,
          stage: 'Complete',
        );
        return video;
      },
    );
  }

  Future<void> renderAll() async {
    if (state.isRendering) return;
    state = state.copyWith(
      isRendering: true,
      isBatch: true,
      progress: 0,
      batchCurrent: 0,
      batchTotal: scripts.length,
      stage: 'Starting batch…',
      clearError: true,
      cancelRequested: false,
    );

    final result = await _ref.read(renderAllVideosUseCaseProvider).call(
          onProgress: (current, total, videoProgress, stage) {
            state = state.copyWith(
              batchCurrent: current,
              batchTotal: total,
              progress: ((current - 1) + videoProgress) / total,
              stage: 'Video $current/$total — $stage',
            );
          },
          isCancelled: () => state.cancelRequested,
        );

    result.fold(
      (f) => state = state.copyWith(
        isRendering: false,
        isBatch: false,
        error: f.message,
        stage: 'Batch failed',
      ),
      (videos) async {
        await loadLibrary();
        state = state.copyWith(
          isRendering: false,
          isBatch: false,
          latest: videos.isNotEmpty ? videos.last : state.latest,
          progress: 1,
          stage: state.cancelRequested
              ? 'Cancelled after ${videos.length} videos'
              : 'All ${videos.length} videos ready',
        );
      },
    );
  }

  void cancelBatch() {
    state = state.copyWith(cancelRequested: true, stage: 'Cancelling…');
  }

  Future<void> deleteVideo(GeneratedVideoEntity video) async {
    final result =
        await _ref.read(deleteGeneratedVideoUseCaseProvider).call(video);
    result.fold(
      (f) => state = state.copyWith(error: f.message),
      (_) => loadLibrary(),
    );
  }
}

final videoStudioProvider =
    StateNotifierProvider<VideoStudioNotifier, VideoStudioState>((ref) {
  return VideoStudioNotifier(ref);
});
