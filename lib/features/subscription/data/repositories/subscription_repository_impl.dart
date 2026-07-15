import 'package:dartz/dartz.dart';

import '../../../../core/errors/error_mapper.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/subscription_plan.dart';
import '../../domain/repositories/subscription_repository.dart';
import '../datasources/subscription_demo_datasource.dart';

class SubscriptionRepositoryImpl implements SubscriptionRepository {
  SubscriptionRepositoryImpl(this._demo);
  final SubscriptionDemoDataSource _demo;

  @override
  ResultFuture<List<SubscriptionPlan>> getPlans() async {
    try {
      return Right(await _demo.getPlans());
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<String> getCurrentPlanId() async {
    try {
      return Right(await _demo.getCurrentPlanId());
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<String> subscribe(String planId) async {
    try {
      return Right(await _demo.subscribe(planId));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }
}
