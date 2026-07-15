import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/core/services/ai_cloud_service.dart';
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
  FirestoreChatDataSource({
    FirebaseFirestore? firestore,
    AiCloudService? ai,
  })  : _db = firestore ?? FirebaseFirestore.instance,
        _ai = ai ?? AiCloudService();

  final FirebaseFirestore _db;
  final AiCloudService _ai;
  final _uuid = const Uuid();

  CollectionReference<Map<String, dynamic>> _chats(String userId) => _db
      .collection(AppConstants.usersCollection)
      .doc(userId)
      .collection(AppConstants.chatsCollection);

  @override
  Future<List<ChatSessionModel>> getSessions(String userId) async {
    try {
      final snap =
          await _chats(userId).orderBy('updatedAt', descending: true).get();
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
      await _db.collection(AppConstants.usersCollection).doc(userId).set({
        'chatsStarted': FieldValue.increment(1),
      }, SetOptions(merge: true));
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
      final messagesRef = _chats(userId)
          .doc(chatId)
          .collection(AppConstants.messagesCollection);

      final userMsg = ChatMessageModel(
        id: _uuid.v4(),
        role: MessageRole.user,
        content: content,
        createdAt: DateTime.now(),
      );
      await messagesRef.doc(userMsg.id).set(userMsg.toMap());

      final existing = await getMessages(userId, chatId);
      final history = existing
          .map((m) => {
                'role': m.role.name,
                'content': m.content,
              })
          .toList();

      final aiResult = await _ai.chat(
        message: content,
        chatId: chatId,
        history: history,
      );

      final replyText = aiResult['reply'] as String? ??
          aiResult['content'] as String? ??
          '';
      if (replyText.isEmpty) {
        throw ServerException('Empty AI response. Check Cloud Function config.');
      }

      final reply = ChatMessageModel(
        id: _uuid.v4(),
        role: MessageRole.assistant,
        content: replyText,
        createdAt: DateTime.now(),
      );
      await messagesRef.doc(reply.id).set(reply.toMap());
      await _chats(userId).doc(chatId).set({
        'updatedAt': DateTime.now().toIso8601String(),
        'lastMessage': reply.content,
        'messageCount': FieldValue.increment(2),
        'title': content.length > 40 ? '${content.substring(0, 40)}…' : content,
      }, SetOptions(merge: true));

      await _db.collection(AppConstants.historyCollection).add({
        'userId': userId,
        'type': 'chat',
        'title': content.length > 60 ? '${content.substring(0, 60)}…' : content,
        'refId': chatId,
        'createdAt': DateTime.now().toIso8601String(),
      });

      return reply;
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(e.toString());
    }
  }

  @override
  Future<void> deleteSession(String userId, String chatId) async {
    try {
      final msgs = await _chats(userId)
          .doc(chatId)
          .collection(AppConstants.messagesCollection)
          .get();
      for (final doc in msgs.docs) {
        await doc.reference.delete();
      }
      await _chats(userId).doc(chatId).delete();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }
}
