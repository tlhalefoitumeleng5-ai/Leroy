import 'dart:io';
import 'dart:math' as math;

import 'package:image/image.dart' as img;
import 'package:path/path.dart' as p;

/// Renders branded HD scene stills used by the video timeline.
class SceneFrameRenderer {
  static const width = 1080;
  static const height = 1920;

  Future<List<File>> renderScenes({
    required String workDir,
    required String title,
    required String topic,
    required List<String> scenes,
    required int seed,
  }) async {
    final files = <File>[];
    for (var i = 0; i < scenes.length; i++) {
      final frame = _paintScene(
        title: title,
        topic: topic,
        caption: scenes[i],
        index: i,
        total: scenes.length,
        seed: seed + i * 17,
        isHook: i == 0,
        isCta: i == scenes.length - 1,
      );
      final path = p.join(workDir, 'scene_${i.toString().padLeft(2, '0')}.png');
      final file = File(path);
      await file.writeAsBytes(img.encodePng(frame));
      files.add(file);
    }
    return files;
  }

  img.Image _paintScene({
    required String title,
    required String topic,
    required String caption,
    required int index,
    required int total,
    required int seed,
    required bool isHook,
    required bool isCta,
  }) {
    final image = img.Image(width: width, height: height);
    final rng = math.Random(seed);

    // Brand gradient background (teal family — avoid purple AI cliché).
    for (var y = 0; y < height; y++) {
      final t = y / (height - 1);
      final r = (13 + (45 - 13) * t).round();
      final g = (116 + (180 - 116) * t + (isCta ? 20 : 0)).round().clamp(0, 255);
      final b = (110 + (150 - 110) * t).round();
      for (var x = 0; x < width; x++) {
        final wave = (12 * math.sin((x + index * 40) / 90 + t * 6)).round();
        image.setPixelRgba(
          x,
          y,
          (r + wave).clamp(0, 255),
          (g + wave ~/ 2).clamp(0, 255),
          (b - wave ~/ 3).clamp(0, 255),
          255,
        );
      }
    }

    // Soft light orbs
    for (var o = 0; o < 4; o++) {
      final cx = rng.nextInt(width);
      final cy = rng.nextInt(height ~/ 2) + (o * 120);
      final radius = 120 + rng.nextInt(100);
      _softCircle(image, cx, cy, radius, 255, 230, 190, 28);
    }

    // Top brand chip
    _fillRoundRect(image, 60, 70, 320, 64, 32, 255, 255, 255, 40);
    _drawTextCentered(
      image,
      text: 'LEROY AI SOLUTIONS',
      y: 88,
      color: img.ColorRgba8(255, 255, 255, 255),
      scale: 2,
    );

    // Topic badge
    _fillRoundRect(image, 60, 160, math.min(width - 120, 520), 54, 24, 232, 93, 76, 220);
    _drawText(
      image,
      text: topic.toUpperCase(),
      x: 84,
      y: 176,
      color: img.ColorRgba8(255, 255, 255, 255),
      scale: 2,
    );

    // Main caption block
    final lines = _wrap(caption, 28);
    final startY = isHook ? 520 : 640;
    var y = startY;
    for (final line in lines.take(8)) {
      _drawTextCentered(
        image,
        text: line,
        y: y,
        color: img.ColorRgba8(255, 255, 255, 255),
        scale: isHook ? 4 : 3,
      );
      y += isHook ? 64 : 52;
    }

    // Bottom title / progress
    _fillRoundRect(image, 60, height - 280, width - 120, 160, 28, 0, 0, 0, 70);
    _drawText(
      image,
      text: title.length > 42 ? '${title.substring(0, 42)}…' : title,
      x: 90,
      y: height - 240,
      color: img.ColorRgba8(255, 255, 255, 255),
      scale: 2,
    );
    _drawText(
      image,
      text: 'Scene ${index + 1}/$total  •  HD 1080p',
      x: 90,
      y: height - 180,
      color: img.ColorRgba8(200, 240, 235, 255),
      scale: 2,
    );

    if (isCta) {
      _fillRoundRect(
        image,
        120,
        height ~/ 2 - 40,
        width - 240,
        100,
        40,
        245,
        158,
        11,
        240,
      );
      _drawTextCentered(
        image,
        text: 'CONTACT LEROY AI TODAY',
        y: height ~/ 2 - 8,
        color: img.ColorRgba8(20, 30, 40, 255),
        scale: 3,
      );
    }

    return image;
  }

  void _softCircle(
    img.Image image,
    int cx,
    int cy,
    int radius,
    int r,
    int g,
    int b,
    int a,
  ) {
    for (var y = cy - radius; y < cy + radius; y += 2) {
      for (var x = cx - radius; x < cx + radius; x += 2) {
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        final d = math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
        if (d > radius) continue;
        final alpha = (a * (1 - d / radius)).round();
        final p = image.getPixel(x, y);
        image.setPixelRgba(
          x,
          y,
          _blend(p.r.toInt(), r, alpha),
          _blend(p.g.toInt(), g, alpha),
          _blend(p.b.toInt(), b, alpha),
          255,
        );
      }
    }
  }

  int _blend(int base, int add, int alpha) {
    return ((base * (255 - alpha) + add * alpha) / 255).round().clamp(0, 255);
  }

  void _fillRoundRect(
    img.Image image,
    int x,
    int y,
    int w,
    int h,
    int radius,
    int r,
    int g,
    int b,
    int a,
  ) {
    for (var py = y; py < y + h; py++) {
      for (var px = x; px < x + w; px++) {
        if (px < 0 || py < 0 || px >= width || py >= height) continue;
        final dx = px < x + radius
            ? (x + radius - px)
            : (px > x + w - radius ? px - (x + w - radius) : 0);
        final dy = py < y + radius
            ? (y + radius - py)
            : (py > y + h - radius ? py - (y + h - radius) : 0);
        if (dx * dx + dy * dy > radius * radius && (dx != 0 && dy != 0)) {
          continue;
        }
        final p = image.getPixel(px, py);
        image.setPixelRgba(
          px,
          py,
          _blend(p.r.toInt(), r, a),
          _blend(p.g.toInt(), g, a),
          _blend(p.b.toInt(), b, a),
          255,
        );
      }
    }
  }

  void _drawTextCentered(
    img.Image image, {
    required String text,
    required int y,
    required img.Color color,
    int scale = 2,
  }) {
    final w = _textWidth(text, scale);
    _drawText(
      image,
      text: text,
      x: (width - w) ~/ 2,
      y: y,
      color: color,
      scale: scale,
    );
  }

  void _drawText(
    img.Image image, {
    required String text,
    required int x,
    required int y,
    required img.Color color,
    int scale = 2,
  }) {
    img.drawString(
      image,
      text,
      font: scale >= 3 ? img.arial48 : img.arial24,
      x: x,
      y: y,
      color: color,
    );
  }

  int _textWidth(String text, int scale) {
    // arial24 ~14px average advance; arial48 ~28px
    final avg = scale >= 3 ? 26 : 13;
    return text.length * avg;
  }

  List<String> _wrap(String text, int maxChars) {
    final words = text.split(' ');
    final lines = <String>[];
    final buf = StringBuffer();
    for (final w in words) {
      if (buf.length + w.length + 1 > maxChars) {
        lines.add(buf.toString().trim());
        buf.clear();
      }
      buf.write('$w ');
    }
    if (buf.isNotEmpty) lines.add(buf.toString().trim());
    return lines;
  }
}
