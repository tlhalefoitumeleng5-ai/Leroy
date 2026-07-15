import 'package:dartz/dartz.dart';
import 'package:leroy_ai/core/errors/error_mapper.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/prompt_library/data/datasources/prompt_remote_datasource.dart';
import 'package:leroy_ai/features/prompt_library/domain/entities/prompt_entity.dart';
import 'package:leroy_ai/features/prompt_library/domain/repositories/prompt_repository.dart';

class PromptRepositoryImpl implements PromptRepository {
  PromptRepositoryImpl(this._remote);
  final PromptRemoteDataSource _remote;

  @override
  ResultFuture<List<PromptEntity>> getPrompts({
    String? category,
    String? query,
  }) async {
    try {
      return Right(await _remote.getPrompts(category: category, query: query));
    } catch (e) {
      return Left(mapExceptionToFailure(ServerException(e.toString())));
    }
  }

  @override
  ResultFuture<PromptEntity> toggleFavorite(String promptId) async {
    try {
      return Right(await _remote.toggleFavorite(promptId));
    } catch (e) {
      return Left(mapExceptionToFailure(ServerException(e.toString())));
    }
  }

  @override
  ResultFuture<List<String>> getCategories() async {
    try {
      return Right(await _remote.getCategories());
    } catch (e) {
      return Left(mapExceptionToFailure(ServerException(e.toString())));
    }
  }
}
