import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/auth/domain/entities/user_entity.dart';
import 'package:leroy_ai/features/auth/domain/repositories/auth_repository.dart';

class SignInUseCase {
  SignInUseCase(this._repository);
  final AuthRepository _repository;

  ResultFuture<UserEntity> call({
    required String email,
    required String password,
  }) {
    return _repository.signIn(email: email, password: password);
  }
}

class SignUpUseCase {
  SignUpUseCase(this._repository);
  final AuthRepository _repository;

  ResultFuture<UserEntity> call({
    required String email,
    required String password,
    required String displayName,
  }) {
    return _repository.signUp(
      email: email,
      password: password,
      displayName: displayName,
    );
  }
}

class ForgotPasswordUseCase {
  ForgotPasswordUseCase(this._repository);
  final AuthRepository _repository;

  ResultFuture<void> call(String email) {
    return _repository.sendPasswordReset(email);
  }
}

class SignOutUseCase {
  SignOutUseCase(this._repository);
  final AuthRepository _repository;

  ResultFuture<void> call() => _repository.signOut();
}

class GetCurrentUserUseCase {
  GetCurrentUserUseCase(this._repository);
  final AuthRepository _repository;

  ResultFuture<UserEntity?> call() => _repository.getCurrentUser();
}

class UpdateProfileUseCase {
  UpdateProfileUseCase(this._repository);
  final AuthRepository _repository;

  ResultFuture<UserEntity> call({
    String? displayName,
    String? photoUrl,
  }) {
    return _repository.updateProfile(
      displayName: displayName,
      photoUrl: photoUrl,
    );
  }
}
