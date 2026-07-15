import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/features/prompt_library/data/models/prompt_model.dart';

abstract class PromptRemoteDataSource {
  Future<List<PromptModel>> getPrompts({String? category, String? query});
  Future<PromptModel> toggleFavorite(String promptId);
  Future<List<String>> getCategories();
}

/// Firestore-backed prompt library. Seed documents in the `prompts` collection.
class FirestorePromptDataSource implements PromptRemoteDataSource {
  FirestorePromptDataSource({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  CollectionReference<Map<String, dynamic>> get _col =>
      _db.collection(AppConstants.promptsCollection);

  @override
  Future<List<PromptModel>> getPrompts({String? category, String? query}) async {
    try {
      Query<Map<String, dynamic>> q = _col;
      if (category != null && category != 'All') {
        q = q.where('category', isEqualTo: category);
      }
      final snap = await q.get();
      var list = snap.docs
          .map((d) => PromptModel.fromMap({...d.data(), 'id': d.id}))
          .toList();
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
      final doc = await _col.doc(promptId).get();
      if (!doc.exists) throw ServerException('Prompt not found');
      final data = doc.data()!;
      final current = data['isFavorite'] as bool? ?? false;
      await _col.doc(promptId).set({'isFavorite': !current}, SetOptions(merge: true));
      return PromptModel.fromMap({...data, 'id': promptId, 'isFavorite': !current});
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
