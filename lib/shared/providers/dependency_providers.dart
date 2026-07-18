import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:leroy_ai/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:leroy_ai/features/auth/domain/repositories/auth_repository.dart';
import 'package:leroy_ai/features/auth/domain/usecases/auth_usecases.dart';
import 'package:leroy_ai/features/chat/data/datasources/chat_remote_datasource.dart';
import 'package:leroy_ai/features/chat/data/repositories/chat_repository_impl.dart';
import 'package:leroy_ai/features/chat/domain/repositories/chat_repository.dart';
import 'package:leroy_ai/features/chat/domain/usecases/chat_usecases.dart';
import 'package:leroy_ai/features/image_generator/data/datasources/image_remote_datasource.dart';
import 'package:leroy_ai/features/image_generator/data/repositories/image_repository_impl.dart';
import 'package:leroy_ai/features/image_generator/domain/repositories/image_repository.dart';
import 'package:leroy_ai/features/image_generator/domain/usecases/image_usecases.dart';
import 'package:leroy_ai/features/prompt_library/data/datasources/prompt_remote_datasource.dart';
import 'package:leroy_ai/features/prompt_library/data/repositories/prompt_repository_impl.dart';
import 'package:leroy_ai/features/prompt_library/domain/repositories/prompt_repository.dart';
import 'package:leroy_ai/features/prompt_library/domain/usecases/prompt_usecases.dart';
import 'package:leroy_ai/features/subscription/data/datasources/subscription_datasource.dart';
import 'package:leroy_ai/features/subscription/data/repositories/subscription_repository_impl.dart';
import 'package:leroy_ai/features/subscription/domain/repositories/subscription_repository.dart';
import 'package:leroy_ai/features/subscription/domain/usecases/subscription_usecases.dart';
import 'package:leroy_ai/features/video_studio/data/repositories/video_studio_repository_impl.dart';
import 'package:leroy_ai/features/video_studio/data/services/video_render_engine.dart';
import 'package:leroy_ai/features/video_studio/domain/repositories/video_studio_repository.dart';
import 'package:leroy_ai/features/video_studio/domain/usecases/video_studio_usecases.dart';
import 'package:leroy_ai/shared/providers/app_config_provider.dart';

/// Dependency injection via Riverpod — swap demo/Firebase based on config.

final _demoAuthDataSourceProvider = Provider<DemoAuthDataSource>((ref) {
  return DemoAuthDataSource();
});

final _demoChatDataSourceProvider = Provider<DemoChatDataSource>((ref) {
  return DemoChatDataSource();
});

final _demoImageDataSourceProvider = Provider<DemoImageDataSource>((ref) {
  return DemoImageDataSource();
});

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  final demo = ref.watch(isDemoModeProvider);
  return demo
      ? ref.watch(_demoAuthDataSourceProvider)
      : FirebaseAuthDataSource();
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(ref.watch(authRemoteDataSourceProvider));
});

final signInUseCaseProvider = Provider(
  (ref) => SignInUseCase(ref.watch(authRepositoryProvider)),
);
final signUpUseCaseProvider = Provider(
  (ref) => SignUpUseCase(ref.watch(authRepositoryProvider)),
);
final forgotPasswordUseCaseProvider = Provider(
  (ref) => ForgotPasswordUseCase(ref.watch(authRepositoryProvider)),
);
final signOutUseCaseProvider = Provider(
  (ref) => SignOutUseCase(ref.watch(authRepositoryProvider)),
);
final getCurrentUserUseCaseProvider = Provider(
  (ref) => GetCurrentUserUseCase(ref.watch(authRepositoryProvider)),
);
final updateProfileUseCaseProvider = Provider(
  (ref) => UpdateProfileUseCase(ref.watch(authRepositoryProvider)),
);

final chatRemoteDataSourceProvider = Provider<ChatRemoteDataSource>((ref) {
  final demo = ref.watch(isDemoModeProvider);
  return demo
      ? ref.watch(_demoChatDataSourceProvider)
      : FirestoreChatDataSource();
});

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepositoryImpl(ref.watch(chatRemoteDataSourceProvider));
});

