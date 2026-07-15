import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/features/chat/data/models/chat_models.dart';
import 'package:leroy_ai/features/chat/domain/entities/chat_entity.dart';
import 'package:uuid/uuid.dart';

abstract class ChatRemoteDataSource {
  Future<List<ChatSessionModel>> getSessions(String userId);
  Future<ChatSessionModel> createSession(String userId, {String? title});
  Future<List<ChatMessageModel>> getMessages(String userId, String chatId);
  Future<ChatMessageModel> sendMessage({
    required String userId,
    required String chatId,
    required String content,
  });
  Future<void> deleteSession(String userId, String chatId);
}

class FirestoreChatDataSource implements ChatRemoteDataSource {
  FirestoreChatDataSource({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;
  final _uuid = const Uuid();

  CollectionReference<Map<String, dynamic>> _chats(String userId) => _db
      .collection(AppConstants.usersCollection)
      .doc(userId)
      .collection(AppConstants.chatsCollection);

  @override
  Future<List<ChatSessionModel>> getSessions(String userId) async {
    try {
      final snap = await _chats(userId)
          .orderBy('updatedAt', descending: true)
          .get();
      return snap.docs
          .map((d) => ChatSessionModel.fromMap({...d.data(), 'id': d.id}))
          .toList();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<ChatSessionModel> createSession(String userId, {String? title}) async {
    try {
      final id = _uuid.v4();
      final model = ChatSessionModel(
        id: id,
        title: title ?? 'New conversation',
        updatedAt: DateTime.now(),
      );
      await _chats(userId).doc(id).set(model.toMap());
      return model;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<List<ChatMessageModel>> getMessages(
    String userId,
    String chatId,
  ) async {
    try {
      final snap = await _chats(userId)
          .doc(chatId)
          .collection(AppConstants.messagesCollection)
          .orderBy('createdAt')
          .get();
      return snap.docs
          .map((d) => ChatMessageModel.fromMap({...d.data(), 'id': d.id}))
          .toList();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<ChatMessageModel> sendMessage({
    required String userId,
    required String chatId,
    required String content,
  }) async {
    try {
      final userMsg = ChatMessageModel(
        id: _uuid.v4(),
        role: MessageRole.user,
        content: content,
        createdAt: DateTime.now(),
      );
      final messages = _chats(userId)
          .doc(chatId)
          .collection(AppConstants.messagesCollection);
      await messages.doc(userMsg.id).set(userMsg.toMap());

      // Simulated AI response — replace with Cloud Function / API in production.
      final reply = ChatMessageModel(
        id: _uuid.v4(),
        role: MessageRole.assistant,
        content: _generateReply(content),
        createdAt: DateTime.now().add(const Duration(milliseconds: 300)),
      );
      await messages.doc(reply.id).set(reply.toMap());
      await _chats(userId).doc(chatId).set({
        'updatedAt': DateTime.now().toIso8601String(),
        'lastMessage': reply.content,
        'messageCount': FieldValue.increment(2),
        'title': content.length > 40 ? '${content.substring(0, 40)}…' : content,
      }, SetOptions(merge: true));
      return reply;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<void> deleteSession(String userId, String chatId) async {
    try {
      await _chats(userId).doc(chatId).delete();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  String _generateReply(String content) {
    return 'Here is a thoughtful response from Leroy AI based on your message:\n\n'
        '"$content"\n\n'
        'I can help refine this idea, expand it into steps, or turn it into a creative brief. '
        'What would you like to explore next?';
  }
}

class DemoChatDataSource implements ChatRemoteDataSource {
  final _uuid = const Uuid();
  final Map<String, ChatSessionModel> _sessions = {};
  final Map<String, List<ChatMessageModel>> _messages = {};

  @override
  Future<List<ChatSessionModel>> getSessions(String userId) async {
    final list = _sessions.values.toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    if (list.isEmpty) {
      final seeded = await createSession(userId, title: 'Welcome to Leroy');
      _messages[seeded.id] = [
        ChatMessageModel(
          id: _uuid.v4(),
          role: MessageRole.assistant,
          content:
              'Hi! I am Leroy AI. Ask me anything — brainstorming, writing, coding, or creative ideas.',
          createdAt: DateTime.now(),
        ),
      ];
      return [seeded];
    }
    return list;
  }

  @override
  Future<ChatSessionModel> createSession(String userId, {String? title}) async {
    final model = ChatSessionModel(
      id: _uuid.v4(),
      title: title ?? 'New conversation',
      updatedAt: DateTime.now(),
    );
    _sessions[model.id] = model;
    _messages[model.id] = [];
    return model;
  }

  @override
  Future<List<ChatMessageModel>> getMessages(
    String userId,
    String chatId,
  ) async {
    return List.of(_messages[chatId] ?? const []);
  }

  @override
  Future<ChatMessageModel> sendMessage({
    required String userId,
    required String chatId,
    required String content,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 700));
    final userMsg = ChatMessageModel(
      id: _uuid.v4(),
      role: MessageRole.user,
      content: content,
      createdAt: DateTime.now(),
    );
    final reply = ChatMessageModel(
      id: _uuid.v4(),
      role: MessageRole.assistant,
      content:
          'Thanks for sharing that. Here is a clear, actionable take from Leroy AI:\n\n'
          '1. Clarify the goal behind "$content".\n'
          '2. Break it into the next three concrete steps.\n'
          '3. Decide what success looks like in 24 hours.\n\n'
          'Want me to expand any of these?',
      createdAt: DateTime.now(),
    );
    _messages.putIfAbsent(chatId, () => []).addAll([userMsg, reply]);
    final existing = _sessions[chatId];
    if (existing != null) {
      _sessions[chatId] = ChatSessionModel(
        id: existing.id,
        title: content.length > 36 ? '${content.substring(0, 36)}…' : content,
        updatedAt: DateTime.now(),
        lastMessage: reply.content,
        messageCount: (_messages[chatId]?.length ?? 0),
      );
    }
    return reply;
  }

  @override
  Future<void> deleteSession(String userId, String chatId) async {
    _sessions.remove(chatId);
    _messages.remove(chatId);
  }
}
