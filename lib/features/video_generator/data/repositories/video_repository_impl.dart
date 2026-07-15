import 'package:dartz/dartz.dart';
import 'package:leroy_ai/core/errors/error_mapper.dart';
import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/video_generator/data/datasources/video_remote_datasource.dart';
import 'package:leroy_ai/features/video_generator/domain/entities/generated_video_entity.dart';
import 'package:leroy_ai/features/video_generator/domain/repositories/video_repository.dart';

class VideoRepositoryImpl implements VideoRepository {
  VideoRepositoryImpl(this._remote);
  final VideoRemoteDataSource _remote;

  @override
  ResultFuture<GeneratedVideoEntity> generate({
    required String userId,
    required String prompt,
    required int durationSeconds,
    required String quality,
    required bool voiceEnabled,
    required bool musicEnabled,
  }) async {
    try {
      return Right(await _remote.generate(
        userId: userId,
        prompt: prompt,
        durationSeconds: durationSeconds,
        quality: quality,
        voiceEnabled: voiceEnabled,
        musicEnabled: musicEnabled,
      ));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<List<GeneratedVideoEntity>> getHistory(String userId) async {
    try {
      return Right(await _remote.getHistory(userId));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<void> deleteVideo(String userId, String videoId) async {
    try {
      await _remote.deleteVideo(userId, videoId);
      return const Right(null);
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }
}
