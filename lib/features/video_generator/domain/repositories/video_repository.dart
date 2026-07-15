import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/video_generator/domain/entities/generated_video_entity.dart';

abstract class VideoRepository {
  ResultFuture<GeneratedVideoEntity> generate({
    required String userId,
    required String prompt,
    required int durationSeconds,
    required String quality,
    required bool voiceEnabled,
    required bool musicEnabled,
  });

  ResultFuture<List<GeneratedVideoEntity>> getHistory(String userId);
  ResultFuture<void> deleteVideo(String userId, String videoId);
}
