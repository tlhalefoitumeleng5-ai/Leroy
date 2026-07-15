import '../../../../core/utils/typedefs.dart';
import '../../../../core/utils/usecase.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class RegisterUseCase implements UseCase<UserEntity, RegisterParams> {
  RegisterUseCase(this._repository);
  final AuthRepository _repository;

  @override
  ResultFuture<UserEntity> call(RegisterParams params) {
    return _repository.register(
      email: params.email,
      password: params.password,
      displayName: params.displayName,
    );
  }
}

class RegisterParams {
  const RegisterParams({
    required this.email,
    required this.password,
    required this.displayName,
  });
  final String email;
  final String password;
  final String displayName;
}
