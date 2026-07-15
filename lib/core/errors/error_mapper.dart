import 'package:firebase_auth/firebase_auth.dart';

import 'exceptions.dart';
import 'failures.dart';

Failure mapExceptionToFailure(Object error) {
  if (error is Failure) return error;
  if (error is AuthException) return AuthFailure(error.message);
  if (error is ServerException) return ServerFailure(error.message);
  if (error is CacheException) return CacheFailure(error.message);
  if (error is NetworkException) return NetworkFailure(error.message);
  if (error is FirebaseAuthException) {
    return AuthFailure(_mapFirebaseAuthCode(error.code));
  }
  return UnexpectedFailure(error.toString());
}

String _mapFirebaseAuthCode(String code) {
  switch (code) {
    case 'user-not-found':
      return 'No account found for this email.';
    case 'wrong-password':
      return 'Incorrect password.';
    case 'email-already-in-use':
      return 'An account already exists for this email.';
    case 'weak-password':
      return 'Password must be at least 6 characters.';
    case 'invalid-email':
      return 'Enter a valid email address.';
    case 'too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'network-request-failed':
      return 'Network error. Check your connection.';
    case 'invalid-credential':
      return 'Invalid email or password.';
    default:
      return 'Authentication failed. Please try again.';
  }
}
