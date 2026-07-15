import 'package:uuid/uuid.dart';

import '../../domain/entities/chat_message.dart';
import '../models/chat_message_model.dart';

class ChatDemoDataSource {
  final _sessions = <ChatSession>[];
  final _messages = <String, List<ChatMessageModel>>{};
  final _uuid = const Uuid();

  Future<List<ChatSession>> getSessions() async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    return List.of(_sessions)
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
  }

  Future<List<ChatMessageModel>> getMessages(String sessionId) async {
    return List.of(_messages[sessionId] ?? []);
  }

  Future<ChatSession> createSession({String? title}) async {
    final session = ChatSession(
      id: _uuid.v4(),
      title: title ?? 'New chat',
      updatedAt: DateTime.now(),
    );
    _sessions.insert(0, session);
    _messages[session.id] = [];
    return session;
  }

  Future<ChatMessageModel> sendMessage({
    required String sessionId,
    required String content,
  }) async {
    final userMsg = ChatMessageModel(
      id: _uuid.v4(),
      role: MessageRole.user,
      content: content.trim(),
      createdAt: DateTime.now(),
    );
    _messages.putIfAbsent(sessionId, () => []).add(userMsg);

    await Future<void>.delayed(const Duration(milliseconds: 900));

    final reply = ChatMessageModel(
      id: _uuid.v4(),
      role: MessageRole.assistant,
      content: _generateReply(content),
      createdAt: DateTime.now(),
    );
    _messages[sessionId]!.add(reply);

    final idx = _sessions.indexWhere((s) => s.id == sessionId);
    if (idx >= 0) {
      final old = _sessions[idx];
      final title = old.title == 'New chat' && content.trim().isNotEmpty
          ? (content.trim().length > 36
              ? '${content.trim().substring(0, 36)}…'
              : content.trim())
          : old.title;
      _sessions[idx] = ChatSession(
        id: old.id,
        title: title,
        updatedAt: DateTime.now(),
        messageCount: _messages[sessionId]!.length,
      );
    }
    return reply;
  }

  Future<void> deleteSession(String sessionId) async {
    _sessions.removeWhere((s) => s.id == sessionId);
    _messages.remove(sessionId);
  }

  String _generateReply(String prompt) {
    final lower = prompt.toLowerCase();
    if (lower.contains('hello') || lower.contains('hi')) {
      return 'Hello! I\'m Leroy, your AI creative partner. Ask me to draft copy, brainstorm ideas, explain concepts, or help you craft better prompts.';
    }
    if (lower.contains('image') || lower.contains('visual')) {
      return 'For visuals, open **Image Studio** and describe subject, style, lighting, and mood. Tip: include camera angle and material details for sharper results.';
    }
    if (lower.contains('prompt')) {
      return 'Strong prompts are specific: role + goal + constraints + format. Example: "Act as a brand strategist. Write 5 taglines for a teal-accented AI app. Keep each under 6 words."';
    }
    return 'Here\'s a focused take on your request:\n\n'
        '**Summary**\n'
        'You asked about: "$prompt"\n\n'
        '**Suggested approach**\n'
        '1. Clarify the outcome you want.\n'
        '2. Add constraints (tone, length, audience).\n'
        '3. Iterate with one change at a time.\n\n'
        'I can refine this further — tell me the format you prefer (bullets, script, email, or outline).';
  }
}
