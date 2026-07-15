import '../../../../core/utils/typedefs.dart';
import '../../../../core/utils/usecase.dart';
import '../entities/chat_message.dart';
import '../repositories/chat_repository.dart';

class SendMessageUseCase implements UseCase<ChatMessage, SendMessageParams> {
  SendMessageUseCase(this._repository);
  final ChatRepository _repository;

  @override
  ResultFuture<ChatMessage> call(SendMessageParams params) {
    return _repository.sendMessage(
      sessionId: params.sessionId,
      content: params.content,
    );
  }
}

class SendMessageParams {
  const SendMessageParams({required this.sessionId, required this.content});
  final String sessionId;
  final String content;
}
