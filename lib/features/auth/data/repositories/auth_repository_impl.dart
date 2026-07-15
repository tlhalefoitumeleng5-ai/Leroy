import 'package:dartz/dartz.dart';

import '../../../../core/errors/error_mapper.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_demo_datasource.dart';
import '../datasources/auth_remote_datasource.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._remote);

  final AuthRemoteDataSource _remote;

  @override
  Stream<UserEntity?> get authStateChanges =>
      _remote.authStateChanges.map((u) => u?.toEntity());

  @override
  UserEntity? get currentUser => _remote.currentUser?.toEntity();

  @override
  ResultFuture<UserEntity> login({
    required String email,
    required String password,
  }) async {
    try {
      final user = await _remote.login(email: email, password: password);
      return Right(user.toEntity());
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<UserEntity> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    try {
      final user = await _remote.register(
        email: email,
        password: password,
        displayName: displayName,
      );
      return Right(user.toEntity());
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<UserEntity> continueAsGuest() async {
    try {
      if (_remote is AuthDemoDataSource) {
        final user = await _remote.continueAsGuest();
        return Right(user.toEntity());
      }
      return const Left(AuthFailure('Guest mode requires demo backend.'));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultVoid forgotPassword({required String email}) async {
    try {
      await _remote.forgotPassword(email: email);
      return const Right(null);
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultVoid logout() async {
    try {
      await _remote.logout();
      return const Right(null);
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
      final user = await _remote.updateProfile(
        displayName: displayName,
        photoUrl: photoUrl,
      );
      return Right(user.toEntity());
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }
}
