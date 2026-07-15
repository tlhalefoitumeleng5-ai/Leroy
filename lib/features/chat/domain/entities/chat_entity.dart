import 'package:equatable/equatable.dart';

enum MessageRole { user, assistant, system }

class ChatMessage extends Equatable {
  const ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.createdAt,
  });

  final String id;
  final MessageRole role;
  final String content;
  final DateTime createdAt;

  bool get isUser => role == MessageRole.user;

  @override
  List<Object?> get props => [id, role, content, createdAt];
}

class ChatSession extends Equatable {
  const ChatSession({
    required this.id,
    required this.title,
    required this.updatedAt,
    this.lastMessage,
    this.messageCount = 0,
  });

  final String id;
  final String title;
  final DateTime updatedAt;
  final String? lastMessage;
  final int messageCount;

  @override
  List<Object?> get props => [id, title, updatedAt, lastMessage, messageCount];
}
