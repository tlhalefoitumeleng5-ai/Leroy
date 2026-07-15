import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/di/providers.dart';
import '../../../auth/data/datasources/auth_demo_datasource.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/subscription_demo_datasource.dart';
import '../../data/repositories/subscription_repository_impl.dart';
import '../../domain/entities/subscription_plan.dart';
import '../../domain/repositories/subscription_repository.dart';

final subscriptionDemoDataSourceProvider = Provider((ref) {
  return SubscriptionDemoDataSource(ref.watch(sharedPreferencesProvider));
});

final subscriptionRepositoryProvider = Provider<SubscriptionRepository>((ref) {
  return SubscriptionRepositoryImpl(ref.watch(subscriptionDemoDataSourceProvider));
});

final subscriptionPlansProvider = FutureProvider<List<SubscriptionPlan>>((ref) async {
  final result = await ref.watch(subscriptionRepositoryProvider).getPlans();
  return result.fold((f) => throw Exception(f.message), (p) => p);
});

final currentPlanIdProvider = FutureProvider<String>((ref) async {
  final result = await ref.watch(subscriptionRepositoryProvider).getCurrentPlanId();
  return result.fold((f) => 'free', (id) => id);
});

class SubscriptionController extends StateNotifier<AsyncValue<void>> {
  SubscriptionController(this._ref) : super(const AsyncData(null));

  final Ref _ref;

  Future<bool> subscribe(String planId) async {
    state = const AsyncLoading();
    final result = await _ref.read(subscriptionRepositoryProvider).subscribe(planId);
    return result.fold(
      (f) {
        state = AsyncError(f.message, StackTrace.current);
        return false;
      },
      (id) {
        final demo = _ref.read(authRemoteDataSourceProvider);
        if (demo is AuthDemoDataSource) {
          demo.updatePlan(id);
        }
        _ref.invalidate(currentPlanIdProvider);
        _ref.invalidate(authStateProvider);
        state = const AsyncData(null);
        return true;
      },
    );
  }
}

final subscriptionControllerProvider =
    StateNotifierProvider<SubscriptionController, AsyncValue<void>>((ref) {
  return SubscriptionController(ref);
});
