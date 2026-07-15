import 'package:equatable/equatable.dart';

/// Authenticated user domain entity.
class UserEntity extends Equatable {
  const UserEntity({
    required this.id,
    required this.email,
    required this.displayName,
    this.photoUrl,
    this.plan = 'free',
    this.createdAt,
  });

  final String id;
  final String email;
  final String displayName;
  final String? photoUrl;
  final String plan;
  final DateTime? createdAt;

  bool get isPro => plan == 'pro' || plan == 'studio';

  UserEntity copyWith({
    String? id,
    String? email,
    String? displayName,
    String? photoUrl,
    String? plan,
    DateTime? createdAt,
  }) {
    return UserEntity(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      plan: plan ?? this.plan,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => [id, email, displayName, photoUrl, plan, createdAt];
}
