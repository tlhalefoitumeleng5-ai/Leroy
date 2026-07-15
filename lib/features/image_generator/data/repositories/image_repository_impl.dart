import 'package:dartz/dartz.dart';
import 'package:leroy_ai/core/errors/error_mapper.dart';
import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/image_generator/data/datasources/image_remote_datasource.dart';
import 'package:leroy_ai/features/image_generator/domain/entities/generated_image_entity.dart';
import 'package:leroy_ai/features/image_generator/domain/repositories/image_repository.dart';

class ImageRepositoryImpl implements ImageRepository {
  ImageRepositoryImpl(this._remote);
  final ImageRemoteDataSource _remote;

  @override
  ResultFuture<GeneratedImageEntity> generate({
    required String userId,
    required String prompt,
    String style = 'cinematic',
    String aspectRatio = '1:1',
  }) async {
    try {
      return Right(await _remote.generate(
        userId: userId,
        prompt: prompt,
        style: style,
        aspectRatio: aspectRatio,
      ));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<List<GeneratedImageEntity>> getHistory(String userId) async {
    try {
      return Right(await _remote.getHistory(userId));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }
}
