import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/image_generator/domain/entities/generated_image_entity.dart';
import 'package:leroy_ai/features/image_generator/domain/repositories/image_repository.dart';

class GenerateImageUseCase {
  GenerateImageUseCase(this._repo);
  final ImageRepository _repo;

  ResultFuture<GeneratedImageEntity> call({
    required String userId,
    required String prompt,
    String style = 'cinematic',
    String aspectRatio = '1:1',
  }) {
    return _repo.generate(
      userId: userId,
      prompt: prompt,
      style: style,
      aspectRatio: aspectRatio,
    );
  }
}

class GetImageHistoryUseCase {
  GetImageHistoryUseCase(this._repo);
  final ImageRepository _repo;
  ResultFuture<List<GeneratedImageEntity>> call(String userId) =>
      _repo.getHistory(userId);
}

class DeleteImageUseCase {
  DeleteImageUseCase(this._repo);
  final ImageRepository _repo;
  ResultFuture<void> call(String userId, String imageId) =>
      _repo.deleteImage(userId, imageId);
}
