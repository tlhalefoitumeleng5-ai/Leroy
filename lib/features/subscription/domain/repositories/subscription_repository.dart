import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/subscription/domain/entities/plan_entity.dart';

abstract class SubscriptionRepository {
  ResultFuture<List<PlanEntity>> getPlans();
  ResultFuture<String> getCurrentPlan(String userId);
  ResultFuture<void> selectPlan(String userId, String planId);
  ResultFuture<String> startCheckout({
    required String userId,
    required String planId,
    required String provider,
  });
}
