import 'package:leroy_ai/features/chat/domain/entities/chat_entity.dart';

class ChatMessageModel extends ChatMessage {
  const ChatMessageModel({
    required super.id,
    required super.role,
    required super.content,
    required super.createdAt,
  });

  factory ChatMessageModel.fromMap(Map<String, dynamic> map) {
    return ChatMessageModel(
      id: map['id'] as String,
      role: MessageRole.values.firstWhere(
        (e) => e.name == (map['role'] as String? ?? 'user'),
        orElse: () => MessageRole.user,
      ),
      content: map['content'] as String? ?? '',
      createdAt: DateTime.tryParse(map['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'role': role.name,
        'content': content,
        'createdAt': createdAt.toIso8601String(),
      };
}

class ChatSessionModel extends ChatSession {
  const ChatSessionModel({
    required super.id,
    required super.title,
    required super.updatedAt,
    super.lastMessage,
    super.messageCount,
  });

  factory ChatSessionModel.fromMap(Map<String, dynamic> map) {
    return ChatSessionModel(
      id: map['id'] as String,
      title: map['title'] as String? ?? 'New chat',
      updatedAt: DateTime.tryParse(map['updatedAt']?.toString() ?? '') ??
          DateTime.now(),
      lastMessage: map['lastMessage'] as String?,
      messageCount: map['messageCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'updatedAt': updatedAt.toIso8601String(),
        'lastMessage': lastMessage,
        'messageCount': messageCount,
      };
}
