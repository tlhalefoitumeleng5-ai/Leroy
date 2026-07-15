import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/di/providers.dart';
import '../../data/datasources/auth_demo_datasource.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/usecases/forgot_password_usecase.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/register_usecase.dart';

final authDemoDataSourceProvider = Provider<AuthDemoDataSource>((ref) {
  return AuthDemoDataSource(ref.watch(sharedPreferencesProvider));
});

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  if (ref.watch(demoModeProvider)) {
    return ref.watch(authDemoDataSourceProvider);
  }
  final auth = ref.watch(firebaseAuthProvider);
  final firestore = ref.watch(firestoreProvider);
  if (auth == null || firestore == null) {
    return ref.watch(authDemoDataSourceProvider);
  }
  return AuthRemoteDataSourceImpl(auth: auth, firestore: firestore);
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(ref.watch(authRemoteDataSourceProvider));
});

final loginUseCaseProvider = Provider((ref) => LoginUseCase(ref.watch(authRepositoryProvider)));
final registerUseCaseProvider = Provider((ref) => RegisterUseCase(ref.watch(authRepositoryProvider)));
final forgotPasswordUseCaseProvider =
    Provider((ref) => ForgotPasswordUseCase(ref.watch(authRepositoryProvider)));
final logoutUseCaseProvider = Provider((ref) => LogoutUseCase(ref.watch(authRepositoryProvider)));

final authStateProvider = StreamProvider<UserEntity?>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});

final currentUserProvider = Provider<UserEntity?>((ref) {
  return ref.watch(authStateProvider).valueOrNull;
});

enum AuthFormStatus { idle, loading, success, error }

class AuthFormState {
  const AuthFormState({
    this.status = AuthFormStatus.idle,
    this.message,
  });

  final AuthFormStatus status;
  final String? message;

  bool get isLoading => status == AuthFormStatus.loading;

  AuthFormState copyWith({AuthFormStatus? status, String? message}) {
    return AuthFormState(
      status: status ?? this.status,
      message: message,
    );
  }
}

class AuthController extends StateNotifier<AuthFormState> {
  AuthController(this._ref) : super(const AuthFormState());

  final Ref _ref;

  Future<bool> login(String email, String password) async {
    state = state.copyWith(status: AuthFormStatus.loading);
    final result = await _ref.read(loginUseCaseProvider)(
      LoginParams(email: email, password: password),
    );
    return result.fold(
      (f) {
        state = AuthFormState(status: AuthFormStatus.error, message: f.message);
        return false;
      },
      (_) {
        state = const AuthFormState(status: AuthFormStatus.success);
        return true;
      },
    );
  }

  Future<bool> register(String name, String email, String password) async {
    state = state.copyWith(status: AuthFormStatus.loading);
    final result = await _ref.read(registerUseCaseProvider)(
      RegisterParams(email: email, password: password, displayName: name),
    );
    return result.fold(
      (f) {
        state = AuthFormState(status: AuthFormStatus.error, message: f.message);
        return false;
      },
      (_) {
        state = const AuthFormState(status: AuthFormStatus.success);
        return true;
      },
    );
  }

  Future<bool> forgotPassword(String email) async {
    state = state.copyWith(status: AuthFormStatus.loading);
    final result = await _ref.read(forgotPasswordUseCaseProvider)(
      ForgotPasswordParams(email: email),
    );
    return result.fold(
      (f) {
        state = AuthFormState(status: AuthFormStatus.error, message: f.message);
        return false;
      },
      (_) {
        state = const AuthFormState(
          status: AuthFormStatus.success,
          message: 'Reset link sent. Check your inbox.',
        );
        return true;
      },
    );
  }

  Future<bool> continueAsGuest() async {
    state = state.copyWith(status: AuthFormStatus.loading);
    final result = await _ref.read(authRepositoryProvider).continueAsGuest();
    return result.fold(
      (f) {
        state = AuthFormState(status: AuthFormStatus.error, message: f.message);
        return false;
      },
      (_) {
        state = const AuthFormState(status: AuthFormStatus.success);
        return true;
      },
    );
  }

  Future<void> logout() async {
    await _ref.read(logoutUseCaseProvider)();
  }

  void clearError() {
    if (state.status == AuthFormStatus.error) {
      state = const AuthFormState();
    }
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthFormState>((ref) {
  return AuthController(ref);
});
