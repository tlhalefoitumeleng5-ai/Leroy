import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/features/auth/data/models/user_model.dart';

abstract class AuthRemoteDataSource {
  Stream<UserModel?> get authStateChanges;

  Future<UserModel> signIn({
    required String email,
    required String password,
  });

  Future<UserModel> signUp({
    required String email,
    required String password,
    required String displayName,
  });

  Future<void> sendPasswordReset(String email);

  Future<void> signOut();

  Future<UserModel?> getCurrentUser();

  Future<UserModel> updateProfile({
    String? displayName,
    String? photoUrl,
  });
}

class FirebaseAuthDataSource implements AuthRemoteDataSource {
  FirebaseAuthDataSource({
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _users =>
      _firestore.collection(AppConstants.usersCollection);

  @override
  Stream<UserModel?> get authStateChanges {
    return _auth.authStateChanges().asyncMap((user) async {
      if (user == null) return null;
      return _mapUser(user);
    });
  }

  @override
  Future<UserModel> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      final user = credential.user;
      if (user == null) {
        throw AuthException('Sign in failed. Please try again.');
      }
      return _mapUser(user);
    } on FirebaseAuthException catch (e) {
      throw AuthException(_mapAuthCode(e.code));
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException(e.toString());
    }
  }

  @override
  Future<UserModel> signUp({
    required String email,
    required String password,
    required String displayName,
  }) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      final user = credential.user;
      if (user == null) {
        throw AuthException('Registration failed. Please try again.');
      }
      await user.updateDisplayName(displayName.trim());
      final model = UserModel(
        id: user.uid,
        email: user.email ?? email.trim(),
        displayName: displayName.trim(),
        plan: 'free',
        createdAt: DateTime.now(),
      );
      await _users.doc(user.uid).set(model.toMap());
      return model;
    } on FirebaseAuthException catch (e) {
      throw AuthException(_mapAuthCode(e.code));
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException(e.toString());
    }
  }

  @override
  Future<void> sendPasswordReset(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email.trim());
    } on FirebaseAuthException catch (e) {
      throw AuthException(_mapAuthCode(e.code));
    }
  }

  @override
  Future<void> signOut() async {
    await _auth.signOut();
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    final user = _auth.currentUser;
    if (user == null) return null;
    return _mapUser(user);
  }

  @override
  Future<UserModel> updateProfile({
    String? displayName,
    String? photoUrl,
  }) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw AuthException('No authenticated user.');
    }
    if (displayName != null) {
      await user.updateDisplayName(displayName);
    }
    if (photoUrl != null) {
      await user.updatePhotoURL(photoUrl);
    }
    final updates = <String, dynamic>{};
    if (displayName != null) updates['displayName'] = displayName;
    if (photoUrl != null) updates['photoUrl'] = photoUrl;
    if (updates.isNotEmpty) {
      await _users.doc(user.uid).set(updates, SetOptions(merge: true));
    }
    return _mapUser(user);
  }

  Future<UserModel> _mapUser(User user) async {
    Map<String, dynamic>? data;
    try {
      final snap = await _users.doc(user.uid).get();
      data = snap.data();
    } catch (_) {
      data = null;
    }
    return UserModel.fromFirebase(
      id: user.uid,
      email: user.email ?? '',
      displayName: user.displayName,
      photoUrl: user.photoURL,
      firestoreData: data,
    );
  }

  String _mapAuthCode(String code) {
    switch (code) {
      case 'user-not-found':
        return 'No account found for this email.';
      case 'wrong-password':
        return 'Incorrect password.';
      case 'email-already-in-use':
        return 'An account already exists with this email.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'weak-password':
        return 'Password is too weak. Use at least 8 characters.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'network-request-failed':
        return 'Network error. Check your connection.';
      case 'invalid-credential':
        return 'Invalid email or password.';
      default:
        return 'Authentication failed ($code).';
    }
  }
}

/// Local demo auth for running without configured Firebase credentials.
class DemoAuthDataSource implements AuthRemoteDataSource {
  UserModel? _current;

  @override
  Stream<UserModel?> get authStateChanges async* {
    yield _current;
  }

  @override
  Future<UserModel> signIn({
    required String email,
    required String password,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (password.length < 6) {
      throw AuthException('Incorrect password.');
    }
    _current = UserModel(
      id: 'demo-${email.hashCode}',
      email: email.trim(),
      displayName: email.split('@').first,
      plan: 'pro',
      createdAt: DateTime.now(),
    );
    return _current!;
  }

  @override
  Future<UserModel> signUp({
    required String email,
    required String password,
    required String displayName,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 700));
    _current = UserModel(
      id: 'demo-${email.hashCode}',
      email: email.trim(),
      displayName: displayName.trim(),
      plan: 'free',
      createdAt: DateTime.now(),
    );
    return _current!;
  }

  @override
  Future<void> sendPasswordReset(String email) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
  }

  @override
  Future<void> signOut() async {
    _current = null;
  }

  @override
  Future<UserModel?> getCurrentUser() async => _current;

  @override
  Future<UserModel> updateProfile({
    String? displayName,
    String? photoUrl,
  }) async {
    if (_current == null) throw AuthException('No authenticated user.');
    _current = UserModel(
      id: _current!.id,
      email: _current!.email,
      displayName: displayName ?? _current!.displayName,
      photoUrl: photoUrl ?? _current!.photoUrl,
      plan: _current!.plan,
      createdAt: _current!.createdAt,
    );
    return _current!;
  }
}
