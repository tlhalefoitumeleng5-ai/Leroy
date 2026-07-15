import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
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
}

class FirestoreImageDataSource implements ImageRemoteDataSource {
  FirestoreImageDataSource({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;
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
      // Placeholder image URL — wire to Imagen / DALL·E / Stability in production.
      final seed = prompt.hashCode.abs() % 1000;
      final model = GeneratedImageModel(
        id: _uuid.v4(),
        prompt: prompt,
        imageUrl: 'https://picsum.photos/seed/$seed/768/768',
        createdAt: DateTime.now(),
        style: style,
        aspectRatio: aspectRatio,
      );
      await _col(userId).doc(model.id).set(model.toMap());
      return model;
    } catch (e) {
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
}

class DemoImageDataSource implements ImageRemoteDataSource {
  final _uuid = const Uuid();
  final List<GeneratedImageModel> _history = [];

  @override
  Future<GeneratedImageModel> generate({
    required String userId,
    required String prompt,
    String style = 'cinematic',
    String aspectRatio = '1:1',
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 1400));
    final seed = prompt.hashCode.abs() % 1000;
    final model = GeneratedImageModel(
      id: _uuid.v4(),
      prompt: prompt,
      imageUrl: 'https://picsum.photos/seed/leroy$seed/768/768',
      createdAt: DateTime.now(),
      style: style,
      aspectRatio: aspectRatio,
    );
    _history.insert(0, model);
    return model;
  }

  @override
  Future<List<GeneratedImageModel>> getHistory(String userId) async =>
      List.of(_history);
}
