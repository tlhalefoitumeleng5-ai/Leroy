import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import 'package:leroy_ai/features/video_studio/data/scripts/leroy_video_scripts.dart';
import 'package:leroy_ai/features/video_studio/data/services/audio_bed_service.dart';
import 'package:leroy_ai/features/video_studio/data/services/ffmpeg_service.dart';
import 'package:leroy_ai/features/video_studio/data/services/scene_frame_renderer.dart';
import 'package:leroy_ai/features/video_studio/data/services/voice_over_service.dart';
import 'package:leroy_ai/features/video_studio/domain/entities/generated_video_entity.dart';

typedef RenderProgress = void Function(double progress, String stage);

/// Full pipeline: scenes + AI voice + music + SFX + captions → HD MP4.
class VideoRenderEngine {
  VideoRenderEngine({
    FfmpegService? ffmpeg,
    VoiceOverService? voice,
    AudioBedService? audio,
    SceneFrameRenderer? scenes,
  })  : _ffmpeg = ffmpeg ?? FfmpegService(),
        _voice = voice ?? VoiceOverService(),
        _audio = audio ?? AudioBedService(),
        _scenes = scenes ?? SceneFrameRenderer();

  final FfmpegService _ffmpeg;
  final VoiceOverService _voice;
  final AudioBedService _audio;
  final SceneFrameRenderer _scenes;
  final _uuid = const Uuid();

  Future<Directory> videosDirectory() async {
    final root = await getApplicationDocumentsDirectory();
    final dir = Directory(p.join(root.path, 'leroy_videos'));
    if (!await dir.exists()) await dir.create(recursive: true);
    return dir;
  }

  Future<GeneratedVideoEntity> renderScript(
    VideoScript script, {
    RenderProgress? onProgress,
    Directory? outputDirectory,
  }) async {
    void progress(double v, String stage) => onProgress?.call(v.clamp(0, 1), stage);

    progress(0.02, 'Preparing workspace');
    final videosDir = outputDirectory ?? await videosDirectory();
    if (!await videosDir.exists()) await videosDir.create(recursive: true);
    final work = Directory(
      p.join(
        Directory.systemTemp.path,
        'leroy_render_${script.number}_${DateTime.now().millisecondsSinceEpoch}',
      ),
    );
    await work.create(recursive: true);

    try {
      progress(0.08, 'Rendering animated scenes');
      final sceneFiles = await _scenes.renderScenes(
        workDir: work.path,
        title: script.title,
        topic: script.topic,
        scenes: script.scenes,
        seed: script.number * 97,
      );

      progress(0.28, 'Generating AI voice-over');
      final voice = await _voice.synthesize(
        text: script.voiceOver,
        workDir: work.path,
      );

      progress(0.42, 'Measuring narration length');
      var duration = await _ffmpeg.probeDurationSeconds(voice.path);
      if (duration < 25) duration = 35;
      if (duration > 60) duration = 60;

      progress(0.48, 'Composing background music');
      final music = await _audio.createMusic(
        path: p.join(work.path, 'music.wav'),
        durationSeconds: duration + 1.5,
        mood: script.musicMood,
      );

      progress(0.55, 'Creating transition sound effects');
      final whoosh = await _audio.createWhooshSfx(p.join(work.path, 'whoosh.wav'));

      progress(0.60, 'Building caption track');
      final ass = await _writeAssCaptions(
        path: p.join(work.path, 'captions.ass'),
        scenes: script.scenes,
        duration: duration,
      );

      progress(0.66, 'Encoding HD video timeline');
      final silentVideo = p.join(work.path, 'video_silent.mp4');
      await _encodeTimeline(
        scenes: sceneFiles,
        duration: duration,
        output: silentVideo,
      );

      progress(0.82, 'Mixing voice, music, and effects');
      final outputPath = p.join(videosDir.path, '${script.fileStem}.mp4');
      await _muxFinal(
        videoPath: silentVideo,
        voicePath: voice.path,
        musicPath: music.path,
        whooshPath: whoosh.path,
        assPath: ass.path,
        outputPath: outputPath,
        duration: duration,
      );

      progress(0.93, 'Creating thumbnail');
      final thumbPath = p.join(videosDir.path, '${script.fileStem}.jpg');
      await _ffmpeg.execute([
        '-y',
        '-i',
        outputPath,
        '-ss',
        '00:00:01.000',
        '-vframes',
        '1',
        '-q:v',
        '3',
        thumbPath,
      ]);

      progress(1.0, 'Complete');
      return GeneratedVideoEntity(
        id: _uuid.v4(),
        scriptNumber: script.number,
        title: script.title,
        topic: script.topic,
        filePath: outputPath,
        thumbnailPath: await File(thumbPath).exists() ? thumbPath : null,
        createdAt: DateTime.now(),
        durationSeconds: duration,
      );
    } finally {
      try {
        if (await work.exists()) await work.delete(recursive: true);
      } catch (_) {}
    }
  }

