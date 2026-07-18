import 'dart:io';

import 'package:ffmpeg_kit_flutter_new/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_new/return_code.dart';

/// Runs FFmpeg commands via system binary (Linux/desktop) or FFmpegKit (mobile).
class FfmpegService {
  Future<void> execute(List<String> args) async {
    if (Platform.isLinux) {
      final result = await Process.run('ffmpeg', args, runInShell: false);
      if (result.exitCode != 0) {
        final err = (result.stderr as String).trim();
        throw Exception(
          'FFmpeg failed (${result.exitCode}): ${err.isEmpty ? result.stdout : err}',
        );
      }
      return;
    }

    final command = args
        .map((a) {
          if (a.contains(' ') && !a.startsWith('"')) {
            return '"$a"';
          }
          return a;
        })
        .join(' ');
    final session = await FFmpegKit.execute(command);
    final code = await session.getReturnCode();
    if (!ReturnCode.isSuccess(code)) {
      final logs = await session.getAllLogsAsString();
      throw Exception('FFmpegKit failed: $logs');
    }
  }

  Future<double> probeDurationSeconds(String path) async {
    try {
      if (Platform.isLinux) {
        final result = await Process.run('ffprobe', [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          path,
        ]);
        if (result.exitCode == 0) {
          return double.tryParse((result.stdout as String).trim()) ?? 40;
        }
      }
    } catch (_) {}
    return 40;
  }
}
