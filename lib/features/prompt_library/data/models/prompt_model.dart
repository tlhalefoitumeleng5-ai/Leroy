import 'package:leroy_ai/features/prompt_library/domain/entities/prompt_entity.dart';

class PromptModel extends PromptEntity {
  const PromptModel({
    required super.id,
    required super.title,
    required super.content,
    required super.category,
    super.isFavorite,
    super.tags,
  });

  factory PromptModel.fromMap(Map<String, dynamic> map) {
    return PromptModel(
      id: map['id'] as String,
      title: map['title'] as String? ?? '',
      content: map['content'] as String? ?? '',
      category: map['category'] as String? ?? 'General',
      isFavorite: map['isFavorite'] as bool? ?? false,
      tags: (map['tags'] as List<dynamic>?)?.cast<String>() ?? const [],
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'content': content,
        'category': category,
        'isFavorite': isFavorite,
        'tags': tags,
      };
}
