import '../../domain/entities/generated_image.dart';

class GeneratedImageModel extends GeneratedImage {
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
      style: ImageStyle.values.firstWhere(
        (e) => e.name == map['style'],
        orElse: () => ImageStyle.cinematic,
      ),
      aspectRatio: ImageAspectRatio.values.firstWhere(
        (e) => e.name == map['aspectRatio'],
        orElse: () => ImageAspectRatio.square,
      ),
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'prompt': prompt,
        'imageUrl': imageUrl,
        'createdAt': createdAt.toIso8601String(),
        'style': style.name,
        'aspectRatio': aspectRatio.name,
      };
}
