import 'package:equatable/equatable.dart';

class GeneratedVideoEntity extends Equatable {
  const GeneratedVideoEntity({
    required this.id,
    required this.scriptNumber,
    required this.title,
    required this.topic,
    required this.filePath,
    required this.createdAt,
    required this.durationSeconds,
    this.thumbnailPath,
  });

  final String id;
  final int scriptNumber;
  final String title;
  final String topic;
  final String filePath;
  final DateTime createdAt;
  final double durationSeconds;
  final String? thumbnailPath;

  bool get exists => filePath.isNotEmpty;

  @override
  List<Object?> get props =>
      [id, scriptNumber, title, filePath, createdAt, durationSeconds];
}
