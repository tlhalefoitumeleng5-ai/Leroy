import 'package:equatable/equatable.dart';

class PromptEntity extends Equatable {
  const PromptEntity({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    this.isFavorite = false,
    this.tags = const [],
  });

  final String id;
  final String title;
  final String content;
  final String category;
  final bool isFavorite;
  final List<String> tags;

  PromptEntity copyWith({bool? isFavorite}) {
    return PromptEntity(
      id: id,
      title: title,
      content: content,
      category: category,
      isFavorite: isFavorite ?? this.isFavorite,
      tags: tags,
    );
  }

  @override
  List<Object?> get props => [id, title, content, category, isFavorite, tags];
}
