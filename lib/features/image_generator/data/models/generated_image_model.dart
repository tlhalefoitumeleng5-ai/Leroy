import 'package:leroy_ai/features/image_generator/domain/entities/generated_image_entity.dart';

class GeneratedImageModel extends GeneratedImageEntity {
  const GeneratedImageModel({
    required super.id,
    required super.prompt,
    required super.imageUrl,
    required super.createdAt,
    super.style,
    super.aspectRatio,
  });

  factory GeneratedImageModel.fromMap(Map<String, dynamic> map) {
    return GeneratedImageModel(
      id: map['id'] as String,
      prompt: map['prompt'] as String? ?? '',
      imageUrl: map['imageUrl'] as String? ?? '',
      createdAt: DateTime.tryParse(map['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      style: map['style'] as String? ?? 'cinematic',
      aspectRatio: map['aspectRatio'] as String? ?? '1:1',
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'prompt': prompt,
        'imageUrl': imageUrl,
        'createdAt': createdAt.toIso8601String(),
        'style': style,
        'aspectRatio': aspectRatio,
      };
}
