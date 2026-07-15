import '../../../../core/utils/typedefs.dart';
import '../entities/prompt_entity.dart';

abstract class PromptRepository {
  ResultFuture<List<PromptEntity>> getPrompts({String? category, String? query});
  ResultFuture<List<String>> getCategories();
  ResultFuture<PromptEntity> toggleFavorite(String id);
}
