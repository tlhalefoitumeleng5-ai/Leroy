import '../../../../core/utils/typedefs.dart';
import '../../../../core/utils/usecase.dart';
import '../entities/subscription_plan.dart';
import '../repositories/subscription_repository.dart';

class GetPlansUseCase implements UseCaseNoParams<List<SubscriptionPlan>> {
  GetPlansUseCase(this._repository);
  final SubscriptionRepository _repository;

  @override
  ResultFuture<List<SubscriptionPlan>> call() => _repository.getPlans();
}

class SubscribeUseCase implements UseCase<String, SubscribeParams> {
  SubscribeUseCase(this._repository);
  final SubscriptionRepository _repository;

  @override
  ResultFuture<String> call(SubscribeParams params) {
    return _repository.subscribe(params.planId);
  }
}

class SubscribeParams {
  const SubscribeParams({required this.planId});
  final String planId;
}
