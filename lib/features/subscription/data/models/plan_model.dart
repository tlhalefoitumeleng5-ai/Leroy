import 'package:leroy_ai/features/subscription/domain/entities/plan_entity.dart';

class PlanModel extends PlanEntity {
  const PlanModel({
    required super.id,
    required super.name,
    required super.priceLabel,
    required super.period,
    required super.features,
    super.isPopular,
  });
}
