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

  factory PlanModel.fromMap(Map<String, dynamic> map) {
    return PlanModel(
      id: map['id'] as String? ?? '',
      name: map['name'] as String? ?? '',
      priceLabel: map['priceLabel'] as String? ?? '',
      period: map['period'] as String? ?? '/month',
      features: (map['features'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
      isPopular: map['isPopular'] as bool? ?? false,
    );
  }
}
