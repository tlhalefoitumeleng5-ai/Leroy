import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/auth/domain/entities/user_entity.dart';

abstract class AuthRepository {
  Stream<UserEntity?> get authStateChanges;

  ResultFuture<UserEntity> signIn({
    required String email,
    required String password,
  });

  ResultFuture<UserEntity> signUp({
    required String email,
    required String password,
    required String displayName,
  });

  ResultFuture<void> sendPasswordReset(String email);

  ResultFuture<void> signOut();

  ResultFuture<UserEntity?> getCurrentUser();

  ResultFuture<UserEntity> updateProfile({
    String? displayName,
    String? photoUrl,
  });
}
