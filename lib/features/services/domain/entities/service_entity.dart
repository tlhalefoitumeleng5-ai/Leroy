import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

/// A Leroy AI Solutions business service offering.
class ServiceEntity extends Equatable {
  const ServiceEntity({
    required this.id,
    required this.title,
    required this.description,
    required this.priceLabel,
    required this.icon,
    this.isFeatured = false,
  });

  final String id;
  final String title;
  final String description;

  /// Price shown in South African Rands (ZAR), e.g. `R3,500 setup + R400/month`.
  final String priceLabel;
  final IconData icon;
  final bool isFeatured;

  @override
  List<Object?> get props =>
      [id, title, description, priceLabel, icon, isFeatured];
}
