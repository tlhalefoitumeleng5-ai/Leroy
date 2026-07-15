import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:uuid/uuid.dart';

import '../../../../core/constants/firestore_paths.dart';
import '../../../../core/errors/exceptions.dart';
import '../../domain/entities/chat_message.dart';
import '../models/chat_message_model.dart';

/// Firestore-backed chat datasource (production path).
class ChatRemoteDataSource {
  ChatRemoteDataSource({
    required FirebaseFirestore firestore,
    required this.uid,
  }) : _firestore = firestore;

  final FirebaseFirestore _firestore;
  final String uid;
  final _uuid = const Uuid();

  Future<List<ChatSession>> getSessions() async {
    try {
      final snap = await _firestore
          .collection(FirestorePaths.userChats(uid))
          .orderBy('updatedAt', descending: true)
          .get();
      return snap.docs.map((d) {
        final data = d.data();
        return ChatSession(
          id: d.id,
          title: data['title'] as String? ?? 'Chat',
          updatedAt: DateTime.tryParse(data['updatedAt']?.toString() ?? '') ??
              DateTime.now(),
          messageCount: data['messageCount'] as int? ?? 0,
        );
      }).toList();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  Future<List<ChatMessageModel>> getMessages(String sessionId) async {
    final snap = await _firestore
        .collection(FirestorePaths.chatMessages(uid, sessionId))
        .orderBy('createdAt')
        .get();
    return snap.docs
        .map((d) => ChatMessageModel.fromMap({...d.data(), 'id': d.id}))
        .toList();
  }

  Future<ChatSession> createSession({String? title}) async {
    final id = _uuid.v4();
    final now = DateTime.now().toIso8601String();
    await _firestore.doc(FirestorePaths.chat(uid, id)).set({
      'title': title ?? 'New chat',
      'updatedAt': now,
      'messageCount': 0,
    });
    return ChatSession(
      id: id,
      title: title ?? 'New chat',
      updatedAt: DateTime.now(),
    );
  }

  Future<ChatMessageModel> sendMessage({
    required String sessionId,
    required String content,
  }) async {
    // Persist user message; assistant reply should come from Cloud Function / API.
    final userMsg = ChatMessageModel(
      id: _uuid.v4(),
      role: MessageRole.user,
      content: content,
      createdAt: DateTime.now(),
    );
    await _firestore
        .doc('${FirestorePaths.chatMessages(uid, sessionId)}/${userMsg.id}')
        .set(userMsg.toMap());
    throw const ServerException(
      'Connect your AI backend (Cloud Function / API) to generate replies.',
    );
  }

  Future<void> deleteSession(String sessionId) async {
    await _firestore.doc(FirestorePaths.chat(uid, sessionId)).delete();
  }
}
