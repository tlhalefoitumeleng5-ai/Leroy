import 'dart:async';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../../../../core/errors/exceptions.dart';
import '../models/user_model.dart';
import 'auth_remote_datasource.dart';

/// In-memory / SharedPreferences auth for local demo without Firebase.
class AuthDemoDataSource implements AuthRemoteDataSource {
  AuthDemoDataSource(this._prefs) {
    _restore();
  }

  final SharedPreferences _prefs;
  final _controller = StreamController<UserModel?>.broadcast();
  UserModel? _user;

  static const _keyId = 'demo_user_id';
  static const _keyEmail = 'demo_user_email';
  static const _keyName = 'demo_user_name';
  static const _keyPlan = 'demo_user_plan';
  static const _keyGuest = 'demo_user_guest';

  void _restore() {
    final id = _prefs.getString(_keyId);
    if (id != null) {
      _user = UserModel(
        id: id,
        email: _prefs.getString(_keyEmail) ?? '',
        displayName: _prefs.getString(_keyName) ?? 'User',
        planId: _prefs.getString(_keyPlan) ?? 'free',
        isGuest: _prefs.getBool(_keyGuest) ?? false,
        createdAt: DateTime.now(),
      );
    }
  }

  Future<void> _persist(UserModel? user) async {
    _user = user;
    if (user == null) {
      await _prefs.remove(_keyId);
      await _prefs.remove(_keyEmail);
      await _prefs.remove(_keyName);
      await _prefs.remove(_keyPlan);
      await _prefs.remove(_keyGuest);
    } else {
      await _prefs.setString(_keyId, user.id);
      await _prefs.setString(_keyEmail, user.email);
      await _prefs.setString(_keyName, user.displayName);
      await _prefs.setString(_keyPlan, user.planId);
      await _prefs.setBool(_keyGuest, user.isGuest);
    }
    _controller.add(user);
  }

  @override
  Stream<UserModel?> get authStateChanges async* {
    yield _user;
    yield* _controller.stream;
  }

  @override
  UserModel? get currentUser => _user;

  @override
  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (password.length < 6) {
      throw const AuthException('Incorrect password.');
    }
    final model = UserModel(
      id: _prefs.getString(_keyId) ?? const Uuid().v4(),
      email: email.trim(),
      displayName: email.split('@').first,
      planId: _prefs.getString(_keyPlan) ?? 'free',
      createdAt: DateTime.now(),
    );
    await _persist(model);
    return model;
  }

  @override
  Future<UserModel> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 700));
    final model = UserModel(
      id: const Uuid().v4(),
      email: email.trim(),
      displayName: displayName.trim(),
      createdAt: DateTime.now(),
    );
    await _persist(model);
    return model;
  }

  Future<UserModel> continueAsGuest() async {
    final model = UserModel(
      id: 'guest_${const Uuid().v4()}',
      email: '',
      displayName: 'Guest',
      isGuest: true,
      createdAt: DateTime.now(),
    );
    await _persist(model);
    return model;
  }

  @override
  Future<void> forgotPassword({required String email}) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (!email.contains('@')) {
      throw const AuthException('Enter a valid email address.');
    }
  }

  @override
  Future<void> logout() async {
    await _persist(null);
  }

  @override
  Future<UserModel> updateProfile({
    String? displayName,
    String? photoUrl,
  }) async {
    if (_user == null) throw const AuthException('Not signed in');
    final updated = UserModel(
      id: _user!.id,
      email: _user!.email,
      displayName: displayName ?? _user!.displayName,
      photoUrl: photoUrl ?? _user!.photoUrl,
      planId: _user!.planId,
      createdAt: _user!.createdAt,
      isGuest: _user!.isGuest,
    );
    await _persist(updated);
    return updated;
  }

  Future<void> updatePlan(String planId) async {
    if (_user == null) return;
    final updated = UserModel(
      id: _user!.id,
      email: _user!.email,
      displayName: _user!.displayName,
      photoUrl: _user!.photoUrl,
      planId: planId,
      createdAt: _user!.createdAt,
      isGuest: _user!.isGuest,
    );
    await _persist(updated);
  }

  void dispose() => _controller.close();
}
