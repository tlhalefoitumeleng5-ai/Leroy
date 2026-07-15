import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/auth/domain/entities/user_entity.dart';
import 'package:leroy_ai/features/profile/domain/repositories/profile_repository.dart';

class UpdateDisplayNameUseCase {
  UpdateDisplayNameUseCase(this._repository);
  final ProfileRepository _repository;

  ResultFuture<UserEntity> call(String name) =>
      _repository.updateDisplayName(name);
}
