import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  const UserEntity({
    required this.id,
    required this.email,
    required this.displayName,
    this.photoUrl,
    this.planId = 'free',
    this.createdAt,
    this.isGuest = false,
  });

  final String id;
  final String email;
  final String displayName;
  final String? photoUrl;
  final String planId;
  final DateTime? createdAt;
  final bool isGuest;

  bool get isPro => planId == 'pro' || planId == 'enterprise';

  UserEntity copyWith({
    String? id,
    String? email,
    String? displayName,
    String? photoUrl,
    String? planId,
    DateTime? createdAt,
    bool? isGuest,
  }) {
    return UserEntity(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      planId: planId ?? this.planId,
      createdAt: createdAt ?? this.createdAt,
      isGuest: isGuest ?? this.isGuest,
    );
  }

  @override
  List<Object?> get props =>
      [id, email, displayName, photoUrl, planId, createdAt, isGuest];
}
