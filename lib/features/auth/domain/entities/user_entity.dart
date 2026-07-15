import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  const UserEntity({
    required this.id,
    required this.email,
    required this.displayName,
    this.photoUrl,
    this.plan = 'free',
    this.emailVerified = false,
    this.createdAt,
    this.imagesGenerated = 0,
    this.videosGenerated = 0,
    this.chatsStarted = 0,
  });

  final String id;
  final String email;
  final String displayName;
  final String? photoUrl;
  final String plan;
  final bool emailVerified;
  final DateTime? createdAt;
  final int imagesGenerated;
  final int videosGenerated;
  final int chatsStarted;

  bool get isPro =>
      plan == 'starter' || plan == 'pro' || plan == 'business';

  UserEntity copyWith({
    String? id,
    String? email,
    String? displayName,
    String? photoUrl,
    String? plan,
    bool? emailVerified,
    DateTime? createdAt,
    int? imagesGenerated,
    int? videosGenerated,
    int? chatsStarted,
  }) {
    return UserEntity(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      plan: plan ?? this.plan,
      emailVerified: emailVerified ?? this.emailVerified,
      createdAt: createdAt ?? this.createdAt,
      imagesGenerated: imagesGenerated ?? this.imagesGenerated,
      videosGenerated: videosGenerated ?? this.videosGenerated,
      chatsStarted: chatsStarted ?? this.chatsStarted,
    );
  }

  @override
  List<Object?> get props => [
        id,
        email,
        displayName,
        photoUrl,
        plan,
        emailVerified,
        createdAt,
        imagesGenerated,
        videosGenerated,
        chatsStarted,
      ];
}
