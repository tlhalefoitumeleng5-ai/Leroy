import 'dart:convert';
import 'dart:io';

import 'package:dartz/dartz.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:leroy_ai/core/errors/failures.dart';
import 'package:leroy_ai/features/video_studio/data/scripts/leroy_video_scripts.dart';
import 'package:leroy_ai/features/video_studio/data/services/video_render_engine.dart';
import 'package:leroy_ai/features/video_studio/domain/entities/generated_video_entity.dart';
import 'package:leroy_ai/features/video_studio/domain/repositories/video_studio_repository.dart';

class VideoStudioRepositoryImpl implements VideoStudioRepository {
  VideoStudioRepositoryImpl(this._engine, this._prefs);

  final VideoRenderEngine _engine;
  final SharedPreferences _prefs;

  static const _libraryKey = 'leroy_video_library_v1';

  @override
  List<VideoScript> get scripts => LeroyVideoScripts.all;

  @override
  Future<Either<Failure, List<GeneratedVideoEntity>>> loadLibrary() async {
    try {
      final raw = _prefs.getString(_libraryKey);
      if (raw == null || raw.isEmpty) return const Right([]);
      final list = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      final videos = <GeneratedVideoEntity>[];
      for (final m in list) {
        final path = m['filePath'] as String? ?? '';
        if (path.isEmpty || !await File(path).exists()) continue;
        videos.add(
          GeneratedVideoEntity(
            id: m['id'] as String,
            scriptNumber: m['scriptNumber'] as int,
            title: m['title'] as String,
            topic: m['topic'] as String,
            filePath: path,
            thumbnailPath: m['thumbnailPath'] as String?,
            createdAt: DateTime.parse(m['createdAt'] as String),
            durationSeconds: (m['durationSeconds'] as num).toDouble(),
          ),
        );
      }
      videos.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return Right(videos);
    } catch (e) {
      return Left(CacheFailure('Could not load video library: $e'));
    }
  }

  @override
  Future<Either<Failure, GeneratedVideoEntity>> renderVideo({
    required VideoScript script,
    required void Function(double progress, String stage) onProgress,
  }) async {
    try {
      final video = await _engine.renderScript(script, onProgress: onProgress);
      await _upsert(video);
      return Right(video);
    } catch (e) {
      return Left(UnexpectedFailure('Video render failed: $e'));
    }
  }

  @override
  Future<Either<Failure, List<GeneratedVideoEntity>>> renderAll({
    required void Function(
      int current,
      int total,
      double videoProgress,
      String stage,
    ) onProgress,
    required bool Function() isCancelled,
  }) async {
    try {
      final rendered = <GeneratedVideoEntity>[];
      final total = scripts.length;
      for (var i = 0; i < total; i++) {
        if (isCancelled()) break;
        final script = scripts[i];
        onProgress(i + 1, total, 0, 'Starting ${script.title}');
        final result = await renderVideo(
          script: script,
          onProgress: (p, stage) => onProgress(i + 1, total, p, stage),
        );
        result.fold((f) => throw Exception(f.message), rendered.add);
      }
      return Right(rendered);
    } catch (e) {
      return Left(UnexpectedFailure('Batch render failed: $e'));
    }
  }

  @override
  Future<Either<Failure, Unit>> deleteVideo(GeneratedVideoEntity video) async {
    try {
      final file = File(video.filePath);
      if (await file.exists()) await file.delete();
      if (video.thumbnailPath != null) {
        final thumb = File(video.thumbnailPath!);
        if (await thumb.exists()) await thumb.delete();
      }
      final current = await loadLibrary();
      await current.fold((f) async => throw Exception(f.message), (list) async {
        final next = list.where((v) => v.id != video.id).toList();
        await _save(next);
      });
      return const Right(unit);
    } catch (e) {
      return Left(UnexpectedFailure('Delete failed: $e'));
    }
  }

  Future<void> _upsert(GeneratedVideoEntity video) async {
    final current = await loadLibrary();
    final list = current.getOrElse(() => <GeneratedVideoEntity>[]);
    final next = [
      video,
      ...list.where((v) => v.scriptNumber != video.scriptNumber),
    ];
    await _save(next);
  }

  Future<void> _save(List<GeneratedVideoEntity> videos) async {
    final raw = jsonEncode(
      videos
          .map(
            (v) => {
              'id': v.id,
              'scriptNumber': v.scriptNumber,
              'title': v.title,
              'topic': v.topic,
              'filePath': v.filePath,
              'thumbnailPath': v.thumbnailPath,
              'createdAt': v.createdAt.toIso8601String(),
              'durationSeconds': v.durationSeconds,
            },
          )
          .toList(),
    );
    await _prefs.setString(_libraryKey, raw);
  }
}
