import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/features/auth/domain/entities/user_entity.dart';
import 'package:leroy_ai/shared/providers/app_config_provider.dart';
import 'package:leroy_ai/shared/providers/dependency_providers.dart';

class AuthState {
  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.passwordResetSent = false,
    this.verificationSent = false,
  });

  final UserEntity? user;
  final bool isLoading;
  final String? error;
  final bool passwordResetSent;
  final bool verificationSent;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    UserEntity? user,
    bool? isLoading,
    String? error,
    bool? passwordResetSent,
    bool? verificationSent,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      passwordResetSent: passwordResetSent ?? this.passwordResetSent,
      verificationSent: verificationSent ?? this.verificationSent,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._ref) : super(const AuthState(isLoading: true)) {
    _subscription = _ref
        .read(authRepositoryProvider)
        .authStateChanges
        .listen(_onAuthChanged, onError: (Object e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    });
  }

  final Ref _ref;
  StreamSubscription<UserEntity?>? _subscription;

  Future<void> _onAuthChanged(UserEntity? user) async {
    state = state.copyWith(
      user: user,
      isLoading: false,
      clearUser: user == null,
      clearError: true,
    );
    if (user != null) {
      final notifications = _ref.read(notificationServiceProvider);
      final token = await notifications.initialize();
      if (token != null) {
        await notifications.saveTokenForCurrentUser(token);
      }
    }
  }

  Future<bool> signIn(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    final result = await _ref.read(signInUseCaseProvider).call(
          email: email,
          password: password,
        );
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (user) {
        state = state.copyWith(user: user, isLoading: false);
        return true;
      },
    );
  }

  Future<bool> signUp({
    required String email,
    required String password,
    required String displayName,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    final result = await _ref.read(signUpUseCaseProvider).call(
          email: email,
          password: password,
          displayName: displayName,
        );
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (user) {
        state = state.copyWith(
          user: user,
          isLoading: false,
          verificationSent: true,
        );
        return true;
      },
    );
  }

  Future<bool> forgotPassword(String email) async {
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      passwordResetSent: false,
    );
    final result = await _ref.read(forgotPasswordUseCaseProvider).call(email);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (_) {
        state = state.copyWith(isLoading: false, passwordResetSent: true);
        return true;
      },
    );
  }

  Future<bool> sendEmailVerification() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final result =
        await _ref.read(sendEmailVerificationUseCaseProvider).call();
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (_) {
        state = state.copyWith(isLoading: false, verificationSent: true);
        return true;
      },
    );
  }

  Future<void> refreshUser() async {
    await _ref.read(reloadUserUseCaseProvider).call();
    final result = await _ref.read(getCurrentUserUseCaseProvider).call();
    result.fold(
      (f) => state = state.copyWith(error: f.message),
      (user) => state = state.copyWith(user: user, clearUser: user == null),
    );
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    final result = await _ref.read(changePasswordUseCaseProvider).call(
          currentPassword: currentPassword,
          newPassword: newPassword,
        );
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (_) {
        state = state.copyWith(isLoading: false);
        return true;
      },
    );
  }

  Future<void> signOut() async {
    await _ref.read(signOutUseCaseProvider).call();
    state = const AuthState();
  }

  Future<bool> updateProfile({String? displayName, String? photoUrl}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    final result = await _ref.read(updateProfileUseCaseProvider).call(
          displayName: displayName,
          photoUrl: photoUrl,
        );
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (user) {
        state = state.copyWith(user: user, isLoading: false);
        return true;
      },
    );
  }

  Future<bool> uploadPhoto(String path) async {
    state = state.copyWith(isLoading: true, clearError: true);
    final result =
        await _ref.read(uploadProfilePhotoUseCaseProvider).call(path);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (_) async {
        await refreshUser();
        state = state.copyWith(isLoading: false);
        return true;
      },
    );
  }

  void setPlan(String planId) {
    final user = state.user;
    if (user == null) return;
    state = state.copyWith(user: user.copyWith(plan: planId));
  }

  void clearError() => state = state.copyWith(clearError: true);

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});

final currentUserProvider = Provider<UserEntity?>((ref) {
  return ref.watch(authProvider).user;
});
