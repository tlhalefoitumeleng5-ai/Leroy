import 'package:leroy_ai/features/video_generator/domain/entities/generated_video_entity.dart';

class GeneratedVideoModel extends GeneratedVideoEntity {
  const GeneratedVideoModel({
    required super.id,
    required super.prompt,
    required super.videoUrl,
    required super.createdAt,
    super.durationSeconds,
    super.quality,
    super.voiceEnabled,
    super.musicEnabled,
    super.thumbnailUrl,
  });

  factory GeneratedVideoModel.fromMap(Map<String, dynamic> map) {
    return GeneratedVideoModel(
      id: map['id'] as String,
      prompt: map['prompt'] as String? ?? '',
      videoUrl: map['videoUrl'] as String? ?? '',
      createdAt: DateTime.tryParse(map['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      durationSeconds: map['durationSeconds'] as int? ?? 5,
      quality: map['quality'] as String? ?? 'hd',
      voiceEnabled: map['voiceEnabled'] as bool? ?? false,
      musicEnabled: map['musicEnabled'] as bool? ?? false,
      thumbnailUrl: map['thumbnailUrl'] as String?,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'prompt': prompt,
        'videoUrl': videoUrl,
        'createdAt': createdAt.toIso8601String(),
        'durationSeconds': durationSeconds,
        'quality': quality,
        'voiceEnabled': voiceEnabled,
        'musicEnabled': musicEnabled,
        'thumbnailUrl': thumbnailUrl,
      };
}
