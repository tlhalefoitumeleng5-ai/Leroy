import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/datasources/image_demo_datasource.dart';
import '../../data/repositories/image_repository_impl.dart';
import '../../domain/entities/generated_image.dart';
import '../../domain/repositories/image_repository.dart';
import '../../domain/usecases/generate_image_usecase.dart';

final imageDemoDataSourceProvider = Provider((ref) => ImageDemoDataSource());

final imageRepositoryProvider = Provider<ImageRepository>((ref) {
  return ImageRepositoryImpl(ref.watch(imageDemoDataSourceProvider));
});

final generateImageUseCaseProvider = Provider((ref) {
  return GenerateImageUseCase(ref.watch(imageRepositoryProvider));
});

class ImageGenState {
  const ImageGenState({
    this.prompt = '',
    this.style = ImageStyle.cinematic,
    this.aspectRatio = ImageAspectRatio.square,
    this.isGenerating = false,
    this.latest,
    this.history = const [],
    this.error,
  });

  final String prompt;
  final ImageStyle style;
  final ImageAspectRatio aspectRatio;
  final bool isGenerating;
  final GeneratedImage? latest;
  final List<GeneratedImage> history;
  final String? error;

  ImageGenState copyWith({
    String? prompt,
    ImageStyle? style,
    ImageAspectRatio? aspectRatio,
    bool? isGenerating,
    GeneratedImage? latest,
    List<GeneratedImage>? history,
    String? error,
    bool clearLatest = false,
  }) {
    return ImageGenState(
      prompt: prompt ?? this.prompt,
      style: style ?? this.style,
      aspectRatio: aspectRatio ?? this.aspectRatio,
      isGenerating: isGenerating ?? this.isGenerating,
      latest: clearLatest ? null : (latest ?? this.latest),
      history: history ?? this.history,
      error: error,
    );
  }
}

class ImageGenController extends StateNotifier<ImageGenState> {
  ImageGenController(this._useCase, this._repo) : super(const ImageGenState()) {
    _loadHistory();
  }

  final GenerateImageUseCase _useCase;
  final ImageRepository _repo;

  Future<void> _loadHistory() async {
    final result = await _repo.getHistory();
    result.fold(
      (_) {},
      (list) => state = state.copyWith(history: list),
    );
  }

  void setPrompt(String value) => state = state.copyWith(prompt: value);
  void setStyle(ImageStyle style) => state = state.copyWith(style: style);
  void setAspect(ImageAspectRatio ratio) => state = state.copyWith(aspectRatio: ratio);

  Future<void> generate() async {
    if (state.prompt.trim().isEmpty || state.isGenerating) return;
    state = state.copyWith(isGenerating: true, error: null);
    final result = await _useCase(GenerateImageParams(
      prompt: state.prompt,
      style: state.style,
      aspectRatio: state.aspectRatio,
    ));
    result.fold(
      (f) => state = state.copyWith(isGenerating: false, error: f.message),
      (img) => state = state.copyWith(
        isGenerating: false,
        latest: img,
        history: [img, ...state.history],
      ),
    );
  }
}

final imageGenControllerProvider =
    StateNotifierProvider<ImageGenController, ImageGenState>((ref) {
  return ImageGenController(
    ref.watch(generateImageUseCaseProvider),
    ref.watch(imageRepositoryProvider),
  );
});
