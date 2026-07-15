import 'package:equatable/equatable.dart';

class PlanEntity extends Equatable {
  const PlanEntity({
    required this.id,
    required this.name,
    required this.priceLabel,
    required this.period,
    required this.features,
    this.isPopular = false,
  });

  final String id;
  final String name;
  final String priceLabel;
  final String period;
  final List<String> features;
  final bool isPopular;

  @override
  List<Object?> get props => [id, name, priceLabel, period, features, isPopular];
}
