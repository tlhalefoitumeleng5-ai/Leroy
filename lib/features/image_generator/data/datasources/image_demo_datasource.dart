import 'package:uuid/uuid.dart';

import '../../domain/entities/generated_image.dart';

class ImageDemoDataSource {
  final _history = <GeneratedImage>[];
  final _uuid = const Uuid();

  /// Uses picsum seeded by prompt hash for demo visuals.
  Future<GeneratedImage> generate({
    required String prompt,
    required ImageStyle style,
    required ImageAspectRatio aspectRatio,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 1400));
    final seed = prompt.hashCode.abs() % 1000;
    final size = switch (aspectRatio) {
      ImageAspectRatio.square => '800/800',
      ImageAspectRatio.portrait => '768/1024',
      ImageAspectRatio.landscape => '1024/768',
    };
    final image = GeneratedImage(
      id: _uuid.v4(),
      prompt: prompt.trim(),
      imageUrl: 'https://picsum.photos/seed/leroy$seed/$size',
      createdAt: DateTime.now(),
      style: style,
      aspectRatio: aspectRatio,
    );
    _history.insert(0, image);
    return image;
  }

  Future<List<GeneratedImage>> getHistory() async => List.of(_history);

  Future<void> clearHistory() async => _history.clear();
}
