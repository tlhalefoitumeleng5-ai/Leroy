import 'package:equatable/equatable.dart';

class SubscriptionPlan extends Equatable {
  const SubscriptionPlan({
    required this.id,
    required this.name,
    required this.priceLabel,
    required this.period,
    required this.features,
    this.highlighted = false,
  });

  final String id;
  final String name;
  final String priceLabel;
  final String period;
  final List<String> features;
  final bool highlighted;

  @override
  List<Object?> get props => [id, name, priceLabel, period, features, highlighted];
}
