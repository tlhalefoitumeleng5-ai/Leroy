import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';
import 'package:leroy_ai/features/video_generator/domain/entities/generated_video_entity.dart';
import 'package:leroy_ai/shared/providers/dependency_providers.dart';

class VideoGenState {
  const VideoGenState({
    this.history = const [],
    this.latest,
    this.isGenerating = false,
    this.isLoading = false,
    this.durationSeconds = 5,
    this.quality = 'hd',
    this.voiceEnabled = false,
    this.musicEnabled = true,
    this.error,
  });

  final List<GeneratedVideoEntity> history;
  final GeneratedVideoEntity? latest;
  final bool isGenerating;
  final bool isLoading;
  final int durationSeconds;
  final String quality;
  final bool voiceEnabled;
  final bool musicEnabled;
  final String? error;

  VideoGenState copyWith({
    List<GeneratedVideoEntity>? history,
    GeneratedVideoEntity? latest,
    bool? isGenerating,
    bool? isLoading,
    int? durationSeconds,
    String? quality,
    bool? voiceEnabled,
    bool? musicEnabled,
    String? error,
    bool clearError = false,
  }) {
    return VideoGenState(
      history: history ?? this.history,
      latest: latest ?? this.latest,
      isGenerating: isGenerating ?? this.isGenerating,
      isLoading: isLoading ?? this.isLoading,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      quality: quality ?? this.quality,
      voiceEnabled: voiceEnabled ?? this.voiceEnabled,
      musicEnabled: musicEnabled ?? this.musicEnabled,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class VideoGenNotifier extends StateNotifier<VideoGenState> {
  VideoGenNotifier(this._ref) : super(const VideoGenState()) {
    loadHistory();
  }

  final Ref _ref;

  Future<void> loadHistory() async {
    final userId = _ref.read(currentUserProvider)?.id;
    if (userId == null) return;
    state = state.copyWith(isLoading: true, clearError: true);
    final result = await _ref.read(getVideoHistoryUseCaseProvider).call(userId);
    result.fold(
      (f) => state = state.copyWith(isLoading: false, error: f.message),
      (history) => state = state.copyWith(history: history, isLoading: false),
    );
  }

  void setDuration(int seconds) =>
      state = state.copyWith(durationSeconds: seconds);
  void setQuality(String quality) => state = state.copyWith(quality: quality);
  void setVoice(bool v) => state = state.copyWith(voiceEnabled: v);
  void setMusic(bool v) => state = state.copyWith(musicEnabled: v);

  Future<void> generate(String prompt) async {
    final userId = _ref.read(currentUserProvider)?.id;
    if (userId == null) return;
    state = state.copyWith(isGenerating: true, clearError: true);
    final result = await _ref.read(generateVideoUseCaseProvider).call(
          userId: userId,
          prompt: prompt,
          durationSeconds: state.durationSeconds,
          quality: state.quality,
          voiceEnabled: state.voiceEnabled,
          musicEnabled: state.musicEnabled,
        );
    result.fold(
      (f) => state = state.copyWith(isGenerating: false, error: f.message),
      (video) => state = state.copyWith(
        isGenerating: false,
        latest: video,
        history: [video, ...state.history],
      ),
    );
  }
}

final videoGenProvider =
    StateNotifierProvider<VideoGenNotifier, VideoGenState>((ref) {
  return VideoGenNotifier(ref);
});
