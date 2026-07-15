import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:http/http.dart' as http;
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/core/services/ai_cloud_service.dart';
import 'package:leroy_ai/features/video_generator/data/models/generated_video_model.dart';
import 'package:uuid/uuid.dart';

abstract class VideoRemoteDataSource {
  Future<GeneratedVideoModel> generate({
    required String userId,
    required String prompt,
    required int durationSeconds,
    required String quality,
    required bool voiceEnabled,
    required bool musicEnabled,
  });
  Future<List<GeneratedVideoModel>> getHistory(String userId);
  Future<void> deleteVideo(String userId, String videoId);
}

class FirestoreVideoDataSource implements VideoRemoteDataSource {
  FirestoreVideoDataSource({
    FirebaseFirestore? firestore,
    FirebaseStorage? storage,
    AiCloudService? ai,
  })  : _db = firestore ?? FirebaseFirestore.instance,
        _storage = storage ?? FirebaseStorage.instance,
        _ai = ai ?? AiCloudService();

  final FirebaseFirestore _db;
  final FirebaseStorage _storage;
  final AiCloudService _ai;
  final _uuid = const Uuid();

  CollectionReference<Map<String, dynamic>> _col(String userId) => _db
      .collection(AppConstants.usersCollection)
      .doc(userId)
      .collection(AppConstants.videosCollection);

  @override
  Future<GeneratedVideoModel> generate({
    required String userId,
    required String prompt,
    required int durationSeconds,
    required String quality,
    required bool voiceEnabled,
    required bool musicEnabled,
  }) async {
    try {
      final result = await _ai.generateVideo(
        prompt: prompt,
        durationSeconds: durationSeconds,
        quality: quality,
        voiceEnabled: voiceEnabled,
        musicEnabled: musicEnabled,
      );
      final remoteUrl = result['videoUrl'] as String?;
      if (remoteUrl == null || remoteUrl.isEmpty) {
        throw ServerException(
          'Video generation failed. Deploy and configure ${AppConstants.fnVideo}.',
        );
      }

      final id = _uuid.v4();
      final response = await http.get(Uri.parse(remoteUrl));
      if (response.statusCode != 200) {
        throw ServerException('Failed to download generated video.');
      }
      final ref = _storage.ref('users/$userId/videos/$id.mp4');
      await ref.putData(
        response.bodyBytes,
        SettableMetadata(contentType: 'video/mp4'),
      );
      final storageUrl = await ref.getDownloadURL();

      final model = GeneratedVideoModel(
        id: id,
        prompt: prompt,
        videoUrl: storageUrl,
        createdAt: DateTime.now(),
        durationSeconds: durationSeconds,
        quality: quality,
        voiceEnabled: voiceEnabled,
        musicEnabled: musicEnabled,
        thumbnailUrl: result['thumbnailUrl'] as String?,
      );
      await _col(userId).doc(id).set(model.toMap());
      await _db.collection(AppConstants.usersCollection).doc(userId).set({
        'videosGenerated': FieldValue.increment(1),
      }, SetOptions(merge: true));
      await _db.collection(AppConstants.historyCollection).add({
        'userId': userId,
        'type': 'video',
        'title': prompt.length > 60 ? '${prompt.substring(0, 60)}…' : prompt,
        'refId': id,
        'url': storageUrl,
        'createdAt': DateTime.now().toIso8601String(),
      });
      return model;
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(e.toString());
    }
  }

  @override
  Future<List<GeneratedVideoModel>> getHistory(String userId) async {
    try {
      final snap =
          await _col(userId).orderBy('createdAt', descending: true).get();
      return snap.docs
          .map((d) => GeneratedVideoModel.fromMap({...d.data(), 'id': d.id}))
          .toList();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<void> deleteVideo(String userId, String videoId) async {
    try {
      await _col(userId).doc(videoId).delete();
      try {
        await _storage.ref('users/$userId/videos/$videoId.mp4').delete();
      } catch (_) {}
    } catch (e) {
      throw ServerException(e.toString());
    }
  }
}
