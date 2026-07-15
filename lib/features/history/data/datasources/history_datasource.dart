import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/features/history/domain/entities/history_item.dart';

class HistoryDataSource {
  HistoryDataSource({FirebaseFirestore? firestore})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  Future<List<HistoryItem>> getHistory(String userId, {String? query}) async {
    try {
      final snap = await _db
          .collection(AppConstants.historyCollection)
          .where('userId', isEqualTo: userId)
          .orderBy('createdAt', descending: true)
          .limit(100)
          .get();
      var items = snap.docs.map((d) {
        final data = d.data();
        return HistoryItem(
          id: d.id,
          type: data['type'] as String? ?? 'unknown',
          title: data['title'] as String? ?? '',
          createdAt: DateTime.tryParse(data['createdAt']?.toString() ?? '') ??
              DateTime.now(),
          refId: data['refId'] as String?,
          url: data['url'] as String?,
        );
      }).toList();
      if (query != null && query.trim().isNotEmpty) {
        final q = query.toLowerCase();
        items = items
            .where((i) =>
                i.title.toLowerCase().contains(q) ||
                i.type.toLowerCase().contains(q))
            .toList();
      }
      return items;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  Future<void> deleteHistoryItem(String id) async {
    try {
      await _db.collection(AppConstants.historyCollection).doc(id).delete();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }
}
