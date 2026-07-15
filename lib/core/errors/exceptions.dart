/// Exceptions thrown by data sources; mapped to [Failure] in repositories.
class ServerException implements Exception {
  ServerException([this.message = 'Server error']);
  final String message;

  @override
  String toString() => 'ServerException: $message';
}

class AuthException implements Exception {
  AuthException([this.message = 'Auth error']);
  final String message;

  @override
  String toString() => 'AuthException: $message';
}

class CacheException implements Exception {
  CacheException([this.message = 'Cache error']);
  final String message;

  @override
  String toString() => 'CacheException: $message';
}

class NetworkException implements Exception {
  NetworkException([this.message = 'Network error']);
  final String message;

  @override
  String toString() => 'NetworkException: $message';
}
