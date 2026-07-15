import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/utils/typedefs.dart';
import '../../../auth/domain/entities/user_entity.dart';
import '../../../auth/domain/repositories/auth_repository.dart';
import '../../domain/repositories/profile_repository.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  ProfileRepositoryImpl(this._authRepository);

  final AuthRepository _authRepository;

  @override
  ResultFuture<UserEntity> getProfile(String uid) async {
    final user = _authRepository.currentUser;
    if (user == null) {
      return const Left(AuthFailure('Not signed in'));
    }
    return Right(user);
  }

  @override
  ResultFuture<UserEntity> updateDisplayName(String displayName) {
    return _authRepository.updateProfile(displayName: displayName);
  }
}
