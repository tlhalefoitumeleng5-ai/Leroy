import '../../domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.email,
    required super.displayName,
    super.photoUrl,
    super.planId,
    super.createdAt,
    super.isGuest,
  });

  factory UserModel.fromEntity(UserEntity entity) {
    return UserModel(
      id: entity.id,
      email: entity.email,
      displayName: entity.displayName,
      photoUrl: entity.photoUrl,
      planId: entity.planId,
      createdAt: entity.createdAt,
      isGuest: entity.isGuest,
    );
  }

  factory UserModel.fromFirestore(Map<String, dynamic> json, String id) {
    return UserModel(
      id: id,
      email: json['email'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      photoUrl: json['photoUrl'] as String?,
      planId: json['planId'] as String? ?? 'free',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      isGuest: json['isGuest'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'email': email,
      'displayName': displayName,
      'photoUrl': photoUrl,
      'planId': planId,
      'createdAt': createdAt?.toIso8601String() ?? DateTime.now().toIso8601String(),
      'isGuest': isGuest,
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }

  UserEntity toEntity() => this;
}
