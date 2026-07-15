import '../../../../core/utils/typedefs.dart';
import '../../../../core/utils/usecase.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class LoginUseCase implements UseCase<UserEntity, LoginParams> {
  LoginUseCase(this._repository);
  final AuthRepository _repository;

  @override
  ResultFuture<UserEntity> call(LoginParams params) {
    return _repository.login(email: params.email, password: params.password);
  }
}

class LoginParams {
  const LoginParams({required this.email, required this.password});
  final String email;
  final String password;
}
