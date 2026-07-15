import '../../../../core/utils/typedefs.dart';
import '../entities/user_entity.dart';

abstract class AuthRepository {
  Stream<UserEntity?> get authStateChanges;
  UserEntity? get currentUser;

  ResultFuture<UserEntity> login({
    required String email,
    required String password,
  });

  ResultFuture<UserEntity> register({
    required String email,
    required String password,
    required String displayName,
  });

  ResultFuture<UserEntity> continueAsGuest();

  ResultVoid forgotPassword({required String email});

  ResultVoid logout();

  ResultFuture<UserEntity> updateProfile({
    String? displayName,
    String? photoUrl,
  });
}
