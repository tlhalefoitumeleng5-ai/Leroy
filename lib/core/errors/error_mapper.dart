import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/core/errors/failures.dart';

/// Maps low-level exceptions to domain [Failure] types.
Failure mapExceptionToFailure(Object error) {
  if (error is AuthException) {
    return AuthFailure(error.message);
  }
  if (error is ServerException) {
    return ServerFailure(error.message);
  }
  if (error is NetworkException) {
    return NetworkFailure(error.message);
  }
  if (error is CacheException) {
    return CacheFailure(error.message);
  }
  return UnexpectedFailure(error.toString());
}
