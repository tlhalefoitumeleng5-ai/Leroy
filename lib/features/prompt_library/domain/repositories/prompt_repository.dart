import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/prompt_library/domain/entities/prompt_entity.dart';

abstract class PromptRepository {
  ResultFuture<List<PromptEntity>> getPrompts({String? category, String? query});
  ResultFuture<PromptEntity> toggleFavorite(String promptId);
  ResultFuture<List<String>> getCategories();
}
