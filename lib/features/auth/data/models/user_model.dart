import 'package:leroy_ai/features/auth/domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.email,
    required super.displayName,
    super.photoUrl,
    super.plan,
    super.createdAt,
  });

  factory UserModel.fromFirebase({
    required String id,
    required String email,
    String? displayName,
    String? photoUrl,
    Map<String, dynamic>? firestoreData,
  }) {
    return UserModel(
      id: id,
      email: email,
      displayName: displayName ??
          firestoreData?['displayName'] as String? ??
          email.split('@').first,
      photoUrl: photoUrl ?? firestoreData?['photoUrl'] as String?,
      plan: firestoreData?['plan'] as String? ?? 'free',
      createdAt: firestoreData?['createdAt'] != null
          ? DateTime.tryParse(firestoreData!['createdAt'].toString())
          : null,
    );
  }

  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      id: map['id'] as String,
      email: map['email'] as String,
      displayName: map['displayName'] as String? ?? '',
      photoUrl: map['photoUrl'] as String?,
      plan: map['plan'] as String? ?? 'free',
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'photoUrl': photoUrl,
      'plan': plan,
      'createdAt': createdAt?.toIso8601String() ??
          DateTime.now().toIso8601String(),
    };
  }

  factory UserModel.demo() {
    return UserModel(
      id: 'demo-user-001',
      email: 'demo@leroy.ai',
      displayName: 'Leroy Demo',
      plan: 'pro',
      createdAt: DateTime.now(),
    );
  }
}
