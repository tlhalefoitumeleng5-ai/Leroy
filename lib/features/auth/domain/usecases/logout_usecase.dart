import '../../../../core/utils/typedefs.dart';
import '../../../../core/utils/usecase.dart';
import '../repositories/auth_repository.dart';

class LogoutUseCase implements UseCaseNoParams<void> {
  LogoutUseCase(this._repository);
  final AuthRepository _repository;

  @override
  ResultFuture<void> call() => _repository.logout();
}