  Future<void> _encodeTimeline({
    required List<File> scenes,
    required double duration,
    required String output,
  }) async {
    final per = duration / scenes.length;
    final args = <String>['-y'];
    for (final s in scenes) {
      args.addAll(['-loop', '1', '-t', per.toStringAsFixed(3), '-i', s.path]);
    }

    // zoompan animation + crossfade chain
    final filters = StringBuffer();
    for (var i = 0; i < scenes.length; i++) {
      filters.write(
        '[$i:v]scale=1080:1920:force_original_aspect_ratio=increase,'
        'crop=1080:1920,zoompan=z=\'min(1.08,1+0.0008*on)\':x=\'iw/2-(iw/zoom/2)\':'
        'y=\'ih/2-(ih/zoom/2)\':d=${(per * 30).round()}:s=1080x1920:fps=30,'
        'format=yuv420p[v$i];',
      );
    }

    if (scenes.length == 1) {
      filters.write('[v0]format=yuv420p[vout]');
    } else {
      var prev = 'v0';
      var acc = per;
      for (var i = 1; i < scenes.length; i++) {
        final out = i == scenes.length - 1 ? 'vout' : 'x$i';
        final offset = (acc - 0.45).clamp(0.1, duration);
        filters.write(
          '[$prev][v$i]xfade=transition=fade:duration=0.45:offset=${offset.toStringAsFixed(3)}[$out];',
        );
        prev = out;
        acc += per - 0.45;
      }
    }

    args.addAll([
      '-filter_complex',
      filters.toString().replaceAll(RegExp(r';$'), ''),
      '-map',
      '[vout]',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-preset',
      'veryfast',
      '-crf',
      '20',
      '-r',
      '30',
      '-movflags',
      '+faststart',
      '-t',
      duration.toStringAsFixed(3),
      output,
    ]);

    await _ffmpeg.execute(args);
  }

  Future<void> _muxFinal({
    required String videoPath,
    required String voicePath,
    required String musicPath,
    required String whooshPath,
    required String assPath,
    required String outputPath,
    required double duration,
  }) async {
    // Escape ASS path for ffmpeg subtitles filter (Windows/Linux).
    final assEscaped = assPath
        .replaceAll('\\', '/')
        .replaceAll(':', '\\:')
        .replaceAll("'", "\\'");

    await _ffmpeg.execute([
      '-y',
      '-i',
      videoPath,
      '-i',
      voicePath,
      '-i',
      musicPath,
      '-i',
      whooshPath,
      '-filter_complex',
      '[1:a]volume=1.0[voice];'
          '[2:a]volume=0.22[music];'
          '[3:a]volume=0.35,adelay=800|800[sfx];'
          '[voice][music][sfx]amix=inputs=3:duration=longest:dropout_transition=2[aout];'
          '[0:v]subtitles=$assEscaped[vout]',
      '-map',
      '[vout]',
      '-map',
      '[aout]',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-preset',
      'veryfast',
      '-crf',
      '18',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-shortest',
      '-t',
      duration.toStringAsFixed(3),
      '-movflags',
      '+faststart',
      outputPath,
    ]);
  }

  Future<File> _writeAssCaptions({
    required String path,
    required List<String> scenes,
    required double duration,
  }) async {
    final per = duration / scenes.length;
    final buf = StringBuffer()
      ..writeln('[Script Info]')
      ..writeln('ScriptType: v4.00+')
      ..writeln('PlayResX: 1080')
      ..writeln('PlayResY: 1920')
      ..writeln('')
      ..writeln('[V4+ Styles]')
      ..writeln(
        'Style: Default,Arial,54,&H00FFFFFF,&H000000FF,&H64000000,&H00000000,'
        '1,0,0,0,100,100,0,0,3,2,1,2,80,80,220,1',
      )
      ..writeln('')
      ..writeln('[Events]')
      ..writeln(
        'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
      );

    for (var i = 0; i < scenes.length; i++) {
      final start = i * per;
      final end = (i + 1) * per;
      final text = scenes[i]
          .replaceAll('\\', '\\\\')
          .replaceAll('{', '(')
          .replaceAll('}', ')')
          .replaceAll('\n', '\\N');
      buf.writeln(
        'Dialogue: 0,${_ts(start)},${_ts(end)},Default,,0,0,0,,$text',
      );
    }

    final file = File(path);
    await file.writeAsString(buf.toString());
    return file;
  }

  String _ts(double seconds) {
    final msTotal = (seconds * 100).round();
    final cs = msTotal % 100;
    final totalSec = msTotal ~/ 100;
    final s = totalSec % 60;
    final m = (totalSec ~/ 60) % 60;
    final h = totalSec ~/ 3600;
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(h)}:${two(m)}:${two(s)}.${two(cs)}';
  }
}
