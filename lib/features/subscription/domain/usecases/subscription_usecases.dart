import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/subscription/domain/entities/plan_entity.dart';
import 'package:leroy_ai/features/subscription/domain/repositories/subscription_repository.dart';

class GetPlansUseCase {
  GetPlansUseCase(this._repo);
  final SubscriptionRepository _repo;
  ResultFuture<List<PlanEntity>> call() => _repo.getPlans();
}

class GetCurrentPlanUseCase {
  GetCurrentPlanUseCase(this._repo);
  final SubscriptionRepository _repo;
  ResultFuture<String> call(String userId) => _repo.getCurrentPlan(userId);
}

class SelectPlanUseCase {
  SelectPlanUseCase(this._repo);
  final SubscriptionRepository _repo;
  ResultFuture<void> call(String userId, String planId) =>
      _repo.selectPlan(userId, planId);
}
