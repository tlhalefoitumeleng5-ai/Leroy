import 'typedefs.dart';

abstract class UseCase<Type, Params> {
  ResultFuture<Type> call(Params params);
}

abstract class UseCaseNoParams<Type> {
  ResultFuture<Type> call();
}

class NoParams {
  const NoParams();
}
