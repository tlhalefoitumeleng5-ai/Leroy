import '../../../../core/utils/typedefs.dart';
import '../../../../core/utils/usecase.dart';
import '../entities/generated_image.dart';
import '../repositories/image_repository.dart';

class GenerateImageUseCase implements UseCase<GeneratedImage, GenerateImageParams> {
  GenerateImageUseCase(this._repository);
  final ImageRepository _repository;

  @override
  ResultFuture<GeneratedImage> call(GenerateImageParams params) {
    return _repository.generate(
      prompt: params.prompt,
      style: params.style,
      aspectRatio: params.aspectRatio,
    );
  }
}

class GenerateImageParams {
  const GenerateImageParams({
    required this.prompt,
    required this.style,
    required this.aspectRatio,
  });
  final String prompt;
  final ImageStyle style;
  final ImageAspectRatio aspectRatio;
}
