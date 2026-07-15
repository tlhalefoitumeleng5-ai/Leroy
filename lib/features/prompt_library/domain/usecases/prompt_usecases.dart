import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/prompt_library/domain/entities/prompt_entity.dart';
import 'package:leroy_ai/features/prompt_library/domain/repositories/prompt_repository.dart';

class GetPromptsUseCase {
  GetPromptsUseCase(this._repo);
  final PromptRepository _repo;
  ResultFuture<List<PromptEntity>> call({String? category, String? query}) =>
      _repo.getPrompts(category: category, query: query);
}

class ToggleFavoritePromptUseCase {
  ToggleFavoritePromptUseCase(this._repo);
  final PromptRepository _repo;
  ResultFuture<PromptEntity> call(String promptId) =>
      _repo.toggleFavorite(promptId);
}

class GetPromptCategoriesUseCase {
  GetPromptCategoriesUseCase(this._repo);
  final PromptRepository _repo;
  ResultFuture<List<String>> call() => _repo.getCategories();
}
