import '../../../../core/utils/typedefs.dart';
import '../entities/generated_image.dart';

abstract class ImageRepository {
  ResultFuture<GeneratedImage> generate({
    required String prompt,
    required ImageStyle style,
    required ImageAspectRatio aspectRatio,
  });
  ResultFuture<List<GeneratedImage>> getHistory();
  ResultVoid clearHistory();
}
