import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/chat/domain/entities/chat_entity.dart';
import 'package:leroy_ai/features/chat/domain/repositories/chat_repository.dart';

class GetChatSessionsUseCase {
  GetChatSessionsUseCase(this._repo);
  final ChatRepository _repo;
  ResultFuture<List<ChatSession>> call(String userId) =>
      _repo.getSessions(userId);
}

class CreateChatSessionUseCase {
  CreateChatSessionUseCase(this._repo);
  final ChatRepository _repo;
  ResultFuture<ChatSession> call(String userId, {String? title}) =>
      _repo.createSession(userId, title: title);
}

class GetChatMessagesUseCase {
  GetChatMessagesUseCase(this._repo);
  final ChatRepository _repo;
  ResultFuture<List<ChatMessage>> call(String userId, String chatId) =>
      _repo.getMessages(userId, chatId);
}

class SendChatMessageUseCase {
  SendChatMessageUseCase(this._repo);
  final ChatRepository _repo;
  ResultFuture<ChatMessage> call({
    required String userId,
    required String chatId,
    required String content,
  }) {
    return _repo.sendMessage(
      userId: userId,
      chatId: chatId,
      content: content,
    );
  }
}

class RegenerateChatReplyUseCase {
  RegenerateChatReplyUseCase(this._repo);
  final ChatRepository _repo;
  ResultFuture<ChatMessage> call({
    required String userId,
    required String chatId,
  }) {
    return _repo.regenerateLastReply(userId: userId, chatId: chatId);
  }
}

class DeleteChatSessionUseCase {
  DeleteChatSessionUseCase(this._repo);
  final ChatRepository _repo;
  ResultFuture<void> call(String userId, String chatId) =>
      _repo.deleteSession(userId, chatId);
}
