import 'package:equatable/equatable.dart';

class GeneratedImageEntity extends Equatable {
  const GeneratedImageEntity({
    required this.id,
    required this.prompt,
    required this.imageUrl,
    required this.createdAt,
    this.style = 'cinematic',
    this.aspectRatio = '1:1',
  });

  final String id;
  final String prompt;
  final String imageUrl;
  final DateTime createdAt;
  final String style;
  final String aspectRatio;

  @override
  List<Object?> get props =>
      [id, prompt, imageUrl, createdAt, style, aspectRatio];
}
