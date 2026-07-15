import 'package:dartz/dartz.dart';
import 'package:leroy_ai/core/errors/error_mapper.dart';
import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:leroy_ai/features/auth/domain/entities/user_entity.dart';
import 'package:leroy_ai/features/auth/domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._remote);
  final AuthRemoteDataSource _remote;

  @override
  Stream<UserEntity?> get authStateChanges => _remote.authStateChanges;

  @override
  ResultFuture<UserEntity> signIn({
    required String email,
    required String password,
  }) async {
    try {
      return Right(await _remote.signIn(email: email, password: password));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<UserEntity> signUp({
    required String email,
    required String password,
    required String displayName,
  }) async {
    try {
      return Right(await _remote.signUp(
        email: email,
        password: password,
        displayName: displayName,
      ));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<void> sendPasswordReset(String email) async {
    try {
      await _remote.sendPasswordReset(email);
      return const Right(null);
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<void> sendEmailVerification() async {
    try {
      await _remote.sendEmailVerification();
      return const Right(null);
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<void> reloadUser() async {
    try {
      await _remote.reloadUser();
      return const Right(null);
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _remote.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      return const Right(null);
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<void> signOut() async {
    try {
      await _remote.signOut();
      return const Right(null);
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<UserEntity?> getCurrentUser() async {
    try {
      return Right(await _remote.getCurrentUser());
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<UserEntity> updateProfile({
    String? displayName,
    String? photoUrl,
  }) async {
    try {
      return Right(await _remote.updateProfile(
        displayName: displayName,
        photoUrl: photoUrl,
      ));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<String> uploadProfilePhoto(String filePath) async {
    try {
      return Right(await _remote.uploadProfilePhoto(filePath));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }
}
