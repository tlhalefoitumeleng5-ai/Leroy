import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../data/datasources/chat_demo_datasource.dart';
import '../../data/repositories/chat_repository_impl.dart';
import '../../domain/entities/chat_message.dart';
import '../../domain/repositories/chat_repository.dart';

final chatDemoDataSourceProvider = Provider((ref) => ChatDemoDataSource());

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepositoryImpl(ref.watch(chatDemoDataSourceProvider));
});

class ChatState {
  const ChatState({
    this.sessionId,
    this.messages = const [],
    this.isSending = false,
    this.error,
  });

  final String? sessionId;
  final List<ChatMessage> messages;
  final bool isSending;
  final String? error;

  ChatState copyWith({
    String? sessionId,
    List<ChatMessage>? messages,
    bool? isSending,
    String? error,
  }) {
    return ChatState(
      sessionId: sessionId ?? this.sessionId,
      messages: messages ?? this.messages,
      isSending: isSending ?? this.isSending,
      error: error,
    );
  }
}

class ChatController extends StateNotifier<ChatState> {
  ChatController(this._repo) : super(const ChatState());

  final ChatRepository _repo;
  final _uuid = const Uuid();

  Future<void> ensureSession() async {
    if (state.sessionId != null) return;
    final result = await _repo.createSession();
    result.fold(
      (f) => state = state.copyWith(error: f.message),
      (s) => state = state.copyWith(sessionId: s.id),
    );
  }

  Future<void> send(String content) async {
    if (content.trim().isEmpty || state.isSending) return;
    await ensureSession();
    final sessionId = state.sessionId;
    if (sessionId == null) return;

    final optimistic = ChatMessage(
      id: _uuid.v4(),
      role: MessageRole.user,
      content: content.trim(),
      createdAt: DateTime.now(),
    );
    state = state.copyWith(
      messages: [...state.messages, optimistic],
      isSending: true,
      error: null,
    );

    final result = await _repo.sendMessage(sessionId: sessionId, content: content);
    result.fold(
      (f) => state = state.copyWith(isSending: false, error: f.message),
      (reply) => state = state.copyWith(
        messages: [...state.messages, reply],
        isSending: false,
      ),
    );
  }

  Future<void> startNewChat() async {
    final result = await _repo.createSession();
    result.fold(
      (f) => state = state.copyWith(error: f.message),
      (s) => state = ChatState(sessionId: s.id),
    );
  }
}

final chatControllerProvider =
    StateNotifierProvider<ChatController, ChatState>((ref) {
  return ChatController(ref.watch(chatRepositoryProvider));
});
