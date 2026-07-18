import 'package:dartz/dartz.dart';
import 'package:leroy_ai/core/errors/failures.dart';
import 'package:leroy_ai/features/video_studio/data/scripts/leroy_video_scripts.dart';
import 'package:leroy_ai/features/video_studio/domain/entities/generated_video_entity.dart';

abstract class VideoStudioRepository {
  List<VideoScript> get scripts;

  Future<Either<Failure, List<GeneratedVideoEntity>>> loadLibrary();

  Future<Either<Failure, GeneratedVideoEntity>> renderVideo({
    required VideoScript script,
    required void Function(double progress, String stage) onProgress,
  });

  Future<Either<Failure, List<GeneratedVideoEntity>>> renderAll({
    required void Function(
      int current,
      int total,
      double videoProgress,
      String stage,
    ) onProgress,
    required bool Function() isCancelled,
  });

  Future<Either<Failure, Unit>> deleteVideo(GeneratedVideoEntity video);
}
