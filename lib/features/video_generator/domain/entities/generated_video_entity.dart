import 'package:equatable/equatable.dart';

class GeneratedVideoEntity extends Equatable {
  const GeneratedVideoEntity({
    required this.id,
    required this.prompt,
    required this.videoUrl,
    required this.createdAt,
    this.durationSeconds = 5,
    this.quality = 'hd',
    this.voiceEnabled = false,
    this.musicEnabled = false,
    this.thumbnailUrl,
  });

  final String id;
  final String prompt;
  final String videoUrl;
  final DateTime createdAt;
  final int durationSeconds;
  final String quality;
  final bool voiceEnabled;
  final bool musicEnabled;
  final String? thumbnailUrl;

  @override
  List<Object?> get props =>
      [id, prompt, videoUrl, createdAt, durationSeconds, quality];
}
