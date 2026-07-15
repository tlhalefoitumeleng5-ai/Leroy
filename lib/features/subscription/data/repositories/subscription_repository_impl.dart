import 'package:dartz/dartz.dart';
import 'package:leroy_ai/core/errors/error_mapper.dart';
import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/subscription/data/datasources/subscription_datasource.dart';
import 'package:leroy_ai/features/subscription/domain/entities/plan_entity.dart';
import 'package:leroy_ai/features/subscription/domain/repositories/subscription_repository.dart';

class SubscriptionRepositoryImpl implements SubscriptionRepository {
  SubscriptionRepositoryImpl(this._remote);
  final SubscriptionDataSource _remote;

  @override
  ResultFuture<List<PlanEntity>> getPlans() async {
    try {
      return Right(await _remote.getPlans());
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<String> getCurrentPlan(String userId) async {
    try {
      return Right(await _remote.getCurrentPlan(userId));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<void> selectPlan(String userId, String planId) async {
    try {
      await _remote.selectPlan(userId, planId);
      return const Right(null);
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<String> startCheckout({
    required String userId,
    required String planId,
    required String provider,
  }) async {
    try {
      return Right(await _remote.startCheckout(
        userId: userId,
        planId: planId,
        provider: provider,
      ));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }
}
