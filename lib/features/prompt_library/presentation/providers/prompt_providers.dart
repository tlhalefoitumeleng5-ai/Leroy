import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/datasources/prompt_local_datasource.dart';
import '../../data/repositories/prompt_repository_impl.dart';
import '../../domain/entities/prompt_entity.dart';
import '../../domain/repositories/prompt_repository.dart';
import '../../domain/usecases/get_prompts_usecase.dart';

final promptLocalDataSourceProvider = Provider((ref) => PromptLocalDataSource());

final promptRepositoryProvider = Provider<PromptRepository>((ref) {
  return PromptRepositoryImpl(ref.watch(promptLocalDataSourceProvider));
});

final getPromptsUseCaseProvider = Provider((ref) {
  return GetPromptsUseCase(ref.watch(promptRepositoryProvider));
});

final promptCategoryProvider = StateProvider<String>((ref) => 'All');
final promptQueryProvider = StateProvider<String>((ref) => '');

final promptCategoriesProvider = FutureProvider<List<String>>((ref) async {
  final result = await ref.watch(promptRepositoryProvider).getCategories();
  return result.fold((f) => ['All'], (c) => c);
});

final promptsProvider = FutureProvider<List<PromptEntity>>((ref) async {
  final category = ref.watch(promptCategoryProvider);
  final query = ref.watch(promptQueryProvider);
  final result = await ref.watch(getPromptsUseCaseProvider)(
    GetPromptsParams(category: category, query: query),
  );
  return result.fold((f) => throw Exception(f.message), (list) => list);
});
