import 'package:equatable/equatable.dart';

class HistoryItem extends Equatable {
  const HistoryItem({
    required this.id,
    required this.type,
    required this.title,
    required this.createdAt,
    this.refId,
    this.url,
  });

  final String id;
  final String type;
  final String title;
  final DateTime createdAt;
  final String? refId;
  final String? url;

  @override
  List<Object?> get props => [id, type, title, createdAt, refId, url];
}
