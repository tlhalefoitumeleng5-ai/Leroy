import 'dart:io';

import 'package:gal/gal.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';

/// Downloads remote media and saves it to the device gallery.
class MediaSaver {
  MediaSaver._();

  static Future<void> saveImageFromUrl(String url) async {
    try {
      final bytes = await _download(url);
      final dir = await getTemporaryDirectory();
      final file = File(
        '${dir.path}/leroy_${DateTime.now().millisecondsSinceEpoch}.png',
      );
      await file.writeAsBytes(bytes);
      await Gal.putImage(file.path);
      await file.delete();
    } catch (e) {
      throw ServerException('Could not save image: $e');
    }
  }

  static Future<void> saveVideoFromUrl(String url) async {
    try {
      final bytes = await _download(url);
      final dir = await getTemporaryDirectory();
      final file = File(
        '${dir.path}/leroy_${DateTime.now().millisecondsSinceEpoch}.mp4',
      );
      await file.writeAsBytes(bytes);
      await Gal.putVideo(file.path);
      await file.delete();
    } catch (e) {
      throw ServerException('Could not save video: $e');
    }
  }

  static Future<List<int>> _download(String url) async {
    final response = await http.get(Uri.parse(url));
    if (response.statusCode != 200) {
      throw ServerException('Download failed (${response.statusCode}).');
    }
    return response.bodyBytes;
  }
}
