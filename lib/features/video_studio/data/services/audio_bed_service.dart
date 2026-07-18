import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

/// Generates procedural background music and transition SFX as WAV files.
class AudioBedService {
  Future<File> createMusic({
    required String path,
    required double durationSeconds,
    required String mood,
  }) async {
    final sampleRate = 44100;
    final total = (durationSeconds * sampleRate).round();
    final data = Float64List(total);
    final rng = Random(mood.hashCode);

    final baseFreq = switch (mood) {
      'inspiring' => 196.0,
      'educational' => 220.0,
      'story' => 174.0,
      'urgent' => 246.0,
      _ => 196.0,
    };
    final bpm = switch (mood) {
      'urgent' => 118.0,
      'energy' => 110.0,
      'educational' => 92.0,
      'story' => 78.0,
      _ => 100.0,
    };
    final beat = 60.0 / bpm;

    for (var i = 0; i < total; i++) {
      final t = i / sampleRate;
      final envelope = _masterEnvelope(t, durationSeconds);
      final pad = 0.18 *
          sin(2 * pi * baseFreq * t) *
          (0.6 + 0.4 * sin(2 * pi * 0.12 * t));
      final fifth = 0.10 * sin(2 * pi * baseFreq * 1.5 * t);
      final octave = 0.07 * sin(2 * pi * baseFreq * 2 * t + 0.2);
      final beatPhase = (t % beat) / beat;
      final kick = beatPhase < 0.08 ? (1 - beatPhase / 0.08) * 0.22 : 0.0;
      final hat = (beatPhase > 0.48 && beatPhase < 0.55)
          ? 0.05 * rng.nextDouble()
          : 0.0;
      data[i] = (pad + fifth + octave + kick * sin(2 * pi * 55 * t) + hat) *
          envelope;
    }

    return _writeWav(path, data, sampleRate);
  }

  Future<File> createWhooshSfx(String path) async {
    final sampleRate = 44100;
    final total = (0.45 * sampleRate).round();
    final data = Float64List(total);
    for (var i = 0; i < total; i++) {
      final t = i / sampleRate;
      final env = sin(pi * (i / total));
      final freq = 400 + 1600 * (i / total);
      data[i] = 0.25 * env * sin(2 * pi * freq * t);
    }
    return _writeWav(path, data, sampleRate);
  }

  double _masterEnvelope(double t, double duration) {
    const attack = 0.8;
    const release = 1.2;
    if (t < attack) return t / attack;
    if (t > duration - release) {
      return max(0, (duration - t) / release);
    }
    return 1;
  }

  Future<File> _writeWav(
    String path,
    Float64List samples,
    int sampleRate,
  ) async {
    final bytes = ByteData(44 + samples.length * 2);
    void writeString(int offset, String s) {
      for (var i = 0; i < s.length; i++) {
        bytes.setUint8(offset + i, s.codeUnitAt(i));
      }
    }

    writeString(0, 'RIFF');
    bytes.setUint32(4, 36 + samples.length * 2, Endian.little);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    bytes.setUint32(16, 16, Endian.little);
    bytes.setUint16(20, 1, Endian.little);
    bytes.setUint16(22, 1, Endian.little);
    bytes.setUint32(24, sampleRate, Endian.little);
    bytes.setUint32(28, sampleRate * 2, Endian.little);
    bytes.setUint16(32, 2, Endian.little);
    bytes.setUint16(34, 16, Endian.little);
    writeString(36, 'data');
    bytes.setUint32(40, samples.length * 2, Endian.little);

    var offset = 44;
    for (final s in samples) {
      final clipped = s.clamp(-1.0, 1.0);
      bytes.setInt16(offset, (clipped * 32767).round(), Endian.little);
      offset += 2;
    }

    final file = File(path);
    await file.writeAsBytes(bytes.buffer.asUint8List());
    return file;
  }
}
