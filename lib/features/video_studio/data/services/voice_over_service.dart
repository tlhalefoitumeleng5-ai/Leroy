import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter_tts/flutter_tts.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;

/// Synthesizes AI voice-over audio for a script.
///
/// Order: device TTS → Google Translate TTS → espeak → rhythmic fallback.
class VoiceOverService {
  final FlutterTts _tts = FlutterTts();

  Future<File> synthesize({
    required String text,
    required String workDir,
  }) async {
    final outPath = p.join(workDir, 'voice.wav');
    final clean = text.replaceAll(RegExp(r'\s+'), ' ').trim();

    final fromDevice = await _tryDeviceTts(clean, outPath);
    if (fromDevice != null) return fromDevice;

    final fromWeb = await _tryGoogleTts(clean, workDir);
    if (fromWeb != null) return fromWeb;

    final fromEspeak = await _tryEspeak(clean, outPath);
    if (fromEspeak != null) return fromEspeak;

    return _fallbackToneVoice(clean, outPath);
  }

  Future<File?> _tryDeviceTts(String text, String outPath) async {
    try {
      await _tts.setLanguage('en-US');
      await _tts.setSpeechRate(0.48);
      await _tts.setPitch(1.05);
      final result = await _tts.synthesizeToFile(text, outPath);
      final file = File(outPath);
      if (result == 1 && await file.exists() && await file.length() > 1000) {
        return file;
      }
    } catch (_) {}
    return null;
  }

  Future<File?> _tryGoogleTts(String text, String workDir) async {
    try {
      final chunks = _chunk(text, 180);
      final parts = <String>[];
      for (var i = 0; i < chunks.length; i++) {
        final uri = Uri.https('translate.google.com', '/translate_tts', {
          'ie': 'UTF-8',
          'client': 'tw-ob',
          'tl': 'en',
          'q': chunks[i],
        });
        final res = await http.get(
          uri,
          headers: {'User-Agent': 'Mozilla/5.0 (compatible; LeroyAI/1.0)'},
        ).timeout(const Duration(seconds: 20));
        if (res.statusCode != 200 || res.bodyBytes.length < 200) {
          return null;
        }
        final part = p.join(workDir, 'tts_$i.mp3');
        await File(part).writeAsBytes(res.bodyBytes);
        parts.add(part);
      }
      if (parts.isEmpty) return null;

      if (parts.length == 1) return File(parts.first);

      final listFile = File(p.join(workDir, 'tts_list.txt'));
      await listFile.writeAsString(
        parts.map((e) => "file '${e.replaceAll("'", "'\\''")}'").join('\n'),
      );
      final merged = p.join(workDir, 'voice.mp3');
      final result = await Process.run('ffmpeg', [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        listFile.path,
        '-c',
        'copy',
        merged,
      ]);
      if (result.exitCode == 0 && await File(merged).exists()) {
        return File(merged);
      }
      return File(parts.first);
    } catch (_) {}
    return null;
  }

  Future<File?> _tryEspeak(String text, String outPath) async {
    try {
      final which = await Process.run('which', ['espeak']);
      if (which.exitCode != 0) return null;
      final result = await Process.run('espeak', [
        '-w',
        outPath,
        '-s',
        '150',
        '-v',
        'en+f3',
        text,
      ]);
      final file = File(outPath);
      if (result.exitCode == 0 && await file.exists()) return file;
    } catch (_) {}
    return null;
  }

  Future<File> _fallbackToneVoice(String text, String outPath) async {
    final seconds = (text.split(' ').length / 2.4).clamp(18.0, 55.0);
    const sampleRate = 22050;
    final total = (seconds * sampleRate).round();
    final pcm = ByteData(total * 2);
    for (var i = 0; i < total; i++) {
      final t = i / sampleRate;
      final wordPulse = ((t * 2.4) % 1.0) < 0.35 ? 0.14 : 0.02;
      final sample = wordPulse * math.sin(2 * math.pi * 180 * t);
      pcm.setInt16(i * 2, (sample * 32767).round(), Endian.little);
    }

    final header = ByteData(44);
    void writeString(int offset, String value) {
      for (var i = 0; i < value.length; i++) {
        header.setUint8(offset + i, value.codeUnitAt(i));
      }
    }

    writeString(0, 'RIFF');
    header.setUint32(4, 36 + total * 2, Endian.little);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    header.setUint32(16, 16, Endian.little);
    header.setUint16(20, 1, Endian.little);
    header.setUint16(22, 1, Endian.little);
    header.setUint32(24, sampleRate, Endian.little);
    header.setUint32(28, sampleRate * 2, Endian.little);
    header.setUint16(32, 2, Endian.little);
    header.setUint16(34, 16, Endian.little);
    writeString(36, 'data');
    header.setUint32(40, total * 2, Endian.little);

    final out = BytesBuilder()
      ..add(header.buffer.asUint8List())
      ..add(pcm.buffer.asUint8List());
    final file = File(outPath);
    await file.writeAsBytes(out.toBytes());
    return file;
  }

  List<String> _chunk(String text, int maxLen) {
    final words = text.split(' ');
    final chunks = <String>[];
    final buf = StringBuffer();
    for (final w in words) {
      if (buf.length + w.length + 1 > maxLen) {
        chunks.add(buf.toString().trim());
        buf.clear();
      }
      buf.write('$w ');
    }
    if (buf.isNotEmpty) chunks.add(buf.toString().trim());
    return chunks.where((c) => c.isNotEmpty).toList();
  }
}
