import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/features/auth/domain/entities/user_entity.dart';
import 'package:leroy_ai/shared/providers/dependency_providers.dart';

/// Auth UI state.
class AuthState {
  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.passwordResetSent = false,
  });

  final UserEntity? user;
  final bool isLoading;
  final String? error;
  final bool passwordResetSent;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    UserEntity? user,
    bool? isLoading,
    String? error,
    bool? passwordResetSent,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      passwordResetSent: passwordResetSent ?? this.passwordResetSent,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._ref) : super(const AuthState()) {
    _bootstrap();
  }

  final Ref _ref;

  Future<void> _bootstrap() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final result = await _ref.read(getCurrentUserUseCaseProvider).call();
    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (user) => state = state.copyWith(
        user: user,
        isLoading: false,
        clearUser: user == null,
      ),
    );
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
        state = state.copyWith(user: user, isLoading: false);
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

  void setPlan(String planId) {
    final user = state.user;
    if (user == null) return;
    state = state.copyWith(user: user.copyWith(plan: planId));
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});

final currentUserProvider = Provider<UserEntity?>((ref) {
  return ref.watch(authProvider).user;
});
