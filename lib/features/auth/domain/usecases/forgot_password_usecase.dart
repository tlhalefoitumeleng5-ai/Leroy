import '../../../../core/utils/typedefs.dart';
import '../../../../core/utils/usecase.dart';
import '../repositories/auth_repository.dart';

class ForgotPasswordUseCase implements UseCase<void, ForgotPasswordParams> {
  ForgotPasswordUseCase(this._repository);
  final AuthRepository _repository;

  @override
  ResultFuture<void> call(ForgotPasswordParams params) {
    return _repository.forgotPassword(email: params.email);
  }
}

class ForgotPasswordParams {
  const ForgotPasswordParams({required this.email});
  final String email;
}
