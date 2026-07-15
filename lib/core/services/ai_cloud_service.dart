import 'package:cloud_functions/cloud_functions.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';

/// Calls Firebase Callable Functions for AI generation and billing.
class AiCloudService {
  AiCloudService({FirebaseFunctions? functions})
      : _functions = functions ?? FirebaseFunctions.instance;

  final FirebaseFunctions _functions;

  Future<Map<String, dynamic>> chat({
    required String message,
    required String chatId,
    List<Map<String, String>>? history,
  }) async {
    return _call(AppConstants.fnChat, {
      'message': message,
      'chatId': chatId,
      if (history != null) 'history': history,
    });
  }

  Future<Map<String, dynamic>> generateImage({
    required String prompt,
    required String style,
    required String size,
  }) async {
    return _call(AppConstants.fnImage, {
      'prompt': prompt,
      'style': style,
      'size': size,
    });
  }

  Future<Map<String, dynamic>> generateVideo({
    required String prompt,
    required int durationSeconds,
    required String quality,
    required bool voiceEnabled,
    required bool musicEnabled,
  }) async {
    return _call(AppConstants.fnVideo, {
      'prompt': prompt,
      'durationSeconds': durationSeconds,
      'quality': quality,
      'voiceEnabled': voiceEnabled,
      'musicEnabled': musicEnabled,
    });
  }

  Future<Map<String, dynamic>> createCheckout({
    required String planId,
    required String provider,
  }) async {
    return _call(AppConstants.fnCheckout, {
      'planId': planId,
      'provider': provider,
    });
  }

  Future<Map<String, dynamic>> _call(
    String name,
    Map<String, dynamic> data,
  ) async {
    try {
      final result = await _functions.httpsCallable(name).call(data);
      final payload = result.data;
      if (payload is Map) {
        return Map<String, dynamic>.from(payload);
      }
      throw ServerException('Invalid response from $name');
    } on FirebaseFunctionsException catch (e) {
      throw ServerException(e.message ?? 'Cloud Function error: ${e.code}');
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(e.toString());
    }
  }
}
