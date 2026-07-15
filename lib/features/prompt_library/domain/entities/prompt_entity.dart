import 'package:equatable/equatable.dart';

class PromptEntity extends Equatable {
  const PromptEntity({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    this.tags = const [],
    this.isFavorite = false,
    this.usageCount = 0,
  });

  final String id;
  final String title;
  final String content;
  final String category;
  final List<String> tags;
  final bool isFavorite;
  final int usageCount;

  PromptEntity copyWith({bool? isFavorite, int? usageCount}) {
    return PromptEntity(
      id: id,
      title: title,
      content: content,
      category: category,
      tags: tags,
      isFavorite: isFavorite ?? this.isFavorite,
      usageCount: usageCount ?? this.usageCount,
    );
  }

  @override
  List<Object?> get props =>
      [id, title, content, category, tags, isFavorite, usageCount];
}
