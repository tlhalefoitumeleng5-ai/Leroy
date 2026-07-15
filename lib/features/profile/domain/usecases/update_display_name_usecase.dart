import '../../../../core/utils/typedefs.dart';
import '../../../../core/utils/usecase.dart';
import '../../../auth/domain/entities/user_entity.dart';
import '../repositories/profile_repository.dart';

class UpdateDisplayNameUseCase
    implements UseCase<UserEntity, UpdateDisplayNameParams> {
  UpdateDisplayNameUseCase(this._repository);

  final ProfileRepository _repository;

  @override
  ResultFuture<UserEntity> call(UpdateDisplayNameParams params) {
    return _repository.updateDisplayName(params.displayName);
  }
}

class UpdateDisplayNameParams {
  const UpdateDisplayNameParams({required this.displayName});
  final String displayName;
}
