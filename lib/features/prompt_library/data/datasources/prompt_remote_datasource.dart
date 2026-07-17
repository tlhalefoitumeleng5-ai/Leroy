import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/features/prompt_library/data/models/prompt_model.dart';

abstract class PromptRemoteDataSource {
  Future<List<PromptModel>> getPrompts({String? category, String? query});
  Future<PromptModel> toggleFavorite(String promptId);
  Future<List<String>> getCategories();
}

/// Firestore-backed prompt library. Favorites live under the signed-in user.
class FirestorePromptDataSource implements PromptRemoteDataSource {
  FirestorePromptDataSource({FirebaseFirestore? firestore, FirebaseAuth? auth})
      : _db = firestore ?? FirebaseFirestore.instance,
        _auth = auth ?? FirebaseAuth.instance;

  final FirebaseFirestore _db;
  final FirebaseAuth _auth;

  CollectionReference<Map<String, dynamic>> get _col =>
      _db.collection(AppConstants.promptsCollection);

  CollectionReference<Map<String, dynamic>>? get _favorites {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return null;
    return _db
        .collection(AppConstants.usersCollection)
        .doc(uid)
        .collection('favoritePrompts');
  }

  @override
  Future<List<PromptModel>> getPrompts({String? category, String? query}) async {
    try {
      Query<Map<String, dynamic>> q = _col;
      if (category != null && category != 'All') {
        q = q.where('category', isEqualTo: category);
      }
      final snap = await q.get();
      final favoriteIds = <String>{};
      final favCol = _favorites;
      if (favCol != null) {
        final favSnap = await favCol.get();
        favoriteIds.addAll(favSnap.docs.map((d) => d.id));
      }

      var list = snap.docs.map((d) {
        final data = d.data();
        return PromptModel.fromMap({
          ...data,
          'id': d.id,
          'isFavorite': favoriteIds.contains(d.id),
        });
      }).toList();

      if (query != null && query.trim().isNotEmpty) {
        final needle = query.toLowerCase();
        list = list
            .where((p) =>
                p.title.toLowerCase().contains(needle) ||
                p.content.toLowerCase().contains(needle) ||
                p.tags.any((t) => t.toLowerCase().contains(needle)))
            .toList();
      }
      return list;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<PromptModel> toggleFavorite(String promptId) async {
    try {
      final favCol = _favorites;
      if (favCol == null) {
        throw ServerException('Sign in required to favorite prompts.');
      }
      final doc = await _col.doc(promptId).get();
      if (!doc.exists) throw ServerException('Prompt not found');
      final data = doc.data()!;
      final favDoc = favCol.doc(promptId);
      final exists = (await favDoc.get()).exists;
      if (exists) {
        await favDoc.delete();
      } else {
        await favDoc.set({
          'promptId': promptId,
          'createdAt': DateTime.now().toIso8601String(),
        });
      }
      return PromptModel.fromMap({
        ...data,
        'id': promptId,
        'isFavorite': !exists,
      });
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(e.toString());
    }
  }

  @override
  Future<List<String>> getCategories() async {
    final prompts = await getPrompts();
    final cats = prompts.map((p) => p.category).toSet().toList()..sort();
    return ['All', ...cats];
  }
}