final getChatSessionsUseCaseProvider = Provider(
  (ref) => GetChatSessionsUseCase(ref.watch(chatRepositoryProvider)),
);
final createChatSessionUseCaseProvider = Provider(
  (ref) => CreateChatSessionUseCase(ref.watch(chatRepositoryProvider)),
);
final getChatMessagesUseCaseProvider = Provider(
  (ref) => GetChatMessagesUseCase(ref.watch(chatRepositoryProvider)),
);
final sendChatMessageUseCaseProvider = Provider(
  (ref) => SendChatMessageUseCase(ref.watch(chatRepositoryProvider)),
);
final deleteChatSessionUseCaseProvider = Provider(
  (ref) => DeleteChatSessionUseCase(ref.watch(chatRepositoryProvider)),
);

final imageRemoteDataSourceProvider = Provider<ImageRemoteDataSource>((ref) {
  final demo = ref.watch(isDemoModeProvider);
  return demo
      ? ref.watch(_demoImageDataSourceProvider)
      : FirestoreImageDataSource();
});

final imageRepositoryProvider = Provider<ImageRepository>((ref) {
  return ImageRepositoryImpl(ref.watch(imageRemoteDataSourceProvider));
});

final generateImageUseCaseProvider = Provider(
  (ref) => GenerateImageUseCase(ref.watch(imageRepositoryProvider)),
);
final getImageHistoryUseCaseProvider = Provider(
  (ref) => GetImageHistoryUseCase(ref.watch(imageRepositoryProvider)),
);

final promptRemoteDataSourceProvider = Provider<PromptRemoteDataSource>((ref) {
  return LocalPromptDataSource();
});

final promptRepositoryProvider = Provider<PromptRepository>((ref) {
  return PromptRepositoryImpl(ref.watch(promptRemoteDataSourceProvider));
});

final getPromptsUseCaseProvider = Provider(
  (ref) => GetPromptsUseCase(ref.watch(promptRepositoryProvider)),
);
final toggleFavoritePromptUseCaseProvider = Provider(
  (ref) => ToggleFavoritePromptUseCase(ref.watch(promptRepositoryProvider)),
);
final getPromptCategoriesUseCaseProvider = Provider(
  (ref) => GetPromptCategoriesUseCase(ref.watch(promptRepositoryProvider)),
);

final subscriptionDataSourceProvider = Provider<SubscriptionDataSource>((ref) {
  final demo = ref.watch(isDemoModeProvider);
  return SubscriptionDataSourceImpl(useFirebase: !demo);
});

final subscriptionRepositoryProvider = Provider<SubscriptionRepository>((ref) {
  return SubscriptionRepositoryImpl(ref.watch(subscriptionDataSourceProvider));
});

final getPlansUseCaseProvider = Provider(
  (ref) => GetPlansUseCase(ref.watch(subscriptionRepositoryProvider)),
);
final getCurrentPlanUseCaseProvider = Provider(
  (ref) => GetCurrentPlanUseCase(ref.watch(subscriptionRepositoryProvider)),
);
final selectPlanUseCaseProvider = Provider(
  (ref) => SelectPlanUseCase(ref.watch(subscriptionRepositoryProvider)),
);

final videoRenderEngineProvider = Provider<VideoRenderEngine>((ref) {
  return VideoRenderEngine();
});

final videoStudioRepositoryProvider = Provider<VideoStudioRepository>((ref) {
  return VideoStudioRepositoryImpl(
    ref.watch(videoRenderEngineProvider),
    ref.watch(sharedPreferencesProvider),
  );
});

final loadVideoLibraryUseCaseProvider = Provider(
  (ref) => LoadVideoLibraryUseCase(ref.watch(videoStudioRepositoryProvider)),
);
final renderVideoUseCaseProvider = Provider(
  (ref) => RenderVideoUseCase(ref.watch(videoStudioRepositoryProvider)),
);
final renderAllVideosUseCaseProvider = Provider(
  (ref) => RenderAllVideosUseCase(ref.watch(videoStudioRepositoryProvider)),
);
final deleteGeneratedVideoUseCaseProvider = Provider(
  (ref) =>
      DeleteGeneratedVideoUseCase(ref.watch(videoStudioRepositoryProvider)),
);
