import 'package:dartz/dartz.dart';

import '../../../../core/errors/error_mapper.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/generated_image.dart';
import '../../domain/repositories/image_repository.dart';
import '../datasources/image_demo_datasource.dart';

class ImageRepositoryImpl implements ImageRepository {
  ImageRepositoryImpl(this._demo);
  final ImageDemoDataSource _demo;

  @override
  ResultFuture<GeneratedImage> generate({
    required String prompt,
    required ImageStyle style,
    required ImageAspectRatio aspectRatio,
  }) async {
    try {
      return Right(await _demo.generate(
        prompt: prompt,
        style: style,
        aspectRatio: aspectRatio,
      ));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<List<GeneratedImage>> getHistory() async {
    try {
      return Right(await _demo.getHistory());
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultVoid clearHistory() async {
    try {
      await _demo.clearHistory();
      return const Right(null);
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }
}
