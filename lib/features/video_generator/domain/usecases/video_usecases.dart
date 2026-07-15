import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/video_generator/domain/entities/generated_video_entity.dart';
import 'package:leroy_ai/features/video_generator/domain/repositories/video_repository.dart';

class GenerateVideoUseCase {
  GenerateVideoUseCase(this._repo);
  final VideoRepository _repo;

  ResultFuture<GeneratedVideoEntity> call({
    required String userId,
    required String prompt,
    required int durationSeconds,
    required String quality,
    required bool voiceEnabled,
    required bool musicEnabled,
  }) {
    return _repo.generate(
      userId: userId,
      prompt: prompt,
      durationSeconds: durationSeconds,
      quality: quality,
      voiceEnabled: voiceEnabled,
      musicEnabled: musicEnabled,
    );
  }
}

class GetVideoHistoryUseCase {
  GetVideoHistoryUseCase(this._repo);
  final VideoRepository _repo;
  ResultFuture<List<GeneratedVideoEntity>> call(String userId) =>
      _repo.getHistory(userId);
}

class DeleteVideoUseCase {
  DeleteVideoUseCase(this._repo);
  final VideoRepository _repo;
  ResultFuture<void> call(String userId, String videoId) =>
      _repo.deleteVideo(userId, videoId);
}
