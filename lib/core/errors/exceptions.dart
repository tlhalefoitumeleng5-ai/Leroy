/// Data-layer exceptions thrown by datasources.
class ServerException implements Exception {
  const ServerException([this.message = 'Server error']);
  final String message;

  @override
  String toString() => 'ServerException: $message';
}

class AuthException implements Exception {
  const AuthException([this.message = 'Auth error']);
  final String message;

  @override
  String toString() => 'AuthException: $message';
}

class CacheException implements Exception {
  const CacheException([this.message = 'Cache error']);
  final String message;

  @override
  String toString() => 'CacheException: $message';
}

class NetworkException implements Exception {
  const NetworkException([this.message = 'Network error']);
  final String message;

  @override
  String toString() => 'NetworkException: $message';
}
