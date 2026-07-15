import 'package:equatable/equatable.dart';

enum ImageAspectRatio { square, portrait, landscape }
enum ImageStyle { cinematic, illustration, photoreal, abstractArt, product }

class GeneratedImage extends Equatable {
  const GeneratedImage({
    required this.id,
    required this.prompt,
    required this.imageUrl,
    required this.createdAt,
    this.style = ImageStyle.cinematic,
    this.aspectRatio = ImageAspectRatio.square,
  });

  final String id;
  final String prompt;
  final String imageUrl;
  final DateTime createdAt;
  final ImageStyle style;
  final ImageAspectRatio aspectRatio;

  @override
  List<Object?> get props => [id, prompt, imageUrl, createdAt, style, aspectRatio];
}
