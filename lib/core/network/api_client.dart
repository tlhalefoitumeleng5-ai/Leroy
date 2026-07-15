/// Placeholder HTTP client for future external AI APIs.
/// V1 demo mode uses local simulated responses.
class ApiClient {
  ApiClient({this.baseUrl = ''});

  final String baseUrl;

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    throw UnimplementedError(
      'Wire your AI provider API here. Demo mode is active by default.',
    );
  }
}
