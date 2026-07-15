import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';
import 'package:leroy_ai/features/image_generator/domain/entities/generated_image_entity.dart';
import 'package:leroy_ai/shared/providers/dependency_providers.dart';

class ImageGenState {
  const ImageGenState({
    this.history = const [],
    this.latest,
    this.isGenerating = false,
    this.isLoading = false,
    this.style = 'cinematic',
    this.aspectRatio = '1:1',
    this.error,
  });

  final List<GeneratedImageEntity> history;
  final GeneratedImageEntity? latest;
  final bool isGenerating;
  final bool isLoading;
  final String style;
  final String aspectRatio;
  final String? error;

  ImageGenState copyWith({
    List<GeneratedImageEntity>? history,
    GeneratedImageEntity? latest,
    bool? isGenerating,
    bool? isLoading,
    String? style,
    String? aspectRatio,
    String? error,
    bool clearError = false,
  }) {
    return ImageGenState(
      history: history ?? this.history,
      latest: latest ?? this.latest,
      isGenerating: isGenerating ?? this.isGenerating,
      isLoading: isLoading ?? this.isLoading,
      style: style ?? this.style,
      aspectRatio: aspectRatio ?? this.aspectRatio,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class ImageGenNotifier extends StateNotifier<ImageGenState> {
  ImageGenNotifier(this._ref) : super(const ImageGenState()) {
    loadHistory();
  }

  final Ref _ref;

  Future<void> loadHistory() async {
    final userId = _ref.read(currentUserProvider)?.id;
    if (userId == null) return;
    state = state.copyWith(isLoading: true, clearError: true);
    final result = await _ref.read(getImageHistoryUseCaseProvider).call(userId);
    result.fold(
      (f) => state = state.copyWith(isLoading: false, error: f.message),
      (history) =>
          state = state.copyWith(history: history, isLoading: false),
    );
  }

  void setStyle(String style) => state = state.copyWith(style: style);
  void setAspect(String aspect) => state = state.copyWith(aspectRatio: aspect);

  Future<void> generate(String prompt) async {
    final userId = _ref.read(currentUserProvider)?.id;
    if (userId == null) return;
    state = state.copyWith(isGenerating: true, clearError: true);
    final result = await _ref.read(generateImageUseCaseProvider).call(
          userId: userId,
          prompt: prompt,
          style: state.style,
          aspectRatio: state.aspectRatio,
        );
    result.fold(
      (f) => state = state.copyWith(isGenerating: false, error: f.message),
      (image) => state = state.copyWith(
        isGenerating: false,
        latest: image,
        history: [image, ...state.history],
      ),
    );
  }
}

final imageGenProvider =
    StateNotifierProvider<ImageGenNotifier, ImageGenState>((ref) {
  return ImageGenNotifier(ref);
});
