import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';
import 'package:leroy_ai/features/subscription/domain/entities/plan_entity.dart';
import 'package:leroy_ai/shared/providers/dependency_providers.dart';

class SubscriptionState {
  const SubscriptionState({
    this.plans = const [],
    this.selectedPlanId = 'free',
    this.currentPlanId = 'free',
    this.isLoading = false,
    this.isSaving = false,
    this.error,
  });

  final List<PlanEntity> plans;
  final String selectedPlanId;
  final String currentPlanId;
  final bool isLoading;
  final bool isSaving;
  final String? error;

  SubscriptionState copyWith({
    List<PlanEntity>? plans,
    String? selectedPlanId,
    String? currentPlanId,
    bool? isLoading,
    bool? isSaving,
    String? error,
    bool clearError = false,
  }) {
    return SubscriptionState(
      plans: plans ?? this.plans,
      selectedPlanId: selectedPlanId ?? this.selectedPlanId,
      currentPlanId: currentPlanId ?? this.currentPlanId,
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class SubscriptionNotifier extends StateNotifier<SubscriptionState> {
  SubscriptionNotifier(this._ref) : super(const SubscriptionState()) {
    load();
  }

  final Ref _ref;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final plansResult = await _ref.read(getPlansUseCaseProvider).call();
    final userId = _ref.read(currentUserProvider)?.id ?? 'demo';
    final currentResult =
        await _ref.read(getCurrentPlanUseCaseProvider).call(userId);

    String current = 'free';
    currentResult.fold((_) {}, (v) => current = v);

    plansResult.fold(
      (f) => state = state.copyWith(isLoading: false, error: f.message),
      (plans) => state = state.copyWith(
        plans: plans,
        currentPlanId: current,
        selectedPlanId: current,
        isLoading: false,
      ),
    );
  }

  void select(String planId) {
    state = state.copyWith(selectedPlanId: planId);
  }

  Future<bool> confirm() async {
    final userId = _ref.read(currentUserProvider)?.id ?? 'demo';
    state = state.copyWith(isSaving: true, clearError: true);
    final result = await _ref
        .read(selectPlanUseCaseProvider)
        .call(userId, state.selectedPlanId);
    return result.fold(
      (f) {
        state = state.copyWith(isSaving: false, error: f.message);
        return false;
      },
      (_) {
        state = state.copyWith(
          isSaving: false,
          currentPlanId: state.selectedPlanId,
        );
        return true;
      },
    );
  }
}

final subscriptionProvider =
    StateNotifierProvider<SubscriptionNotifier, SubscriptionState>((ref) {
  return SubscriptionNotifier(ref);
});
