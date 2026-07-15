import '../../../../core/utils/typedefs.dart';
import '../entities/chat_message.dart';

abstract class ChatRepository {
  ResultFuture<List<ChatSession>> getSessions();
  ResultFuture<List<ChatMessage>> getMessages(String sessionId);
  ResultFuture<ChatSession> createSession({String? title});
  ResultFuture<ChatMessage> sendMessage({
    required String sessionId,
    required String content,
  });
  ResultVoid deleteSession(String sessionId);
}
