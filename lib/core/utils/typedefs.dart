import 'package:dartz/dartz.dart';
import 'package:leroy_ai/core/errors/failures.dart';

/// Functional result alias used across use cases.
typedef ResultFuture<T> = Future<Either<Failure, T>>;
typedef ResultVoid = Future<Either<Failure, void>>;
