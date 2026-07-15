import '../../../../core/utils/typedefs.dart';
import '../entities/subscription_plan.dart';

abstract class SubscriptionRepository {
  ResultFuture<List<SubscriptionPlan>> getPlans();
  ResultFuture<String> getCurrentPlanId();
  ResultFuture<String> subscribe(String planId);
}
