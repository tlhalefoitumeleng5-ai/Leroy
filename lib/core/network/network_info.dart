/// Simple connectivity abstraction for the data layer.
abstract class NetworkInfo {
  Future<bool> get isConnected;
}

/// Default implementation — assumes online (Firebase handles offline).
class NetworkInfoImpl implements NetworkInfo {
  @override
  Future<bool> get isConnected async => true;
}
