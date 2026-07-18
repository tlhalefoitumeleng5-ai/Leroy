import 'package:dartz/dartz.dart';
import 'package:leroy_ai/core/errors/failures.dart';
import 'package:leroy_ai/features/video_studio/data/scripts/leroy_video_scripts.dart';
import 'package:leroy_ai/features/video_studio/domain/entities/generated_video_entity.dart';
import 'package:leroy_ai/features/video_studio/domain/repositories/video_studio_repository.dart';

class LoadVideoLibraryUseCase {
  LoadVideoLibraryUseCase(this._repo);
  final VideoStudioRepository _repo;
  Future<Either<Failure, List<GeneratedVideoEntity>>> call() =>
      _repo.loadLibrary();
}

class RenderVideoUseCase {
  RenderVideoUseCase(this._repo);
  final VideoStudioRepository _repo;

  Future<Either<Failure, GeneratedVideoEntity>> call({
    required VideoScript script,
    required void Function(double progress, String stage) onProgress,
  }) {
    return _repo.renderVideo(script: script, onProgress: onProgress);
  }
}

class RenderAllVideosUseCase {
  RenderAllVideosUseCase(this._repo);
  final VideoStudioRepository _repo;

  Future<Either<Failure, List<GeneratedVideoEntity>>> call({
    required void Function(
      int current,
      int total,
      double videoProgress,
      String stage,
    ) onProgress,
    required bool Function() isCancelled,
  }) {
    return _repo.renderAll(onProgress: onProgress, isCancelled: isCancelled);
  }
}

class DeleteGeneratedVideoUseCase {
  DeleteGeneratedVideoUseCase(this._repo);
  final VideoStudioRepository _repo;
  Future<Either<Failure, Unit>> call(GeneratedVideoEntity video) =>
      _repo.deleteVideo(video);
}
