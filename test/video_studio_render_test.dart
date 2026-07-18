import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:leroy_ai/features/video_studio/data/scripts/leroy_video_scripts.dart';
import 'package:leroy_ai/features/video_studio/data/services/video_render_engine.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('catalog contains 50 scripts with CTA', () {
    expect(LeroyVideoScripts.all.length, 50);
    for (final s in LeroyVideoScripts.all) {
      expect(s.voiceOver.contains(LeroyVideoScripts.universalCta), isTrue);
      expect(s.scenes, isNotEmpty);
      expect(s.hook, isNotEmpty);
    }
  });

  test('render engine produces playable HD MP4 for script 1', () async {
    final outDir = Directory.systemTemp.createTempSync('leroy_video_out_');
    addTearDown(() {
      if (outDir.existsSync()) outDir.deleteSync(recursive: true);
    });

    final engine = VideoRenderEngine();
    final script = LeroyVideoScripts.byNumber(1);
    final stages = <String>[];

    final video = await engine.renderScript(
      script,
      outputDirectory: outDir,
      onProgress: (p, stage) => stages.add('$p:$stage'),
    );

    final file = File(video.filePath);
    expect(await file.exists(), isTrue);
    expect(await file.length(), greaterThan(50 * 1024));
    expect(video.durationSeconds, greaterThan(20));
    expect(stages, isNotEmpty);

    // Validate with ffprobe when available.
    final probe = await Process.run('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,codec_name',
      '-of',
      'csv=p=0',
      video.filePath,
    ]);
    expect(probe.exitCode, 0);
    final meta = (probe.stdout as String).trim();
    expect(meta.contains('1080'), isTrue);
    expect(meta.contains('1920'), isTrue);
    expect(meta.contains('h264'), isTrue);
  }, timeout: const Timeout(Duration(minutes: 6)));
}
