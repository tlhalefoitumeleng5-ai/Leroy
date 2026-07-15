import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/chat/domain/entities/chat_entity.dart';

abstract class ChatRepository {
  ResultFuture<List<ChatSession>> getSessions(String userId);
  ResultFuture<ChatSession> createSession(String userId, {String? title});
  ResultFuture<List<ChatMessage>> getMessages(String userId, String chatId);
  ResultFuture<ChatMessage> sendMessage({
    required String userId,
    required String chatId,
    required String content,
  });
  ResultFuture<void> deleteSession(String userId, String chatId);
}
