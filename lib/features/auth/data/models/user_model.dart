import 'package:leroy_ai/features/auth/domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.email,
    required super.displayName,
    super.photoUrl,
    super.plan,
    super.emailVerified,
    super.createdAt,
    super.imagesGenerated,
    super.videosGenerated,
    super.chatsStarted,
  });

  factory UserModel.fromFirebase({
    required String id,
    required String email,
    String? displayName,
    String? photoUrl,
    bool emailVerified = false,
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
      emailVerified: emailVerified,
      createdAt: firestoreData?['createdAt'] != null
          ? DateTime.tryParse(firestoreData!['createdAt'].toString())
          : null,
      imagesGenerated: firestoreData?['imagesGenerated'] as int? ?? 0,
      videosGenerated: firestoreData?['videosGenerated'] as int? ?? 0,
      chatsStarted: firestoreData?['chatsStarted'] as int? ?? 0,
    );
  }

  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      id: map['id'] as String,
      email: map['email'] as String,
      displayName: map['displayName'] as String? ?? '',
      photoUrl: map['photoUrl'] as String?,
      plan: map['plan'] as String? ?? 'free',
      emailVerified: map['emailVerified'] as bool? ?? false,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString())
          : null,
      imagesGenerated: map['imagesGenerated'] as int? ?? 0,
      videosGenerated: map['videosGenerated'] as int? ?? 0,
      chatsStarted: map['chatsStarted'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'photoUrl': photoUrl,
      'plan': plan,
      'emailVerified': emailVerified,
      'createdAt':
          createdAt?.toIso8601String() ?? DateTime.now().toIso8601String(),
      'imagesGenerated': imagesGenerated,
      'videosGenerated': videosGenerated,
      'chatsStarted': chatsStarted,
    };
  }
}
