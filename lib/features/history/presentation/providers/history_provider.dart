import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';
import 'package:leroy_ai/features/history/domain/entities/history_item.dart';
import 'package:leroy_ai/shared/providers/dependency_providers.dart';

class HistoryState {
  const HistoryState({
    this.items = const [],
    this.isLoading = false,
    this.query = '',
    this.error,
  });

  final List<HistoryItem> items;
  final bool isLoading;
  final String query;
  final String? error;

  HistoryState copyWith({
    List<HistoryItem>? items,
    bool? isLoading,
    String? query,
    String? error,
    bool clearError = false,
  }) {
    return HistoryState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      query: query ?? this.query,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class HistoryNotifier extends StateNotifier<HistoryState> {
  HistoryNotifier(this._ref) : super(const HistoryState()) {
    load();
  }

  final Ref _ref;

  Future<void> load() async {
    final userId = _ref.read(currentUserProvider)?.id;
    if (userId == null) return;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final items = await _ref
          .read(historyDataSourceProvider)
          .getHistory(userId, query: state.query);
      state = state.copyWith(items: items, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> setQuery(String query) async {
    state = state.copyWith(query: query);
    await load();
  }

  Future<void> delete(String id) async {
    await _ref.read(historyDataSourceProvider).deleteHistoryItem(id);
    state = state.copyWith(
      items: state.items.where((i) => i.id != id).toList(),
    );
  }
}

final historyProvider =
    StateNotifierProvider<HistoryNotifier, HistoryState>((ref) {
  return HistoryNotifier(ref);
});
