import 'package:connectivity_plus/connectivity_plus.dart';

/// Connectivity abstraction for the data layer.
abstract class NetworkInfo {
  Future<bool> get isConnected;
}

/// Uses [connectivity_plus] to detect offline state.
class NetworkInfoImpl implements NetworkInfo {
  NetworkInfoImpl({Connectivity? connectivity})
      : _connectivity = connectivity ?? Connectivity();

  final Connectivity _connectivity;

  @override
  Future<bool> get isConnected async {
    final results = await _connectivity.checkConnectivity();
    if (results.isEmpty) return false;
    return results.any((r) => r != ConnectivityResult.none);
  }
}
