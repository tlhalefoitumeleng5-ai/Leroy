import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

class OnboardingPage extends Equatable {
  const OnboardingPage({
    required this.title,
    required this.description,
    required this.icon,
  });

  final String title;
  final String description;
  final IconData icon;

  @override
  List<Object?> get props => [title, description, icon];
}
