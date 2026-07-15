import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/auth/domain/entities/user_entity.dart';
import 'package:leroy_ai/features/auth/domain/repositories/auth_repository.dart';
import 'package:leroy_ai/features/profile/domain/repositories/profile_repository.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  ProfileRepositoryImpl(this._authRepository);
  final AuthRepository _authRepository;

  @override
  ResultFuture<UserEntity> updateDisplayName(String name) {
    return _authRepository.updateProfile(displayName: name);
  }
}
