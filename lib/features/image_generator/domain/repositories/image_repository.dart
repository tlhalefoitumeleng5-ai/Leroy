import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/image_generator/domain/entities/generated_image_entity.dart';

abstract class ImageRepository {
  ResultFuture<GeneratedImageEntity> generate({
    required String userId,
    required String prompt,
    String style,
    String aspectRatio,
  });

  ResultFuture<List<GeneratedImageEntity>> getHistory(String userId);
}
