import '../../domain/entities/prompt_entity.dart';

class PromptModel extends PromptEntity {
  const PromptModel({
    required super.id,
    required super.title,
    required super.content,
    required super.category,
    super.tags,
    super.isFavorite,
    super.usageCount,
  });

  factory PromptModel.fromMap(Map<String, dynamic> map) {
    return PromptModel(
      id: map['id'] as String,
      title: map['title'] as String? ?? '',
      content: map['content'] as String? ?? '',
      category: map['category'] as String? ?? 'General',
      tags: (map['tags'] as List<dynamic>?)?.cast<String>() ?? const [],
      isFavorite: map['isFavorite'] as bool? ?? false,
      usageCount: map['usageCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'content': content,
        'category': category,
        'tags': tags,
        'isFavorite': isFavorite,
        'usageCount': usageCount,
      };
}
