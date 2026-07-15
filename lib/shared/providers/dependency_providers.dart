import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/core/services/ai_cloud_service.dart';
import 'package:leroy_ai/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:leroy_ai/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:leroy_ai/features/auth/domain/repositories/auth_repository.dart';
import 'package:leroy_ai/features/auth/domain/usecases/auth_usecases.dart';
import 'package:leroy_ai/features/chat/data/datasources/chat_remote_datasource.dart';
import 'package:leroy_ai/features/chat/data/repositories/chat_repository_impl.dart';
import 'package:leroy_ai/features/chat/domain/repositories/chat_repository.dart';
import 'package:leroy_ai/features/chat/domain/usecases/chat_usecases.dart';
import 'package:leroy_ai/features/history/data/datasources/history_datasource.dart';
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
import 'package:leroy_ai/features/templates/data/datasources/templates_datasource.dart';
import 'package:leroy_ai/features/video_generator/data/datasources/video_remote_datasource.dart';
import 'package:leroy_ai/features/video_generator/data/repositories/video_repository_impl.dart';
import 'package:leroy_ai/features/video_generator/domain/repositories/video_repository.dart';
import 'package:leroy_ai/features/video_generator/domain/usecases/video_usecases.dart';

final aiCloudServiceProvider = Provider((ref) => AiCloudService());

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return FirebaseAuthDataSource();
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(ref.watch(authRemoteDataSourceProvider));
});

final signInUseCaseProvider =
    Provider((ref) => SignInUseCase(ref.watch(authRepositoryProvider)));
final signUpUseCaseProvider =
    Provider((ref) => SignUpUseCase(ref.watch(authRepositoryProvider)));
final forgotPasswordUseCaseProvider =
    Provider((ref) => ForgotPasswordUseCase(ref.watch(authRepositoryProvider)));
final signOutUseCaseProvider =
    Provider((ref) => SignOutUseCase(ref.watch(authRepositoryProvider)));
final getCurrentUserUseCaseProvider =
    Provider((ref) => GetCurrentUserUseCase(ref.watch(authRepositoryProvider)));
final updateProfileUseCaseProvider =
    Provider((ref) => UpdateProfileUseCase(ref.watch(authRepositoryProvider)));
final sendEmailVerificationUseCaseProvider = Provider(
  (ref) => SendEmailVerificationUseCase(ref.watch(authRepositoryProvider)),
);
final reloadUserUseCaseProvider =
    Provider((ref) => ReloadUserUseCase(ref.watch(authRepositoryProvider)));
final changePasswordUseCaseProvider =
    Provider((ref) => ChangePasswordUseCase(ref.watch(authRepositoryProvider)));
final uploadProfilePhotoUseCaseProvider = Provider(
  (ref) => UploadProfilePhotoUseCase(ref.watch(authRepositoryProvider)),
);

final chatRemoteDataSourceProvider = Provider<ChatRemoteDataSource>((ref) {
  return FirestoreChatDataSource(ai: ref.watch(aiCloudServiceProvider));
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
  return FirestoreImageDataSource(ai: ref.watch(aiCloudServiceProvider));
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

final videoRemoteDataSourceProvider = Provider<VideoRemoteDataSource>((ref) {
  return FirestoreVideoDataSource(ai: ref.watch(aiCloudServiceProvider));
});
final videoRepositoryProvider = Provider<VideoRepository>((ref) {
  return VideoRepositoryImpl(ref.watch(videoRemoteDataSourceProvider));
});
final generateVideoUseCaseProvider = Provider(
  (ref) => GenerateVideoUseCase(ref.watch(videoRepositoryProvider)),
);
final getVideoHistoryUseCaseProvider = Provider(
  (ref) => GetVideoHistoryUseCase(ref.watch(videoRepositoryProvider)),
);
final deleteVideoUseCaseProvider = Provider(
  (ref) => DeleteVideoUseCase(ref.watch(videoRepositoryProvider)),
);

final promptRemoteDataSourceProvider = Provider<PromptRemoteDataSource>((ref) {
  return FirestorePromptDataSource();
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
  return SubscriptionDataSourceImpl(ai: ref.watch(aiCloudServiceProvider));
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
final startCheckoutUseCaseProvider = Provider(
  (ref) => StartCheckoutUseCase(ref.watch(subscriptionRepositoryProvider)),
);

final historyDataSourceProvider = Provider((ref) => HistoryDataSource());
final templatesDataSourceProvider = Provider((ref) => TemplatesDataSource());
final deleteImageUseCaseProvider = Provider(
  (ref) => DeleteImageUseCase(ref.watch(imageRepositoryProvider)),
);
