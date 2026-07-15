import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/features/prompt_library/domain/entities/prompt_entity.dart';

/// Loads templates from Firestore. Seed via Admin / console — never hardcode fake content in UI.
class TemplatesDataSource {
  TemplatesDataSource({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  Future<List<PromptEntity>> getTemplates({String? category, String? query}) async {
    try {
      Query<Map<String, dynamic>> q =
          _db.collection(AppConstants.templatesCollection);
      if (category != null && category != 'All') {
        q = q.where('category', isEqualTo: category);
      }
      final snap = await q.get();
      var items = snap.docs.map((d) {
        final data = d.data();
        return PromptEntity(
          id: d.id,
          title: data['title'] as String? ?? '',
          content: data['content'] as String? ?? '',
          category: data['category'] as String? ?? 'General',
          isFavorite: data['isFavorite'] as bool? ?? false,
          tags: (data['tags'] as List<dynamic>?)?.cast<String>() ?? const [],
        );
      }).toList();
      if (query != null && query.trim().isNotEmpty) {
        final needle = query.toLowerCase();
        items = items
            .where((p) =>
                p.title.toLowerCase().contains(needle) ||
                p.content.toLowerCase().contains(needle))
            .toList();
      }
      return items;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  Future<List<String>> getCategories() async {
    final templates = await getTemplates();
    final cats = templates.map((t) => t.category).toSet().toList()..sort();
    return ['All', ...cats];
  }
}
