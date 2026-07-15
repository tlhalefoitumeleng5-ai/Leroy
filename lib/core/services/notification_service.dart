import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('Background message: ${message.messageId}');
}

class NotificationService {
  NotificationService(this._prefs);

  final SharedPreferences _prefs;
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  bool get notificationsEnabled =>
      _prefs.getBool(AppConstants.keyNotificationsEnabled) ?? true;

  Future<void> setNotificationsEnabled(bool enabled) async {
    await _prefs.setBool(AppConstants.keyNotificationsEnabled, enabled);
    if (enabled) {
      await initialize();
    } else {
      await _messaging.deleteToken();
    }
  }

  Future<String?> initialize() async {
    if (!notificationsEnabled) return null;

    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      return null;
    }

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    final token = await _messaging.getToken();
    debugPrint('FCM token: $token');
    return token;
  }
}
