import 'package:dartz/dartz.dart';

import '../../../../core/errors/error_mapper.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/prompt_entity.dart';
import '../../domain/repositories/prompt_repository.dart';
import '../datasources/prompt_local_datasource.dart';

class PromptRepositoryImpl implements PromptRepository {
  PromptRepositoryImpl(this._local);
  final PromptLocalDataSource _local;

  @override
  ResultFuture<List<PromptEntity>> getPrompts({String? category, String? query}) async {
    try {
      return Right(await _local.getPrompts(category: category, query: query));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<List<String>> getCategories() async {
    try {
      return Right(await _local.getCategories());
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<PromptEntity> toggleFavorite(String id) async {
    try {
      return Right(await _local.toggleFavorite(id));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }
}
