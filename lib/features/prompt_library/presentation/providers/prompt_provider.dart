import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/features/prompt_library/domain/entities/prompt_entity.dart';
import 'package:leroy_ai/shared/providers/dependency_providers.dart';

class PromptLibraryState {
  const PromptLibraryState({
    this.prompts = const [],
    this.categories = const ['All'],
    this.selectedCategory = 'All',
    this.query = '',
    this.isLoading = false,
    this.error,
  });

  final List<PromptEntity> prompts;
  final List<String> categories;
  final String selectedCategory;
  final String query;
  final bool isLoading;
  final String? error;

  PromptLibraryState copyWith({
    List<PromptEntity>? prompts,
    List<String>? categories,
    String? selectedCategory,
    String? query,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return PromptLibraryState(
      prompts: prompts ?? this.prompts,
      categories: categories ?? this.categories,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      query: query ?? this.query,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class PromptLibraryNotifier extends StateNotifier<PromptLibraryState> {
  PromptLibraryNotifier(this._ref) : super(const PromptLibraryState()) {
    bootstrap();
  }

  final Ref _ref;

  Future<void> bootstrap() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final cats =
        await _ref.read(getPromptCategoriesUseCaseProvider).call();
    cats.fold(
      (f) => state = state.copyWith(error: f.message),
      (c) => state = state.copyWith(categories: c),
    );
    await load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final result = await _ref.read(getPromptsUseCaseProvider).call(
          category: state.selectedCategory,
          query: state.query,
        );
    result.fold(
      (f) => state = state.copyWith(isLoading: false, error: f.message),
      (prompts) =>
          state = state.copyWith(prompts: prompts, isLoading: false),
    );
  }

  Future<void> setCategory(String category) async {
    state = state.copyWith(selectedCategory: category);
    await load();
  }

  Future<void> setQuery(String query) async {
    state = state.copyWith(query: query);
    await load();
  }

  Future<void> toggleFavorite(String id) async {
    final result =
        await _ref.read(toggleFavoritePromptUseCaseProvider).call(id);
    result.fold(
      (f) => state = state.copyWith(error: f.message),
      (updated) {
        final list = state.prompts
            .map((p) => p.id == updated.id ? updated : p)
            .toList();
        state = state.copyWith(prompts: list);
      },
    );
  }
}

final promptLibraryProvider =
    StateNotifierProvider<PromptLibraryNotifier, PromptLibraryState>((ref) {
  return PromptLibraryNotifier(ref);
});
