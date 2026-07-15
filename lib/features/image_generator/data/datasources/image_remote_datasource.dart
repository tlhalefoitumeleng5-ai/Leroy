import 'dart:convert';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:http/http.dart' as http;
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/core/services/ai_cloud_service.dart';
import 'package:leroy_ai/features/image_generator/data/models/generated_image_model.dart';
import 'package:uuid/uuid.dart';

abstract class ImageRemoteDataSource {
  Future<GeneratedImageModel> generate({
    required String userId,
    required String prompt,
    String style,
    String aspectRatio,
  });
  Future<List<GeneratedImageModel>> getHistory(String userId);
  Future<void> deleteImage(String userId, String imageId);
}

class FirestoreImageDataSource implements ImageRemoteDataSource {
  FirestoreImageDataSource({
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
      .collection(AppConstants.imagesCollection);

  @override
  Future<GeneratedImageModel> generate({
    required String userId,
    required String prompt,
    String style = 'cinematic',
    String aspectRatio = '1:1',
  }) async {
    try {
      final result = await _ai.generateImage(
        prompt: prompt,
        style: style,
        size: aspectRatio,
      );

      final remoteUrl = result['imageUrl'] as String?;
      var base64Data = result['imageBase64'] as String?;
      if (remoteUrl == null && base64Data == null) {
        throw ServerException(
          'Image generation failed. Deploy and configure ${AppConstants.fnImage}.',
        );
      }

      final id = _uuid.v4();
      final ref = _storage.ref('users/$userId/images/$id.png');
      late final String storageUrl;

      if (base64Data != null) {
        if (base64Data.contains(',')) {
          base64Data = base64Data.split(',').last;
        }
        final bytes = Uint8List.fromList(base64Decode(base64Data));
        await ref.putData(bytes, SettableMetadata(contentType: 'image/png'));
        storageUrl = await ref.getDownloadURL();
      } else {
        final response = await http.get(Uri.parse(remoteUrl!));
        if (response.statusCode != 200) {
          throw ServerException('Failed to download generated image.');
        }
        await ref.putData(
          response.bodyBytes,
          SettableMetadata(contentType: 'image/png'),
        );
        storageUrl = await ref.getDownloadURL();
      }

      final model = GeneratedImageModel(
        id: id,
        prompt: prompt,
        imageUrl: storageUrl,
        createdAt: DateTime.now(),
        style: style,
        aspectRatio: aspectRatio,
      );
      await _col(userId).doc(id).set(model.toMap());
      await _db.collection(AppConstants.usersCollection).doc(userId).set({
        'imagesGenerated': FieldValue.increment(1),
      }, SetOptions(merge: true));
      await _db.collection(AppConstants.historyCollection).add({
        'userId': userId,
        'type': 'image',
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
  Future<List<GeneratedImageModel>> getHistory(String userId) async {
    try {
      final snap =
          await _col(userId).orderBy('createdAt', descending: true).get();
      return snap.docs
          .map((d) => GeneratedImageModel.fromMap({...d.data(), 'id': d.id}))
          .toList();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<void> deleteImage(String userId, String imageId) async {
    try {
      await _col(userId).doc(imageId).delete();
      try {
        await _storage.ref('users/$userId/images/$imageId.png').delete();
      } catch (_) {}
    } catch (e) {
      throw ServerException(e.toString());
    }
  }
}
