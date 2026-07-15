import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/features/auth/data/models/user_model.dart';
import 'dart:io';

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

  Future<void> sendEmailVerification();

  Future<void> reloadUser();

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  });

  Future<void> signOut();

  Future<UserModel?> getCurrentUser();

  Future<UserModel> updateProfile({
    String? displayName,
    String? photoUrl,
  });

  Future<String> uploadProfilePhoto(String filePath);
}

class FirebaseAuthDataSource implements AuthRemoteDataSource {
  FirebaseAuthDataSource({
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
    FirebaseStorage? storage,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance,
        _storage = storage ?? FirebaseStorage.instance;

  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;
  final FirebaseStorage _storage;

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
      await user.sendEmailVerification();
      final model = UserModel(
        id: user.uid,
        email: user.email ?? email.trim(),
        displayName: displayName.trim(),
        plan: 'free',
        emailVerified: user.emailVerified,
        createdAt: DateTime.now(),
      );
      await _users.doc(user.uid).set(model.toMap());
      return model;
    } on FirebaseAuthException catch (e) {
      throw AuthException(_mapAuthCode(e.code));
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
  Future<void> sendEmailVerification() async {
    final user = _auth.currentUser;
    if (user == null) throw AuthException('No authenticated user.');
    try {
      await user.sendEmailVerification();
    } on FirebaseAuthException catch (e) {
      throw AuthException(_mapAuthCode(e.code));
    }
  }

  @override
  Future<void> reloadUser() async {
    final user = _auth.currentUser;
    if (user == null) throw AuthException('No authenticated user.');
    await user.reload();
  }

  @override
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final user = _auth.currentUser;
    if (user == null || user.email == null) {
      throw AuthException('No authenticated user.');
    }
    try {
      final credential = EmailAuthProvider.credential(
        email: user.email!,
        password: currentPassword,
      );
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
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
    await user.reload();
    return _mapUser(_auth.currentUser!);
  }

  @override
  Future<UserModel> updateProfile({
    String? displayName,
    String? photoUrl,
  }) async {
    final user = _auth.currentUser;
    if (user == null) throw AuthException('No authenticated user.');
    if (displayName != null) await user.updateDisplayName(displayName);
    if (photoUrl != null) await user.updatePhotoURL(photoUrl);
    final updates = <String, dynamic>{};
    if (displayName != null) updates['displayName'] = displayName;
    if (photoUrl != null) updates['photoUrl'] = photoUrl;
    if (updates.isNotEmpty) {
      await _users.doc(user.uid).set(updates, SetOptions(merge: true));
    }
    await user.reload();
    return _mapUser(_auth.currentUser!);
  }

  @override
  Future<String> uploadProfilePhoto(String filePath) async {
    final user = _auth.currentUser;
    if (user == null) throw AuthException('No authenticated user.');
    try {
      final ref = _storage.ref('users/${user.uid}/avatar.jpg');
      await ref.putFile(
        File(filePath),
        SettableMetadata(contentType: 'image/jpeg'),
      );
      final url = await ref.getDownloadURL();
      await updateProfile(photoUrl: url);
      return url;
    } catch (e) {
      throw ServerException('Failed to upload profile photo: $e');
    }
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
      emailVerified: user.emailVerified,
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
      case 'requires-recent-login':
        return 'Please sign in again to continue.';
      default:
        return 'Authentication failed ($code).';
    }
  }
}
