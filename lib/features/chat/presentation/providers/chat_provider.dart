import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';
import 'package:leroy_ai/features/chat/domain/entities/chat_entity.dart';
import 'package:leroy_ai/shared/providers/dependency_providers.dart';

class ChatListState {
  const ChatListState({
    this.sessions = const [],
    this.isLoading = false,
    this.error,
  });

  final List<ChatSession> sessions;
  final bool isLoading;
  final String? error;

  ChatListState copyWith({
    List<ChatSession>? sessions,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return ChatListState(
      sessions: sessions ?? this.sessions,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class ChatListNotifier extends StateNotifier<ChatListState> {
  ChatListNotifier(this._ref) : super(const ChatListState()) {
    load();
  }

  final Ref _ref;

  String? get _userId => _ref.read(currentUserProvider)?.id;

  Future<void> load() async {
    final userId = _userId;
    if (userId == null) return;
    state = state.copyWith(isLoading: true, clearError: true);
    final result = await _ref.read(getChatSessionsUseCaseProvider).call(userId);
    result.fold(
      (f) => state = state.copyWith(isLoading: false, error: f.message),
      (sessions) =>
          state = state.copyWith(sessions: sessions, isLoading: false),
    );
  }

  Future<ChatSession?> createSession() async {
    final userId = _userId;
    if (userId == null) return null;
    final result =
        await _ref.read(createChatSessionUseCaseProvider).call(userId);
    return result.fold((f) {
      state = state.copyWith(error: f.message);
      return null;
    }, (session) {
      state = state.copyWith(sessions: [session, ...state.sessions]);
      return session;
    });
  }
}

final chatListProvider =
    StateNotifierProvider<ChatListNotifier, ChatListState>((ref) {
  return ChatListNotifier(ref);
});

class ChatDetailState {
  const ChatDetailState({
    this.messages = const [],
    this.isLoading = false,
    this.isSending = false,
    this.error,
  });

  final List<ChatMessage> messages;
  final bool isLoading;
  final bool isSending;
  final String? error;

  ChatDetailState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    bool? isSending,
    String? error,
    bool clearError = false,
  }) {
    return ChatDetailState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isSending: isSending ?? this.isSending,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class ChatDetailNotifier extends StateNotifier<ChatDetailState> {
  ChatDetailNotifier(this._ref, this.chatId) : super(const ChatDetailState()) {
    load();
  }

  final Ref _ref;
  final String chatId;

  String? get _userId => _ref.read(currentUserProvider)?.id;

  Future<void> load() async {
    final userId = _userId;
    if (userId == null) return;
    state = state.copyWith(isLoading: true, clearError: true);
    final result =
        await _ref.read(getChatMessagesUseCaseProvider).call(userId, chatId);
    result.fold(
      (f) => state = state.copyWith(isLoading: false, error: f.message),
      (messages) =>
          state = state.copyWith(messages: messages, isLoading: false),
    );
  }

  Future<void> send(String content) async {
    final userId = _userId;
    if (userId == null || content.trim().isEmpty) return;
    final optimistic = ChatMessage(
      id: 'local-${DateTime.now().millisecondsSinceEpoch}',
      role: MessageRole.user,
      content: content.trim(),
      createdAt: DateTime.now(),
    );
    state = state.copyWith(
      messages: [...state.messages, optimistic],
      isSending: true,
      clearError: true,
    );
    final result = await _ref.read(sendChatMessageUseCaseProvider).call(
          userId: userId,
          chatId: chatId,
          content: content.trim(),
        );
    result.fold(
      (f) => state = state.copyWith(isSending: false, error: f.message),
      (reply) => state = state.copyWith(
        messages: [...state.messages, reply],
        isSending: false,
      ),
    );
    await _ref.read(chatListProvider.notifier).load();
  }
}

final chatDetailProvider = StateNotifierProvider.family<ChatDetailNotifier,
    ChatDetailState, String>((ref, chatId) {
  return ChatDetailNotifier(ref, chatId);
});
